const assertRevert = require('../node_modules/zeppelin-solidity/test/helpers/assertRevert');
const moment = require('../node_modules/moment/min/moment.min');

const increaseTime = require('./increaseTime');
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

const createGame = async function(c4inst, price, acc1){
  var txResult = await c4inst.createNewGame({from:acc1,value:price});

  var createEvent = txResult.logs[0];
  assert.equal(createEvent.event,"logGameCreated");

  var id = createEvent.args.gameId.toNumber();

  return id;
}

const createAndJoinGame = async function(c4inst, price, acc1, acc2){
  var id = await createGame(c4inst, price, acc1);

  await c4inst.joinGame(id,{from:acc2, value:price});

  return id;
}

contract('Connect Four', function(accounts) {

  it('should deny joining a nonexistent game', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.joinGame(0));
  })

  it('should create a new game', async function(){
    var c4inst = await ConnectFour.deployed();

    var txResult = await c4inst.createNewGame({value:payment});
    assert.equal(txResult.logs[0].event,"logGameCreated");

    var bid = await c4inst.getBid.call(0);
    assert.equal(bid.toString(),payment);

    var playerOne = await c4inst.getPlayerOne.call(0);
    assert.equal(playerOne,accounts[0]);

    var board = await c4inst.getBoard.call(0);
    var actualBoard = board.map(e=>e.toNumber());
    assert.deepEqual(actualBoard, Array(42).fill(0));

  });

  it('should deny forfeiting a game that is not started', async function(){
    var instance = await ConnectFour.deployed();

    await assertWillRevert(()=>instance.forfeit(0));
    await assertWillRevert(()=>instance.forfeit(0,{from:accounts[1]}));
  })

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

    assert.equal(txResult.logs[0].event,"logGameStart");

    var lastTimePlayed = await instance.getLastTimePlayed.call(0);
    assert.closeTo(currentTime, lastTimePlayed.toNumber(), 2);

    var p2address = await instance.getPlayerTwo.call(0);
    assert.equal(p2address, accounts[1]);

    var started = await instance.getIsStarted.call(0);
    assert.isTrue(started);

    var whoseTurn = await instance.getWhoseTurn.call(0);
    assert.equal(whoseTurn.toNumber(), 1);
  })

  it('should deny joining an already full game', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.joinGame(0,{from:accounts[2],value:payment}));
  })

  it('should not create a game restricted to the sender', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.createNewRestrictedGame(accounts[0]));
  })

  it('should create a restricted game', async function(){
    var c4inst = await ConnectFour.deployed();

    var txResult = await c4inst.createNewRestrictedGame(accounts[1],{value:payment});
    assert.equal(txResult.logs[0].event,"logGameCreated");

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

    assert.equal(txResult.logs[0].event,"logGameStart");

    var lastTimePlayed = await instance.getLastTimePlayed.call(1);
    assert.closeTo(currentTime, lastTimePlayed.toNumber(), 2);

    var p2address = await instance.getPlayerTwo.call(1);
    assert.equal(p2address, accounts[1]);

    var started = await instance.getIsStarted.call(1);
    assert.isTrue(started);

    var whoseTurn = await instance.getWhoseTurn.call(1);
    assert.equal(whoseTurn.toNumber(), 1);
  })

  it('should not let someone not in the game forfeit the game', async function(){
    var instance = await ConnectFour.deployed();
    await assertWillRevert(()=>instance.forfeit(0,{from:accounts[2]}));
  })

  it('should let red forfeit the game', async function(){
    var instance = await ConnectFour.deployed();

    var acc0BalPre = web3.eth.getBalance(accounts[0]);
    var acc1BalPre = web3.eth.getBalance(accounts[1]);

    var txResult = await instance.forfeit(0,{gasPrice:0});
    assert.equal(txResult.logs[0].event,"logGameEnd");

    await instance.withdrawPayments({from:accounts[1],gasPrice:0});

    var acc0BalPost = web3.eth.getBalance(accounts[0]);
    var acc1BalPost = web3.eth.getBalance(accounts[1]);

    assert.isTrue(acc0BalPre.eq(acc0BalPost));
    assert.equal(acc1BalPre.add(web3.toWei(.02,"ether")).toNumber(),(acc1BalPost).toNumber());
  })

  it('should let black forfeit the game', async function(){
    var instance = await ConnectFour.deployed();

    var acc0BalPre = web3.eth.getBalance(accounts[0]);
    var acc1BalPre = web3.eth.getBalance(accounts[1]);

    var txResult = await instance.forfeit(1,{from:accounts[1],gasPrice:0});
    assert.equal(txResult.logs[0].event,"logGameEnd");

    await instance.withdrawPayments({from:accounts[0],gasPrice:0});

    var acc0BalPost = web3.eth.getBalance(accounts[0]);
    var acc1BalPost = web3.eth.getBalance(accounts[1]);

    assert.isTrue(acc1BalPre.eq(acc1BalPost));
    assert.equal(acc0BalPre.add(web3.toWei(.02,"ether")).toNumber(),acc0BalPost.toNumber());
  })

  it('should not let someone forfeit an already forfeited game', async function(){
    var instance = await ConnectFour.deployed();

    await assertWillRevert(()=>instance.forfeit(0));
    await assertWillRevert(()=>instance.forfeit(0,{from:accounts[1]}));
  })

  it('should deny forfeiting a nonexistent game', async function() {
    var instance = await ConnectFour.deployed();

    await assertWillRevert(()=>instance.forfeit(2));
  })

  it('creating new game for move tests', async function(){
    var instance = await ConnectFour.deployed();

    await instance.createNewGame({value:payment});
    await instance.joinGame(2,{from:accounts[1],value:payment});
  })

  it('should let someone claim victory if the other person has not moved in 3 days', async function(){

    var instance = await ConnectFour.deployed();
    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    await increaseTime(60*60*71);

    await assertWillRevert(()=>instance.claimTimeoutVictory(id,{from:accounts[1]}));

    await increaseTime(60*60 + 1);

    await assertWillRevert(()=>instance.claimTimeoutVictory(id,{from:accounts[0]}));
    await assertWillRevert(()=>instance.claimTimeoutVictory(id,{from:accounts[2]}));

    var acc0BalPre = web3.eth.getBalance(accounts[0]);
    var acc1BalPre = web3.eth.getBalance(accounts[1]);

    var txResult = await instance.claimTimeoutVictory(id,{from:accounts[1],gasPrice:0});
    assert.equal(txResult.logs[0].event,"logGameEnd");

    await instance.withdrawPayments({from:accounts[1],gasPrice:0});

    var acc0BalPost = web3.eth.getBalance(accounts[0]);
    var acc1BalPost = web3.eth.getBalance(accounts[1]);

    assert.isTrue(acc0BalPre.eq(acc0BalPost));
    assert.equal(acc1BalPre.add(web3.toWei(.02,"ether")).toNumber(),(acc1BalPost).toNumber());
  });


});
