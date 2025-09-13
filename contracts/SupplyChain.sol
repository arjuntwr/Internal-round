// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    struct Transfer {
        address from;
        address to;
        uint256 price;
        uint256 timestamp;
    }

    struct Produce {
        uint256 batchId;
        string cropName;
        uint256 quantity;
        string harvestDate;
        address farmer;
        Transfer[] history;
    }

    mapping(uint256 => Produce) public produces;
    uint256 public nextBatchId;

    event ProduceAdded(uint256 batchId, string cropName, uint256 quantity, string harvestDate, address farmer);
    event OwnershipTransferred(uint256 batchId, address from, address to, uint256 price);

    function addProduce(
        string memory _cropName,
        uint256 _quantity,
        string memory _harvestDate
    ) public {
        uint256 batchId = nextBatchId++;
        Produce storage p = produces[batchId];
        p.batchId = batchId;
        p.cropName = _cropName;
        p.quantity = _quantity;
        p.harvestDate = _harvestDate;
        p.farmer = msg.sender;

        emit ProduceAdded(batchId, _cropName, _quantity, _harvestDate, msg.sender);
    }

    function transferOwnership(uint256 _batchId, address _to, uint256 _price) public {
        Produce storage p = produces[_batchId];
        require(p.farmer != address(0), "Produce does not exist");
        
        Transfer memory t = Transfer(msg.sender, _to, _price, block.timestamp);
        p.history.push(t);

        emit OwnershipTransferred(_batchId, msg.sender, _to, _price);
    }

    function getProduce(uint256 _batchId) public view returns (
        string memory, uint256, string memory, address, Transfer[] memory
    ) {
        Produce storage p = produces[_batchId];
        return (p.cropName, p.quantity, p.harvestDate, p.farmer, p.history);
    }
}

