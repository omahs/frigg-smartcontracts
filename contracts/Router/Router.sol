// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../Token/IFrigg.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

contract Router {
    //allow microsite front-end to listen to events and show recent primary market activity
    event SuccessfulPurchase(
        address indexed _buyer,
        address _friggTokenAddress,
        uint256 _amount
    );
    event SuccessfulExpiration(
        address indexed _seller,
        address _friggTokenAddress,
        uint256 _amount
    );

    /*
     ** Add token to router
     */
    mapping(address => TokenData) public tokenData;

    //USDC-denominated price is always 6 decimals
    struct TokenData {
        address issuer;
        address uIdContract;
        uint256 issuancePrice; // price = (1 * 10^18) / (USD * 10^6) e.g., 100USD = 10^18/10^8
        uint256 expiryPrice; // price = (1/(expirydigit) * 10^18) / (USD * 10^6) e.g., 200USD = 10^18/20^8
        address issuanceTokenAddress;
    }

    //@dev adds a Frigg-issued tokens to router
    //@param _outputTokenAddress Frigg-issued token address
    //@param _uIdContract Whitelister contract address
    //@param _issuer Issuer address to receive issuance proceeds
    //@param _issuancePrice Price of token at issuance
    //@param _expiryPrice Price of token at expiry date
    //@param _issuanceTokenAddress Address of Accepted token to purchase Frigg-issued token
    function add(
        address _outputTokenAddress,
        address _uIdContract,
        address _issuer,
        uint256 _issuancePrice,
        uint256 _expiryPrice,
        address _issuanceTokenAddress
    ) external {
        IAccessControl outputToken = IAccessControl(_outputTokenAddress);
        bytes32 DEFAULT_ADMIN_ROLE = 0x00;

        //require only admin of the Frigg-issued token can add token to router
        require(
            outputToken.hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "only token admin can add the token to this router"
        );
        tokenData[_outputTokenAddress] = TokenData(
            _issuer,
            _uIdContract,
            _issuancePrice,
            _expiryPrice,
            _issuanceTokenAddress
        );
    }

    /*
     ** Buy and Sell widget logic for primary market
     */

    //@param friggTokenAddress Frigg-issued token address
    //@param inputTokenAmount amount of tokens spent to buy Frigg-issued token
    //@dev initially users can only buy Frigg-issued asset backed tokens with USDC
    //i.e. inputToken is USDC and outputToken is the ABT
    //inputTokenAmount should be in the same number of decimals as issuanceTokenAddress implemented
    function buy(address friggTokenAddress, uint256 inputTokenAmount) external {
        require(inputTokenAmount > 0, "You cannot buy with 0 token");

        //check for user balance of UID
        require(
            IERC1155(tokenData[friggTokenAddress].uIdContract).balanceOf(
                msg.sender,
                0
            ) > 0,
            "Need a UID token"
        );

        IERC20 inputToken = IERC20(
            tokenData[friggTokenAddress].issuanceTokenAddress
        );
        IFrigg outputToken = IFrigg(friggTokenAddress);

        //check that primary market is active
        require(outputToken.isPrimaryMarketActive());

        inputToken.transferFrom(
            msg.sender,
            tokenData[friggTokenAddress].issuer,
            inputTokenAmount
        );

        //if inputTokenAmount is 1 USDC * 10^6, outputTokenAmount is 1 ATT * 10^18, issuancePrice is 1 ATT:1 USDC * 10^12
        uint256 outputTokenAmount = inputTokenAmount *
            tokenData[friggTokenAddress].issuancePrice;

        outputToken.mint(msg.sender, outputTokenAmount);

        emit SuccessfulPurchase(
            msg.sender,
            friggTokenAddress,
            inputTokenAmount
        );
    }

    //@param friggTokenAddress Frigg-issued token address
    //@param inputFriggTokenAmount amount of Frigg tokens for sale
    //i.e. inputToken is ABT and outputToken is USDC
    //inputAmount should be in 18 decimals
    function sell(address friggTokenAddress, uint256 inputFriggTokenAmount)
        external
    {
        require(inputFriggTokenAmount > 0, "You cannot sell 0 token");
        require(
            IERC1155(tokenData[friggTokenAddress].uIdContract).balanceOf(
                msg.sender,
                0
            ) > 0,
            "Need a UID token"
        );

        IFrigg inputToken = IFrigg(friggTokenAddress);
        IERC20 outputToken = IERC20(
            tokenData[friggTokenAddress].issuanceTokenAddress
        );

        require(inputToken.seeBondExpiryStatus());

        inputToken.burn(msg.sender, inputFriggTokenAmount);

        //if inputFriggTokenAmount is 1 ATT * 10^18, expiryPrice is 1.5 USDC : 1 ATT * 10^12, outputTokenAmount is 1.5 USDC * 10^6
        uint256 outputTokenAmount = inputFriggTokenAmount /
            tokenData[friggTokenAddress].expiryPrice;

        //Issuer SC address should give approval to router to transfer USDC to msg.sender prior to bond expiry
        outputToken.transferFrom(
            tokenData[friggTokenAddress].issuer,
            msg.sender,
            outputTokenAmount
        );

        emit SuccessfulExpiration(
            msg.sender,
            friggTokenAddress,
            inputFriggTokenAmount
        );
    }
}
