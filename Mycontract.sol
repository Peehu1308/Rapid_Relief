// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DonationPool {
    address public owner;
    uint256 public totalDonations;

    mapping(address => uint256) public donations;

    event Donated(address indexed donor, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function donate() public payable {
        require(msg.value > 0, "Donation must be greater than 0");
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;
        emit Donated(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public {
        require(msg.sender == owner, "Only the owner can withdraw");
        require(amount <= totalDonations, "Insufficient funds");

        totalDonations -= amount;
        payable(owner).transfer(amount);
        emit Withdrawn(owner, amount);
    }

    function checkDonationBalance(address donor) public view returns (uint256) {
        return donations[donor];
    }
}
