// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Interfaces/IRouterGater.sol";
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import "https://github.com/QuadrataNetwork/passport-contracts/blob/develop/contracts/interfaces/IQuadReader.sol";
import "https://github.com/QuadrataNetwork/passport-contracts/blob/develop/contracts/interfaces/IQuadPassport.sol";
/// after Quadrata merges their PR, update the relevant Github link
import "https://github.com/QuadrataNetwork/passport-contracts/blob/v2-optimizations/contracts/interfaces/IQuadPassportStore.sol";

contract routerGater is AccessControl {

    constructor (address _multisig, address _goldfinchUIDAddress, address _quadrataAddress) {
       
        _grantRole(DEFAULT_ADMIN_ROLE, _multisig);

        goldfinchUIDAddress = _goldfinchUIDAddress;
        quadrataAddress = _quadrataAddress;

        acceptedGoldfinchID_TYPE[0] = true;
        acceptedGoldfinchID_TYPE[1] = false;
        acceptedGoldfinchID_TYPE[2] = false;
        acceptedGoldfinchID_TYPE[3] = false;
        acceptedGoldfinchID_TYPE[4] = true;
        quadrataBlockedCountries["US"] = true;
    }

    /**
     * Establishes logic for gating via Goldfinch's UID
     * https://docs.goldfinch.finance/goldfinch/unique-identity-uid
     */

    address goldfinchUIDAddress;
    
    function updateGoldfinchUIDAddress (address _newgoldfinchUIDAddress) public {
        goldfinchUIDAddress = _newgoldfinchUIDAddress;
    }

    uint8[] goldfinchID_TYPE = [0,1,2,3,4];
    mapping (uint8 => bool) public acceptedGoldfinchID_TYPE;

    function updateAcceptedID_TYPE (uint8 _ID_TYPE, bool _valid) public onlyRole(DEFAULT_ADMIN_ROLE){
        acceptedGoldfinchID_TYPE[_ID_TYPE] = _valid;
    }

    function goldfinchLogic (address _account) public view override returns (bool _gatedStatus) {
        uint256 memory goldfinchID_TYPE_LENGTH = goldfinchID_TYPE.length;

        IERC1155 goldfinchUID = IERC1155(goldfinchUIDAddress);

        for (uint8 i = 0; i < goldfinchID_TYPE_LENGTH;) {
            if (goldfinchUID.balanceOf(_account, i) > 0 && acceptedGoldfinchID_TYPE[i]) {
                return true;
            }
            unchecked { ++i; }        
        } return false;
    }

    /**
     * Establishes logic for gating via Quadrata's Passports
     * https://docs.quadrata.com/integration/how-to-integrate/query-attributes/query-multiple-attributes
     */
    
    mapping (bytes32 => bool) public quadrataBlockedCountries;

    function updateQuadrataBlockedCountries (string _country) public onlyRole(DEFAULT_ADMIN_ROLE) {
        quadrataBlockedCountries[_country] = true;
    }

    address quadrataAddress;

    function updateQuadrataAddress (address _newQuadrataAddress) public {
        quadrataAddress = _newQuadrataAddress;
    } 
    
    /// not internal function so that composable
    function quadrataLogic(address _account) public view override returns (bool _gatedStatus) {
        
        IQuadReader quadrata = IQuadReader(quadrataAddress);

        bytes32[] memory attributesToQuery = new bytes32[](2);
        attributesToQuery[0] = keccak256("COUNTRY");
        attributesToQuery[1] = keccak256("AML");

        // get fee to query both `COUNTRY` & AML
        uint256 queryFeeBulk = quadrata.queryFeeBulk(_account, attributesToQuery);
        require(msg.value == queryFeeBulk, "MISSING QUERY FEE");

        IQuadPassportStore.Attribute[] memory attributes = quadrata.getAttributesBulk{value: queryFeeBulk}(_account, attributesToQuery);

        require(attributes.length == 2);
        require(!quadrataBlockedCountries[attributes[0].value], 'BANNED_COUNTRY');
        require(uint256(attributes[1].value) < 8, "High risk AML");
        return true;
    }

    /**
     * For primaryRouter.sol to access if an address passes the gating conditions
     */
    
    function checkGatedStatus(address _account) external payable override returns (bool _gatedStatus) {
        return (goldfinchLogic(_account) || quadrataLogic(_account));
    }
}