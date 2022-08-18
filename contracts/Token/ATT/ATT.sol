// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../IFrigg.sol";

contract ATT is ERC20Capped, AccessControl, IFrigg {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    using SafeERC20 for ERC20;

    //cap the supply of token to 17,000
    constructor(address _multisig, address _router)
        ERC20("Agatobwe", "DTT")
        ERC20Capped(170000 * (10**18))
    {
        //set DEFAULT_ADMIN_ROLE to a multisig address controlled by Frigg
        _grantRole(DEFAULT_ADMIN_ROLE, _multisig);

        //set MINTER_ROLE to router
        _grantRole(MINTER_ROLE, _router);
    }

    function mint(address _to, uint256 _amount)
        public
        override
        onlyRole(MINTER_ROLE)
    {
        _mint(_to, _amount);
    }

    function burn(address _to, uint256 _amount) public override {
        _burn(_to, _amount);
    }

    //@dev as totalSupply = cap, this function returns false
    function isPrimaryMarketActive() public view override returns (bool) {
        return totalSupply() < cap();
    }

    //default value is false
    bool public isBondExpired;

    //deployer of this contract can modify the value of isBondExpired
    function setBondExpiry() public onlyRole(DEFAULT_ADMIN_ROLE) {
        isBondExpired = true;
    }

    //getter function for router contract to access variable
    function seeBondExpiryStatus() public view override returns (bool) {
        return isBondExpired;
    }

    string public termsATT = "https://www.frigg.eco/";
}
