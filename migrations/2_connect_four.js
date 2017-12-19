var ConnectFour = artifacts.require("./ConnectFour.sol");

module.exports = function(deployer) {
  deployer.deploy(ConnectFour,60*60*24*3);
};
