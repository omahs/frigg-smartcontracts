// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
 * This interface is specific for Frigg-implemented tokens
 */

interface IFrigg {
    /**
     * @dev returns if primary market is opened.
     */
    function isPrimaryMarketActive() external view returns (bool);

    /**
     * @dev returns if the bond has expired and the issuer starts to conduct buyback.
     */
    function seeBondExpiryStatus() external view returns (bool);

    /**
     * @dev for primaryRouter.sol to conduct primary buy logic at issuance
     */

    function mint(address account, uint256 amount) external;

    /**
     * @dev for primaryRouter.sol to conduct primary sell logic at expiry
     */

    function burn(address account, uint256 amount) external;

    /**
     * @dev a getter function for dApps or third parties to fetch the terms and conditions
     */
    function termsURL() external view returns (string memory);
}
