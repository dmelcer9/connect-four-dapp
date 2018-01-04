import React from 'react'
import BoardPiece from './boardPiece'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 6;
const BOARD_AREA = BOARD_WIDTH * BOARD_HEIGHT;

export default class Board extends React.Component{
  constructor(props){
    super(props);
    var arr = new Array(BOARD_AREA);
    arr.fill(0);

    this.state = {board:arr, loading:true};

    this.refreshBoard();
  }

  setLoadingAndRefreshBoard(){
    this.setState({
      loading:true
    })
    setTimeout(()=>this.refreshBoard(),0);
  }

  async refreshBoard(){
    const gameId = this.props.gameId;
    const account = this.props.account;
    const c4inst = this.props.c4inst;

    var board = await c4inst.getBoard.call(gameId,{from:account});
    var boardNums = board.map(bignum=>bignum.toNumber());
    this.setState({
      board: boardNums,
      loading: false
    })

    console.log(boardNums);
  }

  handleClick(id){

    //If loading, ignore clicks
    if(this.state.loading){
      return;
    }

    console.log("Clicked " + String(id));
    this.setState(prevState=>{

      let prevColor = prevState.board[id];
      let newColor = (prevColor+1) % 3;
      prevState.board[id] = newColor;

      return prevState;
    })

    this.setLoadingAndRefreshBoard();
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
              <button className="w3-margin w3-btn w3-green" onClick={()=>this.setLoadingAndRefreshBoard()}>Refresh</button>
              <button className="w3-margin w3-btn w3-red">Forfeit</button>
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
  account: PropTypes.string.isRequired
}
