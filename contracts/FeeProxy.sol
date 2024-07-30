// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract FeeProxy {
    address public admin;
    uint256 private feePercent = 3;
    // uint256 private totalFeesCollected;

    modifier onlyAdmin(){
        require(msg.sender == admin, "NOT ADMIN");
        _;
    }

    constructor(){
        admin = msg.sender;
    }

    function setFeePercent(uint256 _feePercent) public onlyAdmin{
        require(_feePercent<=100, "FEE PERCENT CANNOT EXCEED 100");
        feePercent = _feePercent;
    }

    function getFeePercent() public view returns(uint256){
        return feePercent;
    }

}