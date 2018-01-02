import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'

const LOADING_GAME_MESSAGE = "Loading Details...";
const NULL_ADDR = "0x0000000000000000000000000000000000000000";

export default class GameManager extends React.Component{
  constructor(props){
    super(props);

    this.state = {
      inputBid: 0.01,
      inputRestrictedAddress: "",
      inputGameId: 1,
      statusText: LOADING_GAME_MESSAGE
    }

    this.updateStatusText();
  }

  async updateStatusText(){
    const gameId = String(this.state.inputGameId);

    const fromac = {from: this.props.account};
    const c4inst = this.props.c4inst;

    const p1 = (await c4inst.getPlayerOne.call(gameId,fromac)).toLowerCase();
    const p2 = (await c4inst.getPlayerTwo.call(gameId,fromac)).toLowerCase();

    const isRestricted = await c4inst.getRestricted.call(gameId, fromac);
    const isStarted = await c4inst.getIsStarted.call(gameId, fromac);
    const gameOver = await c4inst.getGameOver.call(gameId, fromac);

    if(p1 === NULL_ADDR){
      this.setStatusText("Game ID " + gameId + " does not exist.");
      return;
    } else if(p2 === NULL_ADDR){
      if(p1 === this.props.account){
        this.setStatusText("You created this game!");
      } else {
        this.setStatusText("Game ID " + gameId + " is available to join");
      }
    } else if(isRestricted && !isStarted){
      if(p2 === this.props.account){
        this.setStatusText("Restricted game " + gameId + " is available to join");
      } else{
        this.setStatusText("This game is restricted.");
      }
    } else if(isStarted && !gameOver){
      this.setStatusText("Game ID " + gameId + " in progress.");
    } else{
      this.setStatusText("Game " + gameId + " over.");
    }

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
