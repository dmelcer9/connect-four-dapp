import React from 'react'
import BoardPiece from './boardPiece'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 6;
const BOARD_AREA = BOARD_WIDTH * BOARD_HEIGHT;

const gamePropMap = {
  "bid":0,
  "lastTimePlayed":1,
  "playerOneRed":2,
  "playerTwoBlack":3,
  "whoseTurn":4,
  "restricted":5,
  "isStarted":6,
  "gameOver":7
  //Board is a separate function call because solidity is stupid
};

export default class Board extends React.Component{
  constructor(props){
    super(props);
    var arr = new Array(BOARD_AREA);
    arr.fill(0);

    this.state = {
      game:[
        0,
        0,
        "Loading",
        "Loading",
        0,
        false,
        false,
        false,
        false
      ],
      board:arr,
      loading:true};

    this.refreshBoard();

    setTimeout(()=>this.autoBoardRefresh(), 1000);
  }

  async autoBoardRefresh(){
    //Don't stack refreshes
    if(!this.state.loading){
      //Don't spam calls, wait for previous to complete first.
      await this.refreshBoard();
    }

    setTimeout(()=>this.autoBoardRefresh(), 1000);
  }

  setLoadingAndRefreshBoard(){
    this.setLoading();
    setTimeout(()=>this.refreshBoard(),0);
  }

  setLoading(){
    this.setState({
      loading:true
    });
  }

  async refreshBoard(){
    const gameId = this.props.gameId;
    const account = this.props.account;
    const c4inst = this.props.c4inst;

    const game = await c4inst.games.call(gameId, {from:account});

    var board = await c4inst.getBoard.call(gameId,{from:account});
    var boardNums = board.map(bignum=>bignum.toNumber());
    this.setState({
      game: game,
      loading: false,
      board: boardNums
    })

    //console.log(boardNums);
  }

  detectWin(pieceToPlace, color){
    var boardCopy = Array.from(this.state.board);

    boardCopy[pieceToPlace] = color;

    var startIndices = Array.from(boardCopy.keys());

    //Find potential win at each idx
    var wins =  startIndices.map(idx => this.detectWinOnPotentialBoard(boardCopy, idx, color))
    //If no win was found, filter it out
                .filter(Boolean);

    if(wins.length == 0){
      console.log("Placing piece does not cause a win.");
      return false;
    } else{
      console.log("Placing piece does cause a win: " + wins[0]);
      return wins[0];
    }

  }

  //Will this move cause a win
  detectWinOnPotentialBoard(potentialBoard, startingLoc, color){
    const hasThreeSpacesUp = piece=> piece / BOARD_WIDTH < BOARD_HEIGHT - 3;
    const hasThreeSpacesToRight = piece=> piece % BOARD_WIDTH < BOARD_WIDTH - 3;
    const hasThreeSpacesToLeft = piece=> piece % BOARD_WIDTH >= 3;
    const both = (condition1, condition2) => (piece) => condition1(piece) && condition2(piece);

    const winDirections = [
      {
        type:"North",
        boundary: hasThreeSpacesToRight,
        offset: 7
      },
      {
        type:"Northeast",
        boundary: both(hasThreeSpacesUp, hasThreeSpacesToRight),
        offset: 8
      },
      {
        type:"East",
        boundary: hasThreeSpacesToRight,
        offset: 1
      },
      {
        type:"Northwest",
        boundary: both(hasThreeSpacesUp, hasThreeSpacesToLeft),
        offset: 6
      }
    ];

    var potentialWins = winDirections
      //Must be in-bounds for that type of win
      .filter(direction => direction.boundary(startingLoc))
      //Get all pieces included in the win
      .map(direction => [startingLoc, startingLoc + direction.offset,
                        startingLoc + (2*direction.offset), startingLoc + (3*direction.offset)])
      //Do all pieces match the color?
      .filter(boardPiecesToCheck => boardPiecesToCheck.every(piece => potentialBoard[piece] == color));

    if(potentialWins.length == 0){
      return false;
    } else{
      return potentialWins[0];
    }

  }

  getGameState(whichOne){
    return this.state.game[gamePropMap[whichOne]];
  }

  async handleClick(pos){

    //If loading or not allowed, ignore clicks
    if(!this.isMoveAllowed(pos)){
      return;
    }

    console.log("Clicked " + String(pos));

    var maybeWin = this.detectWin(pos, this.getWhoIsPlayer());

    this.setLoading();

    try{
      if(maybeWin){
        var winStr = maybeWin.map(String);
        await this.props.c4inst.makeMoveAndClaimVictory(this.props.gameId, String(pos),
                                                        winStr, {from:this.props.account});
      } else{
        await this.props.c4inst.makeMove(this.props.gameId, String(pos),{from:this.props.account});
      }

    } catch(error){
      alert("Could not make move, see console for details.");
      console.error(error);
    }

    this.setLoadingAndRefreshBoard();
  }


  getWhoIsPlayer(){
    if(this.props.account === this.getGameState("playerOneRed")){
      return 1;
    } else if(this.props.account === this.getGameState("playerTwoBlack")){
      return 2;
    } else{
      return NaN;
    }
  }

  isPlayerOfGame(){
    return !isNaN(this.getWhoIsPlayer());
  }

  gameInProgress(){
    return this.getGameState("isStarted") && !this.getGameState("gameOver");
  }

  isCurrentlyPlaying(){
    return this.gameInProgress() && this.isPlayerOfGame()
      && (this.getWhoIsPlayer() == this.getGameState("whoseTurn"));
  }

  async forfeitButton(){

    if(this.isPlayerOfGame() && this.gameInProgress()){
      this.setLoading();
      try{
        await this.props.c4inst.forfeit(this.props.gameId, {from:this.props.account});
      } catch(error){
        alert("There was an error with forfeiting the game. Check console for details.");
        console.error(error);
      }
    } else if(this.isPlayerOfGame() && !this.getGameState("isStarted")){
      this.setLoading();
      try{
        await this.props.c4inst.cancelCreatedGame(this.props.gameId, {from:this.props.account});
      } catch(error){
        alert("There was an error when cancelling the game. Check console for details.");
        console.error(error);
      }
    }

    this.setLoadingAndRefreshBoard();

  }

  getForfeitDisabled(){
    return !this.isPlayerOfGame() || this.getGameState("gameOver");
  }

  getForfeitButtonText(){
    if(this.getGameState("isStarted")){
      return "Forfeit Game";
    } else{
      return "Cancel Game (refund)";
    }
  }

  isMoveAllowed(moveId){

    const spaceIsFree = this.state.board[moveId] == 0;
    const inBottomRow = moveId < BOARD_WIDTH;
    const hasPieceBelow = (!inBottomRow) && (this.state.board[moveId - BOARD_WIDTH] != 0);

    return !this.state.loading && this.isCurrentlyPlaying() && spaceIsFree && (inBottomRow || hasPieceBelow);
  }

  getStatusText(){
    if(!this.getGameState("isStarted")){
      return "Game has not started yet.";
    } else if(this.gameInProgress()){
      if(this.isPlayerOfGame()){
        var text = "";

        switch(this.getWhoIsPlayer()){
          case 1:
            text += "You are Player 1 (Red). ";
            break;
          case 2:
            text += "You are Player 2 (Black). ";
            break;
          default:
            return "There was an error getting the game status.";
            break;
        }

        if(this.isCurrentlyPlaying()){
          text += "It is your turn!"
        }

        return text;

      } else{
        return "You are spectating this game.";
      }
    } else if(this.getGameState("gameOver")){
      return "The game has ended.";
    } else{
      return "There was an error getting the game status.";
    }
  }

  render(){
    var boardClassName = "cboard";
    if(this.state.loading){
      boardClassName += " cboard-loading"
    }

    var status

    var board = [];
    for(var rowNum = BOARD_HEIGHT - 1; rowNum >= 0; rowNum--){
      var row = []
      for(var col = 0; col < BOARD_WIDTH; col++){
        let cellId = (rowNum * BOARD_WIDTH) + col;
        var cellColor = this.state.board[cellId];
        row.push(
          <BoardPiece canMove={this.isMoveAllowed(cellId)} key={cellId} color={cellColor} chandler={()=>this.handleClick(cellId)}/>
        )
      }
      board.push(
        <div key={rowNum} className="row">
        {row}
        </div>
      );
    }

    return (
      <div className="w3-panel w3-animate-bottom">
        <div className="w3-card">
          <header className="w3-container w3-blue">
            <span className="w3-left">
              <h2>Game {this.props.gameId.toString()}</h2>
            </span>

            <span className="w3-right">
              <button className="w3-margin w3-btn w3-red" disabled={this.getForfeitDisabled()} onClick={()=>this.forfeitButton()}>
                {this.getForfeitButtonText()}
              </button>
              <button className="w3-margin w3-btn w3-blue-grey" onClick={()=>this.setLoadingAndRefreshBoard()}>Refresh</button>
              <button className="w3-margin w3-btn w3-blue-grey" onClick={()=>this.props.closeBoard()}>Close Game</button>
            </span>
          </header>

          <div className="w3-panel w3-center">
            <div className={boardClassName}>
              {board}
            </div>
          </div>

          <footer className="w3-container w3-blue">
            <h6>{this.getStatusText()}</h6>
          </footer>
        </div>
      </div>
    );
  }
}

Board.propTypes = {
  gameId: PropTypes.any.isRequired,
  c4inst: PropTypes.any.isRequired,
  account: PropTypes.string.isRequired,
  closeBoard: PropTypes.func.isRequired
}
