require('babel-register');
var HDWalletProvider = require("truffle-hdwallet-provider");

//Address to deploy from
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"


module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ropsten: {
      network_id: 3,
      gas: 4612388,
      provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/API_KEY")
    }
  }
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
};
