// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/*
 * This interface is implemented for router to interact
 */

interface IFrigg {
    /**
     * @dev returns if primary market is opened. This is specific for Frigg-implemented tokens.
     */
    function isPrimaryMarketActive() external view returns (bool);

    /**
     * @dev returns if the bond has expired and issuer starts to conduct buyback. This is specific for Frigg-implemented tokens.
     */
    function seeBondExpiryStatus() external view returns (bool);

    function mint(address account, uint256 amount) external;

    function burn(address account, uint256 amount) external;
}
