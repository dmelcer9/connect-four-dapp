var Web3 = require("web3");

require("../app.css")
require("w3-css/w3.css")

import contract from 'truffle-contract'

import con4_artifacts from '../../build/contracts/ConnectFour.json'
const ConnectFour = contract(con4_artifacts);

import ConnectFourApp from './components/connectFourApp'
import Board from './components/board'
import React from 'react'
import ReactDOM from 'react-dom'
import BigNumber from "bignumber.js"

/*class ConnectFourApp{

  constructor(web3Inst){
    this.web3 = web3Inst;
    ConnectFour.setProvider(this.web3.currentProvider);
    ConnectFour.deployed()
      .then(deployed => {
        console.log("Connected to contract")
        this.c4inst = deployed;
      }).then(()=>this.setUpDOM())
      .catch(this.displayError);
  }

  setUpDOM(){

    var t = this.c4inst;
    document.getElementById("getInfo").addEventListener("click", async ()=>{
      var acc = (await this.web3.eth.getAccounts())[0];
      var num = document.getElementById("idnum").value;
      var arr = await t.games.call(num,{from:acc});
      console.log(arr);
    });

    document.getElementById("createGame").addEventListener("click", async ()=>{
      var acc = (await this.web3.eth.getAccounts())[0];
      var txn = await t.createNewGame({from:acc,value:this.web3.utils.toWei(".01","ether")});
      console.log("Created game " + txn.logs[0].args.gameId.toString());
    });
  }

  displayError(error){
    console.error(error);
  }
}*/

window.addEventListener('load', async function() {
  var web3used;

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    console.log("Using mist/metamask");
    web3used = new Web3(web3.currentProvider);
  } else {
    //TODO Improve this error message
    console.error("No web3 detected");
  }

  ConnectFour.setProvider(web3used.currentProvider);


  var inst = await ConnectFour.deployed();

  var account = (await web3used.eth.getAccounts())[0]
//  console.log(account);


  ReactDOM.render(
    <ConnectFourApp gameId={new BigNumber("0")} c4inst={inst} account={account.toLowerCase()} web3={web3used}/>,
    document.getElementById("root")
  )

});
