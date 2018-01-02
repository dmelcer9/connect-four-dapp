import React from 'react'
import PropTypes from 'prop-types'
import Board from './board'
import BigNumber from 'bignumber.js'

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

  render(){
    console.log(this.state.games);

    var r = (
      <div id="app">
        {Array.from(this.state.games).map(gameId=>{
          return (
            <Board gameId={gameId} c4inst={this.props.c4inst} account={this.props.account} />
          )
        })}
      </div>
    )
    return r;
  }
}

ConnectFourApp.propTypes = {
  c4inst: PropTypes.any.isRequired,
  account: PropTypes.string.isRequired
}
