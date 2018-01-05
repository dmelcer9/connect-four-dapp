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
      inputBid: "",
      inputRestrictedAddress: "",
      inputGameId: "",
      statusText: DEFAULT_STATUS,
      statusColor: "blue",
      joinButtonText: "Join Game",
      joinButtonDisabled: true,
      joinAction: "None",
    }

  }

  async updateStatusText(){
    const gameId = String(this.state.inputGameId);

    if(gameId === "") {
      this.setState({
        statusText: DEFAULT_STATUS,
        joinButtonDisabled : true,
        joinButtonText: "Join Game",
        statusColor: "blue"
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
    const bid = String(await c4inst.getBid.call(gameId, fromac));
    const bidHuman = this.props.web3.utils.fromWei(bid, "ether").toString();
    const whoseTurn = (await c4inst.getWhoseTurn.call(gameId, fromac)).toNumber();


    var statusText = "Game ID " + gameId + ": ";
    var buttonDisabled = true;
    var buttonText = "Join Game";
    var joinAction = "None";
    var statusColor = "blue";

    if(!isStarted){
      if(p1 === NULL_ADDR){
        //Hasn't been created
        statusText += "Game Doesn't Exist.";
        statusColor = "amber";
      } else if(p1 === this.props.account){
        //Created by user
        statusText += "You created this game and are waiting for someone to join.";
        if(isRestricted){
          statusText += "Player 2 is restricted to " + p2;
        }
        buttonText = "Load Game";
        buttonDisabled = false;
        joinAction = "Load";
        statusColor = "blue"
      } else{
        //Created by someone else
        if(isRestricted){
          if(p2 === this.props.account){
            statusText += "Restricted game is available to join.";
            buttonDisabled = false;
            joinAction = "Join";
            statusColor = "green";
          } else{
            statusText += "Game is restricted to another player: " + p2;
            statusColor = "amber";
          }
        } else{
          statusText += "Game is available to join.";
          buttonDisabled = false;
          joinAction = "Join";
          statusColor = "green";
        }
      }
      statusText += " Bid is " + bidHuman + " ether.";
    } else if(isStarted && !gameOver){
      statusText += "Game is currently in progress. "
      buttonDisabled = false;
      joinAction = "Load";
      statusColor = "blue";
      buttonText = "Load Game";
      if(this.props.account === p1){
        statusText += "You are Player 1 (Red).";
      } else if(this.props.account === p2){
        statusText += "You are Player 2 (Black)."
      } else{
        statusText += "You are not a participant in this game.";
        buttonText = "Spectate Game";
      }
    } else if(gameOver){
      buttonDisabled = false;
      joinAction = "Load";
      statusColor = "blue";
      buttonText = "View Game";
      statusText += "The game has ended."
    } else{
      buttonDisabled = false;
      joinAction = "Load";
      statusColor = "red";
      buttonText = "View Game";
      statusText += "This game appears to have some sort of error."
    }

    this.setState({
      statusText: statusText,
      joinButtonDisabled : buttonDisabled,
      joinButtonText: buttonText,
      joinAction: joinAction,
      statusColor: statusColor
    });

  }

  setStatusText(text, color="blue"){
    this.setState({
      statusText: text,
      statusColor: color
    });
  }

  async createGame(){

    var value;

    try{
      var inputBidNum = String(this.state.inputBid);
      console.log(inputBidNum);
      value = this.props.web3.utils.toWei(inputBidNum,"ether");
      console.log(value);
    } catch(error){
      console.error(error);
      this.setStatusText("Please enter a valid bid.","red");
      return;
    }

    this.setStatusText("Creating game...", "blue");

    try{
      var transaction = await this.props.c4inst.createNewGame({
        from: this.props.account,
        value: value
      });

      console.log(transaction);

      var createdId = transaction.logs[0].args.gameId;

      this.setStatusText("Created a game with ID " + createdId.toString(),"blue");

      this.props.gameAdd(createdId);
    } catch(error){
      console.error(error);
      this.setStatusText("There was some sort of error. "+
          "Check the transaction history to see what happened", "red");
    }
  }

  async clearGameIdInput(){
    this.setState({
      inputGameId: ""
    });

    setTimeout(()=>this.updateStatusText(),0);
  }

  async handleJoinButton(){

    try{
      let id = String(this.state.inputGameId);
      let acc = this.props.account;

      console.log("Join button, " + this.state.joinAction);
      switch(this.state.joinAction){
        case "Join":
          let bid = await this.props.c4inst.getBid.call(id, {from: acc});
          await this.props.c4inst.joinGame(id, {from: acc, value: bid});
          //NO BREAK
        case "Load": //FALLS THROUGH
          console.log("Load");
          this.props.gameAdd(id);
          this.clearGameIdInput();
          break;
        case "None": default:
          //Do nothing
          break;
      }
    } catch(error){
      console.error(error);
      this.setStatusText("Error when trying to join game", "red");
    }
  }

  updateInputGameId(event){
    this.setState({
      inputGameId: event.target.value,
      statusText: LOADING_GAME_MESSAGE
    });

    //Displays the previous info if incorrect
    setTimeout(()=>this.updateStatusText(), 0);
  }

  updateInputBid(event){
    this.setState({
      inputBid: event.target.value
    });
  }
  updateRestrictedAddressInput(event){
    this.setState({
      inputRestrictedAddress: event.target.value
    });
  }

  render(){
    var createButtonText;
    if(this.state.inputRestrictedAddress === ""){
      createButtonText = "Create Game";
    } else{
      createButtonText = "Create Restricted Game";
    }

    return (
      <div className="w3-panel w3-animate-opacity">
        <div id="gameManager" className="w3-card">
          <header className="w3-container w3-blue">
            <h2>Create or join a game</h2>
          </header>
          <div className="w3-panel">
            <p>Your Ethereum address is {this.props.account}.</p>
            <div>
              <label>Bid</label>
              <input className="w3-border w3-input" type="number" placeholder="Value in Ether"
              value={this.state.inputBid} onChange={e=>this.updateInputBid(e)} />
            </div>
            <p />
            <div>
              <label>Address to restrict to</label>
              <input className="w3-border w3-input" type="text" placeholder="Leave blank if anyone can join"
              value={this.state.inputRestrictedAddress} onChange={e=>this.updateRestrictedAddressInput(e)}/>
            </div>
            <p />
            <button className="w3-btn w3-blue" onClick={()=>this.createGame()}>{createButtonText}</button>
          </div>
          <div className="w3-panel">
            <div className="options">
              Game ID: <input className="w3-border w3-input" type="number" placeholder="Enter the ID of a game"
              value={this.state.inputGameId} onChange={e=>this.updateInputGameId(e)} />
            </div>
            <p />
            <button className="w3-btn w3-blue" onClick={()=>this.handleJoinButton()} disabled={this.state.joinButtonDisabled}>
              {this.state.joinButtonText}
            </button>
          </div>
          <footer className={"w3-container w3-" + this.state.statusColor}>
            <h6 id="statusText">{this.state.statusText}</h6>
          </footer>

        </div>
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
