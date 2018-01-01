import React from "react"

export default class BoardPiece extends React.Component{
  render(){
    var colorClass;
    switch(this.props.color){
      case "1": case 1:
        colorClass = "boardpiece-red";
        break;
      case "2": case 2:
        colorClass = "boardpiece-black";
        break;
      default:
        colorClass = "boardpiece-none";
        break;
    }

    return (
      <button onClick={this.props.chandler} className={"boardpiece " + colorClass}></button>
    );
  }
}
