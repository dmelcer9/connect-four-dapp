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

  getGameState(whichOne){
    return this.state.game[gamePropMap[whichOne]];
  }

  handleClick(id){

    //If loading, ignore clicks
    if(this.state.loading){
      return;
    }

    console.log("Clicked " + String(id));


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
          <BoardPiece key={cellId} color={cellColor} chandler={()=>this.handleClick(cellId)}/>
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
            <h6>You are spectating this game</h6>
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
