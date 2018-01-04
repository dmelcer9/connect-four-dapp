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

  async refreshBoard(){
    const gameId = this.props.gameId;
    const account = this.props.account;
    const c4inst = this.props.c4inst;

    var board = await c4inst.getBoard.call(gameId,{from:account});
    var boardNums = board.map(bignum=>bignum.toNumber());
    this.setState(prevState=>{
      prevState.board = boardNums;
      prevState.loading = false;
      return prevState;
    })
  }

  handleClick(id){

    //If loading, ignore clicks
    if(this.state.loading){
      return;
    }

    console.log("Clicked " + String(id));
    this.setState(prevState=>{
      prevState.loading = true;

      let prevColor = prevState.board[id];
      let newColor = (prevColor+1) % 3;
      prevState.board[id] = newColor;

      return prevState;
    })



    this.refreshBoard();
  }

  render(){
    var className = "w3-panel w3-card cboard";
    if(this.state.loading){
      className += " cboard-loading"
    }

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
      <div className={className}>
      {board}
      </div>
    );
  }
}

Board.propTypes = {
  gameId: PropTypes.any.isRequired,
  c4inst: PropTypes.any.isRequired,
  account: PropTypes.string.isRequired
}
