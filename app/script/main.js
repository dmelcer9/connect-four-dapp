var Web3 = require("web3");

import contract from 'truffle-contract'

import con4_artifacts from '../../build/contracts/ConnectFour.json'
const ConnectFour = contract(con4_artifacts);

class ConnectFourApp{

  constructor(web3Inst){
    this.web3i = web3Inst;
    ConnectFour.setProvider(this.web3i.currentProvider);
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
      var acc = (await this.web3i.eth.getAccounts())[0];
      console.log(this.web3i);
      console.log(acc);
      await t.createNewGame({from:acc,value:"10000000"});
      console.log("Test");
      var num = document.getElementById("idnum").value;
      var arr = await t.getPlayerOne.call(num);

    })
  }

  displayError(error){
    console.error(error);
  }
}

window.addEventListener('load', function() {
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

  new ConnectFourApp(web3used);
});
