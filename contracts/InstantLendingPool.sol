// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InstantLendingPool
 * @dev Instant liquidation protocol on MegaETH
 */
contract InstantLendingPool is Ownable, ReentrancyGuard {
    struct UserPosition {
        uint256 supplied;
        uint256 borrowed;
        uint256 lastUpdateTime;
    }
    
    mapping(address => UserPosition) public positions;
    
    uint256 public constant LIQUIDATION_THRESHOLD = 150;
    uint256 public constant LIQUIDATION_BONUS = 105;
    uint256 public mockPrice = 2000 ether;
    
    event Supplied(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Liquidated(address indexed liquidator, address indexed user, uint256 debtRepaid, uint256 collateralSeized);
    
    constructor() Ownable(msg.sender) {}
    
    function supply() external payable {
        require(msg.value > 0, "No ETH supplied");
        
        positions[msg.sender].supplied += msg.value;
        positions[msg.sender].lastUpdateTime = block.timestamp;
        
        emit Supplied(msg.sender, msg.value);
    }
    
    function borrow(uint256 amount) external {
        require(positions[msg.sender].supplied > 0, "No collateral");
        
        uint256 maxBorrow = (positions[msg.sender].supplied * mockPrice * 100) / (LIQUIDATION_THRESHOLD * 1 ether);
        require(positions[msg.sender].borrowed + amount <= maxBorrow, "Exceeds borrow limit");
        
        positions[msg.sender].borrowed += amount;
        positions[msg.sender].lastUpdateTime = block.timestamp;
        
        emit Borrowed(msg.sender, amount);
    }
    
    function getHealthFactor(address user) public view returns (uint256) {
        UserPosition memory pos = positions[user];
        if (pos.borrowed == 0) return type(uint256).max;
        
        uint256 collateralValue = (pos.supplied * mockPrice) / 1 ether;
        return (collateralValue * 100) / pos.borrowed;
    }
    
    function liquidate(address user) external nonReentrant {
        require(getHealthFactor(user) < 100, "Position is healthy");
        
        UserPosition storage pos = positions[user];
        uint256 debtToRepay = pos.borrowed;
        uint256 collateralToSeize = (debtToRepay * LIQUIDATION_BONUS) / 100;
        
        require(collateralToSeize <= pos.supplied, "Insufficient collateral");
        
        pos.borrowed = 0;
        pos.supplied -= collateralToSeize;
        
        payable(msg.sender).transfer(collateralToSeize);
        
        emit Liquidated(msg.sender, user, debtToRepay, collateralToSeize);
    }
}

