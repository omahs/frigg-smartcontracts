// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRouterGater {

    function goldfinchLogic (address _account) external view returns (bool);

    function quadrataLogic(address _account) external view returns (bool);

    function checkGatedStatus(address _account) external view returns (bool);
}