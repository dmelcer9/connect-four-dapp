var ConnectFour = artifacts.require("ConnectFour");

contract('Connect Four', function(accounts) {
  it('should create a new game', function(){
    var c4inst;
    return ConnectFour.deployed().then(function(instance){
      c4inst = instance;
      return c4inst.createNewGame({value:web3.toWei(.01,"ether")});
    }).then(function(){
      return c4inst.getBid.call(0);
    }).then(function(state){
      assert.equal(state.toString(),web3.toWei(.01,"ether"));
      return c4inst.getPlayerOne.call(0);
    }).then(function(playerOne){
      assert.equal(playerOne,accounts[0]);
      return c4inst.getBoard.call(0);
    }).then(function(board){
      console.log(board);
    });
  });
});
