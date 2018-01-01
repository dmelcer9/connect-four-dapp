import React from "react"
import BoardPiece from "./boardPiece"
import PropTypes from "prop-types"
import BigNumber from "bignumber.js"

export default class Board extends React.Component{
  constructor(props){
    super(props);
    var arr = new Array(42);
    arr.fill(0);

    this.state = {board:arr, loading:true};
  }

  async refreshBoard(){
    
  }

  handleClick(id){
    console.log("Clicked " + String(id));
    this.setState(prevState=>{
      let prevColor = prevState.board[id];
      let newColor = (prevColor+1) % 3;
      prevState.board[id] = newColor;
      return prevState;
    })
  }

  render(){
    var className = "cboard";
    if(this.state.loading){
      className += " cboard-loading"
    }

    var board = [];
    for(var rowNum = 5; rowNum >= 0; rowNum--){
      var row = []
      for(var col = 0; col <= 6; col++){
        let cellId = (rowNum * 7) + col;
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
  gameId: PropTypes.instanceOf(BigNumber).isRequired,
  contract: PropTypes.any.isRequired

}
