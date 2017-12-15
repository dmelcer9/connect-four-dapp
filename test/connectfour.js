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

  it('should require the same bid from player 2', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.joinGame(0,{from:accounts[1]}));
    await assertWillRevert(()=>instance.joinGame(0,{from:accounts[1],value:web3.toWei(.010000001,"ether")}));
  })

  it('should allow joining a game as normal', async function(){
    var instance = await ConnectFour.deployed();

    var txResult = await instance.joinGame(0,{from:accounts[1],value:payment});
    var currentTime = Date.now()/1000;

    assert.equal(txResult.logs[0].event,"GameStart");

    var lastTimePlayed = await instance.getLastTimePlayed.call(0);
    assert.closeTo(currentTime, lastTimePlayed.toNumber(), 2);

    var p2address = await instance.getPlayerTwo.call(0);
    assert.equal(p2address, accounts[1]);

    var started = await instance.getIsStarted.call(0);
    assert.isTrue(started);

    var whoseTurn = await instance.getWhoseTurn.call(0);
    assert.equal(whoseTurn.toNumber(), 1);
  })

  it('shouldn\'t create a game restricted to the sender', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.createNewRestrictedGame(accounts[0]));
  })

  it('should create a restricted game', async function(){
    var c4inst = await ConnectFour.deployed();

    var txResult = await c4inst.createNewRestrictedGame(accounts[1],{value:payment});
    assert.equal(txResult.logs[0].event,"GameCreated");

    var bid = await c4inst.getBid.call(1);
    assert.equal(bid.toString(),payment);

    var playerOne = await c4inst.getPlayerOne.call(1);
    assert.equal(playerOne,accounts[0]);

    var board = await c4inst.getBoard.call(1);
    var actualBoard = board.map(e=>e.toNumber());
    assert.deepEqual(actualBoard, Array(42).fill(0));

    var isRestricted = await c4inst.getRestricted.call(1);
    assert.isTrue(isRestricted);

    var playerTwo = await c4inst.getPlayerTwo.call(1);
    assert.equal(playerTwo, accounts[1]);
  })

  it('should deny joining a restricted game when not the player', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.joinGame(1,{value:payment,from:accounts[2]}))
  })

  it('should join a restricted game as normal', async function() {
    var instance = await ConnectFour.deployed();

    var txResult = await instance.joinGame(1,{from:accounts[1],value:payment});
    var currentTime = Date.now()/1000;

    assert.equal(txResult.logs[0].event,"GameStart");

    var lastTimePlayed = await instance.getLastTimePlayed.call(1);
    assert.closeTo(currentTime, lastTimePlayed.toNumber(), 2);

    var p2address = await instance.getPlayerTwo.call(1);
    assert.equal(p2address, accounts[1]);

    var started = await instance.getIsStarted.call(1);
    assert.isTrue(started);

    var whoseTurn = await instance.getWhoseTurn.call(1);
    assert.equal(whoseTurn.toNumber(), 1);
  })


});
