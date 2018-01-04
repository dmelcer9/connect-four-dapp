import React from 'react'
import PropTypes from 'prop-types'
import Board from './board'
import BigNumber from 'bignumber.js'
import GameManager from './gameManager'

export default class ConnectFourApp extends React.Component{
  constructor(props){
    super(props);

    this.state = {games:new Set()};

  }

  addGame(gameId){
    this.setState(prevState=>{
      prevState.games.add(gameId);
      return prevState;
    })
  }

  removeGame(gameId){
    this.setState(prevState=>{
      prevState.games.delete(gameId);
      return prevState;
    })
  }

  render(){
    console.log(this.state.games);

    var r = (



      <div id="app">
      <div className="w3-container">
        <GameManager c4inst={this.props.c4inst}
                     account={this.props.account}
                     gameAdd={num=>this.addGame(num)}
                     web3={this.props.web3}/>

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
  web3: PropTypes.any.isRequired
}
