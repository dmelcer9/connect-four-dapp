import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'

const LOADING_GAME_MESSAGE = "Loading Details...";

export default class GameManager extends React.Component{
  constructor(props){
    super(props);

    this.state = {
      inputBid: 0.01,
      inputRestrictedAddress: "",
      inputGameId: 0,
      statusText: LOADING_GAME_MESSAGE
    }

    this.updateStatusText();
  }

  async updateStatusText(){

  }

  setStatusText(text){
    this.setState({
      statusText: text
    });
  }

  async createGame(){

    var value;

    try{
      var inputBidNum = String(this.state.inputBid);
      console.log(inputBidNum);
      value = this.props.web3.utils.toWei(inputBidNum,"ether");
    } catch(error){
      console.error(error);
      this.setStatusText("Please enter a valid bid.");
      return;
    }

    this.setStatusText("Creating game...");

    try{
      var transaction = await this.props.c4inst.createNewGame({
        from: this.props.account,
        value: value
      });

      console.log(transaction);

      var createdId = transaction.logs[0].args.gameId;

      this.setStatusText("Created a game with ID " + createdId.toString());

      this.props.gameAdd(createdId);
    } catch(error){
      console.error(error);
      this.setStatusText("There was some sort of error. Check the transaction history to see what happened");
    }
  }

  render(){
    return (
      <div id="gameManager">
        <button onClick={()=>this.createGame()}>Create Game</button>
        <p>{this.state.statusText}</p>
      </div>);
  }
}

GameManager.propTypes = {
  c4inst: PropTypes.any.isRequired,
  account: PropTypes.string.isRequired,
  web3: PropTypes.any.isRequired,

  //Accepts a BigNumber with a game to add
  gameAdd: PropTypes.func.isRequired
}
