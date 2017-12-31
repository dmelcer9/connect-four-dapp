import Web3 from 'web3'

import contract from 'truffle-contract'

import con4_artifacts from '../../build/contracts/ConnectFour.json'
const ConnectFour = contract(con4_artifacts);

class ConnectFourApp{

  constructor(web3Inst){
    ConnectFour.setProvider(web3.currentProvider);
    ConnectFour.deployed()
      .then(function(deployed){
        console.log("Connected to contract")
        this.c4inst = deployed;
      }).catch(displayError);
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
    web3used = new Web3(web3.currentProvider);
  } else {
    console.log("No web3 detected");
    web3used = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
  }

  new ConnectFourApp(web3used);
});
