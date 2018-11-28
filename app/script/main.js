var Web3 = require("web3");

require("../style/app.css")

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
  try{

    if(window.ethereum){
      window.web3 = new Web3(ethereum);

      await ethereum.enable();
    } else if(window.web3){
      window.web3 = new Web3(web3.currentProvider);
    } else{
      throw "No web3 detected";
    }

    console.log("Connected to mist/metamask");

    var web3used = window.web3;

    ConnectFour.setProvider(web3used.currentProvider);

    var account = (await web3used.eth.getAccounts())[0];

    ConnectFour.defaults({
      from: account,
    })

    var inst = await ConnectFour.deployed();

    const updateGasPrice = function(newPriceInGwei){
      console.log("Gas price: " + newPriceInGwei + " gwei");
      ConnectFour.defaults({
          gasPrice: web3used.utils.toWei(newPriceInGwei,"gwei")
      });

      localStorage.setItem("defaultGas",newPriceInGwei);
    }

    var defaultGas = localStorage.getItem("defaultGas");

    if(defaultGas == null){
      defaultGas = "1";
    }

    updateGasPrice(defaultGas);


    ReactDOM.render(
      <ConnectFourApp gameId={new BigNumber("0")} c4inst={inst} account={account.toLowerCase()}
      updateGasPrice={updateGasPrice} web3={web3used} defaultGas={defaultGas}/>,
      document.getElementById("root")
    )

  } catch(error){
    document.getElementById("loading-card").setAttribute("hidden",true);
    document.getElementById("error-card").removeAttribute("hidden");

    console.error(error);
    return;
  }

});
