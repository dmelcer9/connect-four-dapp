const assertRevert = require('../node_modules/zeppelin-solidity/test/helpers/assertRevert');
var ConnectFour = artifacts.require("ConnectFour");

const logErrAndAssertFalse = function (error){

  assert.fail(error, "", "An error occured");
}

payment = web3.toWei(.01,"ether");

const assertWillRevert = async function(toRevert){
  try{
    await toRevert();
    assert.fail("Should have thrown");
  } catch(error){
    assertRevert(error);
  }
}

contract('Connect Four', function(accounts) {

  it('should create a new game', async function(){
    var c4inst = await ConnectFour.deployed();

    var txResult = await c4inst.createNewGame({value:payment});
    assert.equal(txResult.logs[0].event,"GameCreated");

    var bid = await c4inst.getBid.call(0);
    assert.equal(bid.toString(),payment);

    var playerOne = await c4inst.getPlayerOne.call(0);
    assert.equal(playerOne,accounts[0]);

    var board = await c4inst.getBoard.call(0);
    var actualBoard = board.map(e=>e.toNumber());
    assert.deepEqual(actualBoard, Array(42).fill(0));
  });

  it('should only let people join games that exist', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.joinGame(1,{value:payment}));
  })

  it('should not let someone join their own game', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.joinGame(0,{value:payment}));
  })


});
