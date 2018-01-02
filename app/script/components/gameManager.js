import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'

const LOADING_GAME_MESSAGE = "Loading Details...";

export default class GameManager extends React.Component{
  constructor(props){
    super(props);

    this.state = {
      inputBid = 0,
      inputRestrictedAddress = 0,
      inputGameId = 0,
      statusText = LOADING_GAME_MESSAGE
    }

    updateStatusText();
  }

  async updateStatusText(){

  }
}
