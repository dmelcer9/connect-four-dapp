import React from "react"
import PropTypes from "prop-types"

export default class BoardPiece extends React.Component{

  render(){
    var colorClass;
    switch(this.props.color){
      case 1:
        colorClass = "boardpiece-red";
        break;
      case 2:
        colorClass = "boardpiece-black";
        break;
      default:
        colorClass = "boardpiece-none";
        break;
    }

    if(!this.props.canMove){
      colorClass += " boardpiece-disabled";
    }

    return (
      <button disabled={!this.props.canMove} onClick={this.props.chandler} className={"boardpiece " + colorClass}></button>
    );
  }
}

BoardPiece.propTypes = {
  // 1=red, 2=black, else=none
  color: PropTypes.number.isRequired,

  canMove: PropTypes.bool.isRequired,

  //Callback when this component is clicked
  chandler: PropTypes.func
}
