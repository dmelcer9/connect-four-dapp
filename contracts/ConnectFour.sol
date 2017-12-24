pragma solidity ^0.4.18;

import "../node_modules/zeppelin-solidity/contracts/payment/PullPayment.sol";
//function asyncSend(address dest, uint256 amount) internal;
//function withdrawPayments() public;

contract ConnectFour is PullPayment {

  enum BoardPiece {NONE, RED, BLACK}

  //Encapsulates total game lead.
  struct GameState {
    uint bid; //How much each player bids
    uint lastTimePlayed; //When was the last move made?

    address playerOneRed;
    address playerTwoBlack;

    //Board is 7 columns by 6 rows
    //0 is the bottom-left corner of the board
    //1 is the second from the left on the bottom
    //6 is the bottom-right corner
    //7 is the left on the second-to-bottom row
    //41 is the top-right
    BoardPiece[42] board;

    BoardPiece whoseTurn;

    bool restricted;
    bool isStarted;
    bool gameOver;
  }

  event logGameCreated(uint gameId, bool restricted);
  event logGameStart(uint gameId);
  event logMoveMade(uint gameId, BoardPiece who, uint8 position);
  event logGameEnd(uint gameId, address winner);
  event logGameCancel(uint gameId);

  //How long someone has to move before the other player can claim victory
  uint public moveTimeout;

  //Counter so each game has a unique ID
  uint nextID;

  //The state of all the games
  mapping (uint => GameState) games;

  modifier onlyGameExists(uint gameId) {
    require(games[gameId].playerOneRed != 0);
    _;
  }

  modifier onlyWhileNotStarted(uint gameId) {
    require(!games[gameId].isStarted && !games[gameId].gameOver);
    _;
  }

  modifier onlyWhilePlaying(uint gameId) {
    require(games[gameId].isStarted && !games[gameId].gameOver);
    _;
  }

  modifier onlyPlayers(uint gameId) {
    require(msg.sender == games[gameId].playerOneRed
      || msg.sender == games[gameId].playerTwoBlack);
      _;
  }

  modifier onlyActivePlayer(uint gameId) {
    require(msg.sender == getActivePlayer(gameId));
    _;
  }

  modifier onlyInactivePlayer(uint gameId) {
    require(msg.sender == getInactivePlayer(gameId));
    _;
  }

  modifier onlyGameCreator(uint gameId) {
    require(msg.sender == games[gameId].playerOneRed);
    _;
  }

  modifier onlyAfterTimeout(uint gameId) {
    require(now > games[gameId].lastTimePlayed + moveTimeout);
    _;
  }

  function ConnectFour(uint timeout) public {
    moveTimeout = timeout;
  }

  function() public {
    revert();
  }

  function createNewGame() external payable {
    uint gameId = createUniqueId();
    createNewGameEntry(gameId);
  }

  function createNewRestrictedGame(address playerTwo) external payable {
    require(playerTwo != msg.sender);
    uint gameId = createUniqueId();
    games[gameId].restricted = true;
    games[gameId].playerTwoBlack = playerTwo;
    createNewGameEntry(gameId);
  }

  function joinGame(uint gameId) external payable
    onlyGameExists(gameId)
    onlyWhileNotStarted(gameId)
  {
    require(getPlayerOne(gameId) != msg.sender);
    require(msg.value == getBid(gameId));

    if (getRestricted(gameId)) {
      require(games[gameId].playerTwoBlack == msg.sender);
    } else {
      games[gameId].playerTwoBlack = msg.sender;
    }

    games[gameId].lastTimePlayed = now;
    games[gameId].isStarted = true;
    games[gameId].whoseTurn = BoardPiece.RED;
    logGameStart(gameId);
  }

  function cancelCreatedGame(uint gameId)
    external
    onlyGameExists(gameId)
    onlyWhileNotStarted(gameId)
    onlyGameCreator(gameId)
  {
    games[gameId].isStarted = true;
    games[gameId].gameOver = true;

    asyncSend(msg.sender, games[gameId].bid);

    logGameCancel(gameId);
  }

  function forfeit(uint gameId)
    external
    onlyWhilePlaying(gameId)
    onlyPlayers(gameId)
  {
    if (msg.sender == games[gameId].playerOneRed) {
      gameEnd(gameId, games[gameId].playerTwoBlack);
    } else if (msg.sender == games[gameId].playerTwoBlack) {
      gameEnd(gameId, games[gameId].playerOneRed);
    } else {
      //This should never happen
      revert();
    }
  }

  function claimTimeoutVictory(uint gameId)
    external
    onlyAfterTimeout(gameId)
    onlyInactivePlayer(gameId)
    onlyWhilePlaying(gameId)
  {
    gameEnd(gameId, getInactivePlayer(gameId));
  }

  //The pieces in toClaim must be sorted positions, least to greatest
  function makeMoveAndClaimVictory(uint gameId, uint8 moveToMake, uint8[4] claim)
    external
    onlyActivePlayer(gameId)
    onlyWhilePlaying(gameId)
  {
    BoardPiece player = games[gameId].whoseTurn;
    address playerAddress = getActivePlayer(gameId);

    makeMove(gameId, moveToMake);

    require(checkHasWon(gameId, player, claim));

    gameEnd(gameId,playerAddress);
  }

  function makeMove(uint gameId, uint8 position)
    public
    onlyActivePlayer(gameId)
    onlyWhilePlaying(gameId)
  {
    BoardPiece player = games[gameId].whoseTurn;

    require(position >= 0 && position <= 41);
    require(games[gameId].board[position] == BoardPiece.NONE);

    if (position >= 7){
      require(games[gameId].board[position - 7] != BoardPiece.NONE);
    }

    games[gameId].board[position] = player;

    if (player == BoardPiece.RED) {
      games[gameId].whoseTurn = BoardPiece.BLACK;
    } else {
      games[gameId].whoseTurn = BoardPiece.RED;
    }

    logMoveMade(gameId, player, position);
  }

  function checkHasWon(uint gameId, BoardPiece who, uint8[4] moves) constant public returns(bool){
    for(uint8 i = 0; i<4; i++){
      require(moves[i] >= 0 && moves[i] <= 41);
      require(games[gameId].board[moves[i]] == who);
    }

    return true;

  }

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

  function getActivePlayer(uint gameId) constant internal returns(address){
    BoardPiece player = games[gameId].whoseTurn;

    if (player == BoardPiece.RED) {
      return games[gameId].playerOneRed;
    } else if (player == BoardPiece.BLACK) {
      return games[gameId].playerTwoBlack;
    } else {
      revert();
    }
  }

  function getInactivePlayer(uint gameId) constant internal returns(address){
    BoardPiece player = games[gameId].whoseTurn;

    if (player == BoardPiece.RED) {
      return games[gameId].playerTwoBlack;
    } else if (player == BoardPiece.BLACK) {
      return games[gameId].playerOneRed;
    } else {
      revert();
    }
  }

  function createUniqueId() private returns(uint) {
    return nextID++;
  }


  function createNewGameEntry(uint gameId) private{
    games[gameId].bid = msg.value;
    games[gameId].playerOneRed = msg.sender;
    logGameCreated(gameId, false);
  }

  function gameEnd(uint gameId, address winner) private {
    games[gameId].gameOver = true;
    uint256 payout = games[gameId].bid * 2;

    asyncSend(winner, payout);

    logGameEnd(gameId, winner);
  }

}
