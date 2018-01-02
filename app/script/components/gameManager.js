import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'

const LOADING_GAME_MESSAGE = "Loading Details...";
const NULL_ADDR = "0x0000000000000000000000000000000000000000";
const DEFAULT_STATUS = "Enter a Game ID or create a new game.";

/*
JoinAction is one of:
- "None": does nothing when the button is pressed
- "Load": adds the game with gameAdd prop
- "Join": sends a transaction to join the game and then adds with gameAdd
*/

export default class GameManager extends React.Component{
  constructor(props){
    super(props);

    this.state = {
      inputBid: 0.01,
      inputRestrictedAddress: "",
      inputGameId: "",
      statusText: DEFAULT_STATUS,
      joinButtonText: "Join Game",
      joinButtonDisabled: true,
      joinAction: "None"
    }

  }

  async updateStatusText(){
    const gameId = String(this.state.inputGameId);

    if(gameId === "") {
      this.setState({
        statusText: DEFAULT_STATUS,
        joinButtonDisabled : true,
        joinButtonText: "Join Game",
      });
      return;
    }

    const fromac = {from: this.props.account};
    const c4inst = this.props.c4inst;

    const p1 = (await c4inst.getPlayerOne.call(gameId,fromac)).toLowerCase();
    const p2 = (await c4inst.getPlayerTwo.call(gameId,fromac)).toLowerCase();

    const isRestricted = await c4inst.getRestricted.call(gameId, fromac);
    const isStarted = await c4inst.getIsStarted.call(gameId, fromac);
    const gameOver = await c4inst.getGameOver.call(gameId, fromac);

    var statusText = "Game ID " + gameId + ": ";
    var buttonDisabled = true;
    var buttonText = "Join Game";
    var joinAction = "None";

    if(!isStarted){
      if(p1 === NULL_ADDR){
        //Hasn't been created
        statusText += "Game Doesn't Exist.";
      } else if(p1 === this.props.account){
        //Created by user
        statusText += "You created this game.";
        if(isRestricted){
          statusText += "Player 2 is restricted to " + p2;
        }
        buttonText = "Load Game";
        buttonDisabled = false;
        joinAction = "Load";
      } else{
        //Created by someone else
        if(isRestricted){
          if(p2 === this.props.account){
            statusText += "Restricted game is available to join.";
            buttonDisabled = false;
            joinAction = "Join";
          } else{
            statusText += "Game is restricted to another player: " + p2;
          }
        } else{
          statusText += "Game is available to join.";
          buttonDisabled = false;
          joinAction = "Join";
        }
      }
    } else if(isStarted && !gameOver){

    } else{

    }

    this.setState({
      statusText: statusText,
      joinButtonDisabled : buttonDisabled,
      joinButtonText: buttonText,
    });

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
      this.setStatusText("There was some sort of error. "+
          "Check the transaction history to see what happened");
    }
  }

  async handleJoinButton(){

  }

  updateInputGameId(event){
    this.setState({
      inputGameId: event.target.value,
      statusText: LOADING_GAME_MESSAGE
    });

    //Displays the previous info if incorrect
    setTimeout(()=>this.updateStatusText(), 0);
  }

  render(){
    return (
      <div id="gameManager">
        <button onClick={()=>this.createGame()}>Create Game</button>
        <input type="number" value={this.state.inputGameId} onChange={e=>this.updateInputGameId(e)} />
        <p>{this.state.statusText}</p>
        <button onClick={()=>this.handleJoinButton()} disabled={this.state.joinButtonDisabled}>
          {this.state.joinButtonText}
        </button>
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
