import React from 'react'
import PropTypes from 'prop-types'
import Board from './board'
import BigNumber from 'bignumber.js'
import GameManager from './gameManager'
import WinningsWidget from './winningsWidget'

export default class ConnectFourApp extends React.Component{
  constructor(props){
    super(props);

    var games = JSON.parse(localStorage.getItem('games'));

    if(games instanceof Array && games.every(element => typeof element === "string")){
      this.state = {games:new Set(games)};
    } else{
      this.state = {games:new Set()};
    }
  }

  updateStorage(){
    setTimeout(()=>{
      localStorage.setItem('games', JSON.stringify(Array.from(this.state.games)));
    }, 100);
  }

  addGame(gameId){
    this.setState(prevState=>{
      prevState.games.add(gameId);
      return prevState;
    })

    this.updateStorage();
  }

  removeGame(gameId){
    this.setState(prevState=>{
      prevState.games.delete(gameId);
      return prevState;
    })

    this.updateStorage();
  }

  render(){

    console.log("Current games displayed:", JSON.stringify(Array.from(this.state.games)));

    var r = (
      <div id="app">
      <div className="w3-container">
        <WinningsWidget c4inst={this.props.c4inst}
                        account={this.props.account}
                        web3={this.props.web3}/>
        <GameManager c4inst={this.props.c4inst}
                     account={this.props.account}
                     gameAdd={num=>this.addGame(num)}
                     web3={this.props.web3}
                     updateGasPrice={this.props.updateGasPrice}
                     defaultGas={this.props.defaultGas}/>

        {Array.from(this.state.games).map(gameId=>{
          return (
            <Board gameId={gameId} key={gameId} c4inst={this.props.c4inst}
             account={this.props.account} closeBoard={()=>this.removeGame(gameId)}/>
          )
        })}
      </div>
      </div>
    )
    return r;
  }
}

ConnectFourApp.propTypes = {
  c4inst: PropTypes.any.isRequired,
  account: PropTypes.string.isRequired,
  web3: PropTypes.any.isRequired,
  updateGasPrice: PropTypes.func.isRequired,
  defaultGas: PropTypes.string.isRequired
}
