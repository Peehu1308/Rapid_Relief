// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AidRequest {

    address public admin;

    uint public requestCount = 0;

    constructor() {
        admin = msg.sender;  // Whoever deploys the contract becomes the admin
    }

    // Struct for each aid request
    struct Request {
        uint id;
        address requester;
        string description;
        uint amount;
        bool approved;
        bool fulfilled;
    }


    mapping(uint => Request) public requests;


    event RequestCreated(uint id, address requester, string description, uint amount);
    event RequestApproved(uint id);
    event RequestFulfilled(uint id);


    function createRequest(string memory _description, uint _amount) public {
        require(_amount > 0, "Amount must be greater than 0");

        requestCount++;
        requests[requestCount] = Request(
            requestCount,
            msg.sender,
            _description,
            _amount,
            false,
            false
        );

        emit RequestCreated(requestCount, msg.sender, _description, _amount);
    }

    // Approve the request (Only Admin can approve)
    function approveRequest(uint _id) public {
        require(msg.sender == admin, "Only admin can approve requests");
        require(_id > 0 && _id <= requestCount, "Invalid Request ID");

        Request storage req = requests[_id];
        require(!req.approved, "Already approved");

        req.approved = true;

        emit RequestApproved(_id);
    }

    // Fulfill the request — sends ETH (Only Admin)
    function fulfillRequest(uint _id) public payable {
        require(msg.sender == admin, "Only admin can fulfill requests");
        require(_id > 0 && _id <= requestCount, "Invalid Request ID");

        Request storage req = requests[_id];
        require(req.approved, "Request not approved");
        require(!req.fulfilled, "Request already fulfilled");
        require(msg.value == req.amount, "Incorrect amount sent");

        req.fulfilled = true;

        payable(req.requester).transfer(msg.value);

        emit RequestFulfilled(_id);
    }

    // Helper: View a single request
    function getRequest(uint _id) public view returns(
        uint id,
        address requester,
        string memory description,
        uint amount,
        bool approved,
        bool fulfilled
    ) {
        require(_id > 0 && _id <= requestCount, "Invalid Request ID");

        Request storage req = requests[_id];
        return (req.id, req.requester, req.description, req.amount, req.approved, req.fulfilled);
    }
}
