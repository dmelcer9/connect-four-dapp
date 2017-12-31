import Web3 from 'web3'

import contract from 'truffle-contract'

import con4_artifacts from '../../build/contracts/ConnectFour.json'
const ConnectFour = contract(con4_artifacts);

window.App = {
  start: async function(){
    ConnectFour.setProvider(web3.currentProvider);
    console.log(await ConnectFour.deployed());
  }
}


window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.log("No web3 detected");
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
  }

  App.start();
});
