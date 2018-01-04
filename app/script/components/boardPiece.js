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

    return (
      <button onClick={this.props.chandler} className={"boardpiece " + colorClass}></button>
    );
  }
}

BoardPiece.propTypes = {
  // 1=red, 2=black, else=none
  color: PropTypes.number.isRequired,

  //Callback when this component is clicked
  chandler: PropTypes.func
}
