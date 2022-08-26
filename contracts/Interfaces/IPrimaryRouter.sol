// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPrimaryRouter {

    function buy(address friggTokenAddress, uint256 inputTokenAmount) external;

    function sell(address friggTokenAddress, uint256 inputFriggTokenAmount) external;

}

