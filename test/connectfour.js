const assertRevert = require('../node_modules/zeppelin-solidity/test/helpers/assertRevert');
const moment = require('../node_modules/moment/min/moment.min');

const ethNow =  function() {
  return web3.eth.getBlock('latest').timestamp;
}

const increaseTime = require('./increaseTime');
var ConnectFour = artifacts.require("ConnectFour");

const logErrAndAssertFalse = function (error){

  assert.fail(error, "", "An error occured");
}

const payment = web3.toWei(.01,"ether");


const assertEvent = function(tx, eventName, idx = 0){
  assert.equal(tx.logs[idx].event, eventName);
}

const assertWillRevert = async function(toRevert){
  try{
    await toRevert();
    assert.fail("Should have thrown");
  } catch(error){
    assertRevert(error);
  }
}

const createGame = async function(c4inst, price, acc1){
  var txResult = await c4inst.createNewGame({from:acc1,value:price, gasPrice:0});

  var createEvent = txResult.logs[0];
  assert.equal(createEvent.event,"logGameCreated");

  var id = createEvent.args.gameId.toNumber();

  return id;
}

const createAndJoinGame = async function(c4inst, price, acc1, acc2){
  var id = await createGame(c4inst, price, acc1);

  await c4inst.joinGame(id,{from:acc2, value:price, gasPrice:0});

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
    var currentTime = ethNow();

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
    var currentTime = ethNow();

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

  it('should make moves when allowed', async function(){
    var instance = await ConnectFour.deployed();
    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    assertEvent(await instance.makeMove(id,3,{from:accounts[0]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,10,{from:accounts[1]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,4,{from:accounts[0]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,5,{from:accounts[1]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,17,{from:accounts[0]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,24,{from:accounts[1]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,0,{from:accounts[0]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,6,{from:accounts[1]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,13,{from:accounts[0]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,20,{from:accounts[1]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,27,{from:accounts[0]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,34,{from:accounts[1]}),"logMoveMade");
    assertEvent(await instance.makeMove(id,41,{from:accounts[0]}),"logMoveMade");

  })

  it('should deny invalid moves', async function(){
    var instance = await ConnectFour.deployed();

    //Game ended
    await assertWillRevert(()=>instance.makeMove(0, 0));

    //Game probably doesn't exist yet
    await assertWillRevert(()=>instance.makeMove(999999999,0));

    var id = await createGame(instance, payment, accounts[0]);
    await assertWillRevert(()=>instance.makeMove(id,0));

    id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);
    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    //Invalid first moves
    await assertWillRevert(()=>instance.makeMove(id, -1, ac0));
    await assertWillRevert(()=>instance.makeMove(id, 7, ac0));
    await assertWillRevert(()=>instance.makeMove(id, 42, ac0));

    //Wrong accounts
    await assertWillRevert(()=>instance.makeMove(id, 0, ac1));
    await assertWillRevert(()=>instance.makeMove(id, 0, {from:accounts[2]}));

    assertEvent(await instance.makeMove(id,0,ac0),"logMoveMade");

    //Already has a chip there
    await assertWillRevert(()=>instance.makeMove(id, 0, ac1));
    await assertWillRevert(()=>instance.makeMove(id, 14, ac1))

    //Wrong accounts again
    await assertWillRevert(()=>instance.makeMove(id, 3, ac0));


    //Fill board up to top
    assertEvent(await instance.makeMove(id,6,ac1),"logMoveMade");
    assertEvent(await instance.makeMove(id,13,ac0),"logMoveMade");
    assertEvent(await instance.makeMove(id,20,ac1),"logMoveMade");
    assertEvent(await instance.makeMove(id,27,ac0),"logMoveMade");

    await assertWillRevert(()=>instance.makeMove(id,41,ac1));

    assertEvent(await instance.makeMove(id,34,ac1),"logMoveMade");
    assertEvent(await instance.makeMove(id,41,ac0),"logMoveMade");
    await assertWillRevert(()=>instance.makeMove(id,48,ac1));
  })

  it('should let someone cancel a game when nobody joined yet', async function(){
    var instance = await ConnectFour.deployed();

    var balPre =  web3.eth.getBalance(accounts[0]);

    //Cancel nonexistent game
    await assertWillRevert(()=>instance.cancelCreatedGame(999999999,{gasPrice:0}));

    var id = await createGame(instance, payment, accounts[0]);

    //Account other than game creator
    await assertWillRevert(()=>instance.cancelCreatedGame(id, {from:accounts[1]}));

    assertEvent(
      await instance.cancelCreatedGame(id,{from:accounts[0],gasPrice:0}),
      "logGameCancel");

    await instance.withdrawPayments({from:accounts[0],gasPrice:0});

    var balPost = web3.eth.getBalance(accounts[0]);

    assert.isTrue(balPre.eq(balPost));

    //Game already canceled
    await assertWillRevert(()=>instance.cancelCreatedGame(id,{gasPrice:0,from:accounts[0]}));

    //Game started
    var startedId = createAndJoinGame(instance, payment, accounts[0], accounts[1]);
    await assertWillRevert(()=>instance.cancelCreatedGame(id,{from:accounts[0]}));
    await assertWillRevert(()=>instance.cancelCreatedGame(id,{from:accounts[1]}));

  })

  it('should pay the winner of a game if red', async function(){
    var instance = await ConnectFour.deployed();

    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * * * * * *
    B B B R R R R
    */

    await instance.makeMove(id, 3, ac0);
    await instance.makeMove(id, 2, ac1);
    await instance.makeMove(id, 4, ac0);
    await instance.makeMove(id, 1, ac1);
    await instance.makeMove(id, 5, ac0);
    await instance.makeMove(id, 0, ac1);

    var balPre = web3.eth.getBalance(accounts[0]);

    await instance.makeMoveAndClaimVictory(id, 6, [3,4,5,6], {gasPrice:0});
    await instance.withdrawPayments({from:accounts[0],gasPrice:0});

    var balPost = web3.eth.getBalance(accounts[0]);

    assert.isTrue(balPre.add(web3.toWei(.02,"ether")).eq(balPost));

  })

  it('should pay the winner of a game if black', async function(){
    var instance = await ConnectFour.deployed();

    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * * * R * *
    B B B B R R R
    */

    await instance.makeMove(id, 4, ac0);
    await instance.makeMove(id, 0, ac1);
    await instance.makeMove(id, 5, ac0);
    await instance.makeMove(id, 1, ac1);
    await instance.makeMove(id, 6, ac0);
    await instance.makeMove(id, 2, ac1);
    await instance.makeMove(id, 11, ac0);

    var balPre = web3.eth.getBalance(accounts[1]);

    await instance.makeMoveAndClaimVictory(id, 3, [0,1,2,3], {from:accounts[1],gasPrice:0});
    await instance.withdrawPayments({from:accounts[1],gasPrice:0});

    var balPost = web3.eth.getBalance(accounts[1]);

    assert.isTrue(balPre.add(web3.toWei(.02,"ether")).eq(balPost));

  })

  it('should allow claiming victory horizontal', async function(){
    var instance = await ConnectFour.deployed();

    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * R R R R *
    * B R B B B *
    */

    await instance.makeMove(id, 2, ac0);
    await instance.makeMove(id, 3, ac1);
    await instance.makeMove(id, 9, ac0);
    await instance.makeMove(id, 4, ac1);
    await instance.makeMove(id, 10, ac0);
    await instance.makeMove(id, 5, ac1);
    await instance.makeMove(id, 12, ac0);
    await instance.makeMove(id, 1, ac1);

    await instance.makeMoveAndClaimVictory(id, 11, [9,10,11,12]);
  })

  it('should allow claiming victory vertical', async function(){

    var instance = await ConnectFour.deployed();

    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * R * * *
    * * * R B * *
    * * * R B * *
    * * * R B * *
    */

    await instance.makeMove(id, 3, ac0);
    await instance.makeMove(id, 4, ac1);
    await instance.makeMove(id, 10, ac0);
    await instance.makeMove(id, 11, ac1);
    await instance.makeMove(id, 17, ac0);
    await instance.makeMove(id, 18, ac1);

    await instance.makeMoveAndClaimVictory(id, 24, [3,10,17,24]);
  })

  it('should allow claiming victory both diagnols', async function(){
    // Diagnol Up-Right

    var instance = await ConnectFour.deployed();

    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * * * * R
    * * * * * R R
    * * * * R B B
    * B * R B B R
    */

    await instance.makeMove(id, 3, ac0);
    await instance.makeMove(id, 4, ac1);
    await instance.makeMove(id, 11, ac0);
    await instance.makeMove(id, 5, ac1);
    await instance.makeMove(id, 6, ac0);
    await instance.makeMove(id, 12, ac1);
    await instance.makeMove(id, 19, ac0);
    await instance.makeMove(id, 13, ac1);
    await instance.makeMove(id, 20, ac0);
    await instance.makeMove(id, 1, ac1);

    await instance.makeMoveAndClaimVictory(id, 27, [3,11,19,27]);

    //Diagnol Up-Left

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * B R * * * *
    * B B * * * *
    * R R B * * *
    * B B R B * *
    * R R B R R *
    */

    await instance.makeMove(id, 5, ac0);
    await instance.makeMove(id, 3, ac1);
    await instance.makeMove(id, 4, ac0);
    await instance.makeMove(id, 11, ac1);
    await instance.makeMove(id, 10, ac0);
    await instance.makeMove(id, 17, ac1);
    await instance.makeMove(id, 2, ac0);
    await instance.makeMove(id, 9, ac1);
    await instance.makeMove(id, 16, ac0);
    await instance.makeMove(id, 23, ac1);
    await instance.makeMove(id, 1, ac0);
    await instance.makeMove(id, 8, ac1);
    await instance.makeMove(id, 15, ac0);
    await instance.makeMove(id, 22, ac1);
    await instance.makeMove(id, 30, ac0);

    await instance.makeMoveAndClaimVictory(id, 29, [11,17,23,29], ac1);


  })

  it('should deny claiming victory with wrong pieces', async function(){
    var instance = await ConnectFour.deployed();

    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    await assertWillRevert(()=>instance.makeMoveAndClaimVictory(id, 3, [0,1,2,3]));

    await instance.makeMove(id, 3, ac0);
    await instance.makeMove(id, 2, ac1);
    await instance.makeMove(id, 4, ac0);
    await instance.makeMove(id, 1, ac1);
    await instance.makeMove(id, 5, ac0);
    await instance.makeMove(id, 0, ac1);
    await instance.makeMove(id, 6, ac0);
    await assertWillRevert(()=>
       instance.makeMoveAndClaimVictory(id, 7, [3,4,5,6], {from:accounts[1],gasPrice:0}));

    await assertWillRevert(()=>
       instance.makeMoveAndClaimVictory(id, 7, [0,1,2,3], {from:accounts[1],gasPrice:0}));

  })

  it('should deny claiming victory when pieces do not line up', async function(){

    var instance = await ConnectFour.deployed();

    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * * * R R *
    * * * R B B *
    * * R B B R *
    */

    await instance.makeMove(id, 2, ac0);
    await instance.makeMove(id, 3, ac1);
    await instance.makeMove(id, 10, ac0);
    await instance.makeMove(id, 4, ac1);
    await instance.makeMove(id, 5, ac0);
    await instance.makeMove(id, 11, ac1);
    await instance.makeMove(id, 18, ac0);
    await instance.makeMove(id, 12, ac1);

    await assertWillRevert(()=>
       instance.makeMoveAndClaimVictory(id, 19, [2,10,18,19], ac0));


  });

  it('should deny claiming victory when there is a break between two pieces', async function(){
    var instance = await ConnectFour.deployed();

    const ac0 = {from:accounts[0]};
    const ac1 = {from:accounts[1]};

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * * * * * *
    B * B * B * *
    R * R * R * R
    */

    await instance.makeMove(id, 0, ac0);
    await instance.makeMove(id, 7, ac1);
    await instance.makeMove(id, 2, ac0);
    await instance.makeMove(id, 9, ac1);
    await instance.makeMove(id, 4, ac0);
    await instance.makeMove(id, 11, ac1);
    await assertWillRevert(()=>
       instance.makeMoveAndClaimVictory(id, 6, [0,2,4,6], ac0));




  });

  it('should deny claiming victory when pieces wrap around', async function(){
    assert.fail("Not implemented");
  });



});
