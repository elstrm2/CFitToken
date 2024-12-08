// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CFITTOKEN is ERC20, Ownable {
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lockDuration;
    }

    mapping(address => Stake[]) public stakes;

    event Staked(address indexed user, uint256 amount, uint256 lockDuration);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);

    constructor(uint256 initialSupply) ERC20("CFITTOKEN", "CFIT") {
        _mint(msg.sender, initialSupply);
    }

    function transferTokens(address to, uint256 amount) external returns (bool) {
        return transfer(to, amount);
    }

    function stake(uint256 amount, uint256 lockDuration) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient tokens for staking");
        require(lockDuration >= 1 days && lockDuration <= 365 days, "Invalid lock duration");

        _transfer(msg.sender, address(this), amount);

        require(balanceOf(address(this)) >= amount, "Contract balance is incorrect after staking");

        stakes[msg.sender].push(Stake({
            amount: amount,
            timestamp: block.timestamp,
            lockDuration: lockDuration
        }));

        emit Staked(msg.sender, amount, lockDuration);
    }

    function withdrawStake(uint256 stakeIndex) external {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        Stake memory userStake = stakes[msg.sender][stakeIndex];
        require(block.timestamp >= userStake.timestamp + userStake.lockDuration, "Stake is still locked");

        uint256 reward = (userStake.amount * 10 * userStake.lockDuration) / (365 days * 100);

        require(balanceOf(address(this)) >= userStake.amount + reward, "Not enough tokens in contract for transfer");

        _transfer(address(this), msg.sender, userStake.amount + reward);

        emit Withdrawn(msg.sender, userStake.amount, reward);

        stakes[msg.sender][stakeIndex] = stakes[msg.sender][stakes[msg.sender].length - 1];
        stakes[msg.sender].pop();
    }

    function getStakeCount(address user) external view returns (uint256) {
        return stakes[user].length;
    }

    function getStake(address user, uint256 stakeIndex) external view returns (Stake memory) {
        require(stakeIndex < stakes[user].length, "Invalid stake index");
        return stakes[user][stakeIndex];
    }
}
