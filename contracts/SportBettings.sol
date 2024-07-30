// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./FeeProxy.sol";

contract SportBettings {
    address public admin;
    FeeProxy public feeProxy;

    uint256 private totalTeamsCreated;
    uint256 private withdrawableCommision;

    bool private locked;

    struct Bet {
        uint256 amount;
        bool hasClaimed;
        uint8 favoriteTeam;
    }

    struct Match {
        uint256 matchId;
        string teamA;
        string teamB;
        bool isSettled;
        uint256 winner;
        uint256 totalBetsTeamA;
        uint256 totalBetsTeamB;
    }

    // Mapping of matchId to Match
    mapping(uint256 => Match) public matches;
    // Mapping of user to matchId to bet
    mapping(address => mapping(uint256 => Bet)) public userBets;
    // Mapping of team and team to id
    mapping(string => mapping(string => uint256)) public matchTeamId;

    modifier onlyAdmin(){
        require(msg.sender == admin);
        _;
    }    

    modifier matchExists(uint256 matchId){
        require(matches[matchId].matchId == matchId, "MATCH DOES NOT EXIST");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "REENTRANCY ATTACK DETECTED");
        locked = true;
        _;
        locked = false;
    }

    constructor(address _feeProxy){
        feeProxy = FeeProxy(_feeProxy);
        admin = msg.sender;
    }

    function createMatch(string memory teamA, string memory teamB) public onlyAdmin{
        require(bytes(teamA).length>0 && bytes(teamB).length>0, "INVALID TEAM NAMES");
        uint256 matchId = matchTeamId[teamA][teamB];
        require(matchId==0, "MATCH TEAM ALREADY CREATED");
        matchTeamId[teamA][teamB] = ++totalTeamsCreated;
    }

    function openMatch(string memory teamA, string memory teamB) public onlyAdmin {
        uint256 teamId = matchTeamId[teamA][teamB];
        require(teamId>0, "MATCH TEAM NOT YET CREATED");
        matches[teamId] = Match({
            matchId: teamId,
            teamA: teamA,
            teamB: teamB,
            isSettled: false,
            winner: 0,
            totalBetsTeamA: 0,
            totalBetsTeamB: 0
        });
    }

    function placeBet(uint256 matchId, uint8 favoriteTeam) public payable matchExists(matchId) {
        require(msg.value>0, "NOT ENOUGHT AMOUNT");
        require(favoriteTeam == 1 || favoriteTeam == 2, "SELECT 1 FOR FIRST TEAM AND 2 FOR SECOND TEAM");
        
        if(favoriteTeam == 1){
            matches[matchId].totalBetsTeamA += msg.value;
        } else {
            matches[matchId].totalBetsTeamB += msg.value;
        }

        userBets[msg.sender][matchId].hasClaimed = false;
        userBets[msg.sender][matchId].amount += msg.value;
        userBets[msg.sender][matchId].favoriteTeam = favoriteTeam;
    }

    function settleMatch(uint256 matchId, uint8 winner) public onlyAdmin matchExists(matchId) nonReentrant{
        require(matches[matchId].isSettled == false, "MATCH ALREADY SETTLED");
        require(winner == 0 || winner == 1 || winner == 2, "SELECT 0 IF MATCH, 1 IF WINNER FIRST TEAM OR 2 IF WINNER SECOND TEAM");
        matches[matchId].isSettled = true;
        matches[matchId].winner = winner;

        uint256 feeWithdrawable = (getTotalAmountBet(matchId) * feeProxy.getFeePercent()) / 100;
        (bool success, ) = payable(admin).call{value: feeWithdrawable}("");
        require(success, "FAILED TRANSFER TO OWNER");
    }

    function withdrawWinnings(uint256 matchId) public matchExists(matchId) nonReentrant{
        require(!userBets[msg.sender][matchId].hasClaimed, "BET ALREADY CLAIMED");
        require(matches[matchId].isSettled, "MATCH NOT YET SETTLED");
        
        require(userBets[msg.sender][matchId].amount > 0);
        
        uint256 userBetAmount = userBets[msg.sender][matchId].amount;

        uint256 winner = matches[matchId].winner;

        uint256 totalBetAmount;
        uint256 winningAmount;

        uint256 totalAmountBet = matches[matchId].totalBetsTeamA + matches[matchId].totalBetsTeamB;
        // require(totalAmountBet > 0, "NO BETS PLACED IN THIS MATCH");
        uint256 totalWithdrawable = totalAmountBet * (100 - feeProxy.getFeePercent()) / 100;

        if(winner == 1 && userBets[msg.sender][matchId].favoriteTeam == 1) {
            totalBetAmount = matches[matchId].totalBetsTeamA;
            winningAmount = (userBetAmount * totalWithdrawable) / totalBetAmount;
        } else if(winner == 2 && userBets[msg.sender][matchId].favoriteTeam == 2){
            totalBetAmount = matches[matchId].totalBetsTeamB;
            winningAmount = (userBetAmount * totalWithdrawable) / totalBetAmount;
        } else {
            winningAmount = 0;
        }

        userBets[msg.sender][matchId].hasClaimed = true;
        userBets[msg.sender][matchId].amount = 0;
        (bool success, ) = payable(msg.sender).call{value: winningAmount}("");
        require(success, "TRANSFER FAILED");
    }

    function getContractBalance() public view returns(uint256){
        return address(this).balance;
    }

    function getTotalAmountBet(uint256 matchId) public view returns(uint256){
        return matches[matchId].totalBetsTeamA + matches[matchId].totalBetsTeamB;
    }

}