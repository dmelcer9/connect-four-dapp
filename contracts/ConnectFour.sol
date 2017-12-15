//pragma solidity ^0.4.14

import '../node_modules/zeppelin-solidity/contracts/payment/PullPayment.sol';
//function asyncSend(address dest, uint256 amount) internal;
//function withdrawPayments() public;

contract ConnectFour is PullPayment {

  enum BoardPiece {NONE, RED, BLACK}
  struct GameState {
    uint bid; //How much each player bids
    uint lastTimePlayed; //When was the last move made?

    address playerOneRed;
    address playerTwoBlack;

    //Board is 7 columns by 6 rows
    //0 is the bottom-left corner of the board
    //1 is the second from the left on the bottom
    //6 is the botto-right corner
    //7 is the left on the second-to-bottom row
    BoardPiece[42] board;

    BoardPiece whoseTurn;

    bool restricted;
    bool isStarted;
    bool gameOver;
  }

  event GameCreated(uint gameId, bool restricted);
  event GameStart(uint gameId);
  event MoveMade(uint gameId, BoardPiece who, uint8 position);


  uint nextID;

  mapping (uint => GameState) games;

  function getBid(uint gameId) constant public returns(uint) {
    return games[gameId].bid;
  }

  function getLastTimePlayed(uint gameId) constant public returns(uint){
    return games[gameId].lastTimePlayed;
  }

  function getPlayerOne(uint gameId) constant public returns(address){
    return games[gameId].playerOneRed;
  }

  function getPlayerTwo(uint gameId) constant public returns(address){
    return games[gameId].playerTwoBlack;
  }

  function getBoard(uint gameId) constant public returns(BoardPiece[42]){
    return games[gameId].board;
  }

  function getWhoseTurn(uint gameId) constant public returns(BoardPiece){
    return games[gameId].whoseTurn;
  }

  function getRestricted(uint gameId) constant public returns(bool){
    return games[gameId].restricted;
  }

  function getIsStarted(uint gameId) constant public returns(bool){
    return games[gameId].isStarted;
  }

  function getGameOver(uint gameId) constant public returns(bool){
    return games[gameId].gameOver;
  }

  function createUniqueId() internal returns(uint) {
    return nextID++;
  }

  function createNewGame() external payable {
    uint id = createUniqueId();
    games[id].bid = msg.value;
    games[id].playerOneRed = msg.sender;
    GameCreated(id, false);
  }

  function joinGame(uint gameId) external payable {
    require(getPlayerOne(gameId) != 0);
    require(getPlayerOne(gameId) != msg.sender);
  }


}
