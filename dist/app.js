/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _increaseTime = __webpack_require__(1);

var _increaseTime2 = _interopRequireDefault(_increaseTime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assertRevert = __webpack_require__(3);

var moment = __webpack_require__(4);

var ethNow = function ethNow() {
  return web3.eth.getBlock('latest').timestamp;
};

//const increaseTime = require('./increaseTime');
var ConnectFour = artifacts.require("ConnectFour");

var logErrAndAssertFalse = function logErrAndAssertFalse(error) {

  assert.fail(error, "", "An error occured");
};

var payment = web3.toWei(.01, "ether");

var assertEvent = function assertEvent(tx, eventName) {
  var idx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  assert.equal(tx.logs[idx].event, eventName);
};

var assertWillRevert = async function assertWillRevert(toRevert) {
  try {
    await toRevert();
    assert.fail("Should have thrown");
  } catch (error) {
    assertRevert(error);
  }
};

var createGame = async function createGame(c4inst, price, acc1) {
  var txResult = await c4inst.createNewGame({ from: acc1, value: price, gasPrice: 0 });

  var createEvent = txResult.logs[0];
  assert.equal(createEvent.event, "logGameCreated");

  var id = createEvent.args.gameId.toNumber();

  return id;
};

var createAndJoinGame = async function createAndJoinGame(c4inst, price, acc1, acc2) {
  var id = await createGame(c4inst, price, acc1);

  await c4inst.joinGame(id, { from: acc2, value: price, gasPrice: 0 });

  return id;
};

contract('Connect Four', function (accounts) {

  it('should deny joining a nonexistent game', async function () {
    var instance = await ConnectFour.deployed();
    await assertWillRevert(function () {
      return instance.joinGame(0);
    });
  });

  it('should create a new game', async function () {
    var c4inst = await ConnectFour.deployed();

    var txResult = await c4inst.createNewGame({ value: payment });
    assert.equal(txResult.logs[0].event, "logGameCreated");

    var bid = await c4inst.getBid.call(0);
    assert.equal(bid.toString(), payment);

    var playerOne = await c4inst.getPlayerOne.call(0);
    assert.equal(playerOne, accounts[0]);

    var board = await c4inst.getBoard.call(0);
    var actualBoard = board.map(function (e) {
      return e.toNumber();
    });
    assert.deepEqual(actualBoard, Array(42).fill(0));
  });

  it('should deny forfeiting a game that is not started', async function () {
    var instance = await ConnectFour.deployed();

    await assertWillRevert(function () {
      return instance.forfeit(0);
    });
    await assertWillRevert(function () {
      return instance.forfeit(0, { from: accounts[1] });
    });
  });

  it('should only let people join games that exist', async function () {
    var instance = await ConnectFour.deployed();
    await assertWillRevert(function () {
      return instance.joinGame(1, { value: payment });
    });
  });

  it('should not let someone join their own game', async function () {
    var instance = await ConnectFour.deployed();
    await assertWillRevert(function () {
      return instance.joinGame(0, { value: payment });
    });
  });

  it('should require the same bid from player 2', async function () {
    var instance = await ConnectFour.deployed();
    await assertWillRevert(function () {
      return instance.joinGame(0, { from: accounts[1] });
    });
    await assertWillRevert(function () {
      return instance.joinGame(0, { from: accounts[1], value: web3.toWei(.010000001, "ether") });
    });
  });

  it('should allow joining a game as normal', async function () {
    var instance = await ConnectFour.deployed();

    var txResult = await instance.joinGame(0, { from: accounts[1], value: payment });
    var currentTime = ethNow();

    assert.equal(txResult.logs[0].event, "logGameStart");

    var lastTimePlayed = await instance.getLastTimePlayed.call(0);
    assert.closeTo(currentTime, lastTimePlayed.toNumber(), 2);

    var p2address = await instance.getPlayerTwo.call(0);
    assert.equal(p2address, accounts[1]);

    var started = await instance.getIsStarted.call(0);
    assert.isTrue(started);

    var whoseTurn = await instance.getWhoseTurn.call(0);
    assert.equal(whoseTurn.toNumber(), 1);
  });

  it('should deny joining an already full game', async function () {
    var instance = await ConnectFour.deployed();
    await assertWillRevert(function () {
      return instance.joinGame(0, { from: accounts[2], value: payment });
    });
  });

  it('should not create a game restricted to the sender', async function () {
    var instance = await ConnectFour.deployed();
    await assertWillRevert(function () {
      return instance.createNewRestrictedGame(accounts[0]);
    });
  });

  it('should create a restricted game', async function () {
    var c4inst = await ConnectFour.deployed();

    var txResult = await c4inst.createNewRestrictedGame(accounts[1], { value: payment });
    assert.equal(txResult.logs[0].event, "logGameCreated");

    var bid = await c4inst.getBid.call(1);
    assert.equal(bid.toString(), payment);

    var playerOne = await c4inst.getPlayerOne.call(1);
    assert.equal(playerOne, accounts[0]);

    var board = await c4inst.getBoard.call(1);
    var actualBoard = board.map(function (e) {
      return e.toNumber();
    });
    assert.deepEqual(actualBoard, Array(42).fill(0));

    var isRestricted = await c4inst.getRestricted.call(1);
    assert.isTrue(isRestricted);

    var playerTwo = await c4inst.getPlayerTwo.call(1);
    assert.equal(playerTwo, accounts[1]);
  });

  it('should deny joining a restricted game when not the player', async function () {
    var instance = await ConnectFour.deployed();
    await assertWillRevert(function () {
      return instance.joinGame(1, { value: payment, from: accounts[2] });
    });
  });

  it('should join a restricted game as normal', async function () {
    var instance = await ConnectFour.deployed();

    var txResult = await instance.joinGame(1, { from: accounts[1], value: payment });
    var currentTime = ethNow();

    assert.equal(txResult.logs[0].event, "logGameStart");

    var lastTimePlayed = await instance.getLastTimePlayed.call(1);
    assert.closeTo(currentTime, lastTimePlayed.toNumber(), 2);

    var p2address = await instance.getPlayerTwo.call(1);
    assert.equal(p2address, accounts[1]);

    var started = await instance.getIsStarted.call(1);
    assert.isTrue(started);

    var whoseTurn = await instance.getWhoseTurn.call(1);
    assert.equal(whoseTurn.toNumber(), 1);
  });

  it('should not let someone not in the game forfeit the game', async function () {
    var instance = await ConnectFour.deployed();
    await assertWillRevert(function () {
      return instance.forfeit(0, { from: accounts[2] });
    });
  });

  it('should let red forfeit the game', async function () {
    var instance = await ConnectFour.deployed();

    var acc0BalPre = web3.eth.getBalance(accounts[0]);
    var acc1BalPre = web3.eth.getBalance(accounts[1]);

    var txResult = await instance.forfeit(0, { gasPrice: 0 });
    assert.equal(txResult.logs[0].event, "logGameEnd");

    await instance.withdrawPayments({ from: accounts[1], gasPrice: 0 });

    var acc0BalPost = web3.eth.getBalance(accounts[0]);
    var acc1BalPost = web3.eth.getBalance(accounts[1]);

    assert.isTrue(acc0BalPre.eq(acc0BalPost));
    assert.equal(acc1BalPre.add(web3.toWei(.02, "ether")).toNumber(), acc1BalPost.toNumber());
  });

  it('should let black forfeit the game', async function () {
    var instance = await ConnectFour.deployed();

    var acc0BalPre = web3.eth.getBalance(accounts[0]);
    var acc1BalPre = web3.eth.getBalance(accounts[1]);

    var txResult = await instance.forfeit(1, { from: accounts[1], gasPrice: 0 });
    assert.equal(txResult.logs[0].event, "logGameEnd");

    await instance.withdrawPayments({ from: accounts[0], gasPrice: 0 });

    var acc0BalPost = web3.eth.getBalance(accounts[0]);
    var acc1BalPost = web3.eth.getBalance(accounts[1]);

    assert.isTrue(acc1BalPre.eq(acc1BalPost));
    assert.equal(acc0BalPre.add(web3.toWei(.02, "ether")).toNumber(), acc0BalPost.toNumber());
  });

  it('should not let someone forfeit an already forfeited game', async function () {
    var instance = await ConnectFour.deployed();

    await assertWillRevert(function () {
      return instance.forfeit(0);
    });
    await assertWillRevert(function () {
      return instance.forfeit(0, { from: accounts[1] });
    });
  });

  it('should deny forfeiting a nonexistent game', async function () {
    var instance = await ConnectFour.deployed();

    await assertWillRevert(function () {
      return instance.forfeit(2);
    });
  });

  it('should let someone claim victory if the other person has not moved in 3 days', async function () {

    var instance = await ConnectFour.deployed();
    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    await (0, _increaseTime2.default)(60 * 60 * 71);

    await assertWillRevert(function () {
      return instance.claimTimeoutVictory(id, { from: accounts[1] });
    });

    await (0, _increaseTime2.default)(60 * 60 + 1);

    await assertWillRevert(function () {
      return instance.claimTimeoutVictory(id, { from: accounts[0] });
    });
    await assertWillRevert(function () {
      return instance.claimTimeoutVictory(id, { from: accounts[2] });
    });

    var acc0BalPre = web3.eth.getBalance(accounts[0]);
    var acc1BalPre = web3.eth.getBalance(accounts[1]);

    var txResult = await instance.claimTimeoutVictory(id, { from: accounts[1], gasPrice: 0 });
    assert.equal(txResult.logs[0].event, "logGameEnd");

    await instance.withdrawPayments({ from: accounts[1], gasPrice: 0 });

    var acc0BalPost = web3.eth.getBalance(accounts[0]);
    var acc1BalPost = web3.eth.getBalance(accounts[1]);

    assert.isTrue(acc0BalPre.eq(acc0BalPost));
    assert.equal(acc1BalPre.add(web3.toWei(.02, "ether")).toNumber(), acc1BalPost.toNumber());
  });

  it('should make moves when allowed', async function () {
    var instance = await ConnectFour.deployed();
    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    assertEvent((await instance.makeMove(id, 3, { from: accounts[0] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 10, { from: accounts[1] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 4, { from: accounts[0] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 5, { from: accounts[1] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 17, { from: accounts[0] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 24, { from: accounts[1] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 0, { from: accounts[0] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 6, { from: accounts[1] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 13, { from: accounts[0] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 20, { from: accounts[1] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 27, { from: accounts[0] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 34, { from: accounts[1] })), "logMoveMade");
    assertEvent((await instance.makeMove(id, 41, { from: accounts[0] })), "logMoveMade");
  });

  it('should deny invalid moves', async function () {
    var instance = await ConnectFour.deployed();

    //Game ended
    await assertWillRevert(function () {
      return instance.makeMove(0, 0);
    });

    //Game probably doesn't exist yet
    await assertWillRevert(function () {
      return instance.makeMove(999999999, 0);
    });

    var id = await createGame(instance, payment, accounts[0]);
    await assertWillRevert(function () {
      return instance.makeMove(id, 0);
    });

    id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);
    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

    //Invalid first moves
    await assertWillRevert(function () {
      return instance.makeMove(id, -1, ac0);
    });
    await assertWillRevert(function () {
      return instance.makeMove(id, 7, ac0);
    });
    await assertWillRevert(function () {
      return instance.makeMove(id, 42, ac0);
    });

    //Wrong accounts
    await assertWillRevert(function () {
      return instance.makeMove(id, 0, ac1);
    });
    await assertWillRevert(function () {
      return instance.makeMove(id, 0, { from: accounts[2] });
    });

    assertEvent((await instance.makeMove(id, 0, ac0)), "logMoveMade");

    //Already has a chip there
    await assertWillRevert(function () {
      return instance.makeMove(id, 0, ac1);
    });
    await assertWillRevert(function () {
      return instance.makeMove(id, 14, ac1);
    });

    //Wrong accounts again
    await assertWillRevert(function () {
      return instance.makeMove(id, 3, ac0);
    });

    //Fill board up to top
    assertEvent((await instance.makeMove(id, 6, ac1)), "logMoveMade");
    assertEvent((await instance.makeMove(id, 13, ac0)), "logMoveMade");
    assertEvent((await instance.makeMove(id, 20, ac1)), "logMoveMade");
    assertEvent((await instance.makeMove(id, 27, ac0)), "logMoveMade");

    await assertWillRevert(function () {
      return instance.makeMove(id, 41, ac1);
    });

    assertEvent((await instance.makeMove(id, 34, ac1)), "logMoveMade");
    assertEvent((await instance.makeMove(id, 41, ac0)), "logMoveMade");
    await assertWillRevert(function () {
      return instance.makeMove(id, 48, ac1);
    });
  });

  it('should let someone cancel a game when nobody joined yet', async function () {
    var instance = await ConnectFour.deployed();

    var balPre = web3.eth.getBalance(accounts[0]);

    //Cancel nonexistent game
    await assertWillRevert(function () {
      return instance.cancelCreatedGame(999999999, { gasPrice: 0 });
    });

    var id = await createGame(instance, payment, accounts[0]);

    //Account other than game creator
    await assertWillRevert(function () {
      return instance.cancelCreatedGame(id, { from: accounts[1] });
    });

    assertEvent((await instance.cancelCreatedGame(id, { from: accounts[0], gasPrice: 0 })), "logGameCancel");

    await instance.withdrawPayments({ from: accounts[0], gasPrice: 0 });

    var balPost = web3.eth.getBalance(accounts[0]);

    assert.isTrue(balPre.eq(balPost));

    //Game already canceled
    await assertWillRevert(function () {
      return instance.cancelCreatedGame(id, { gasPrice: 0, from: accounts[0] });
    });

    //Game started
    var startedId = createAndJoinGame(instance, payment, accounts[0], accounts[1]);
    await assertWillRevert(function () {
      return instance.cancelCreatedGame(id, { from: accounts[0] });
    });
    await assertWillRevert(function () {
      return instance.cancelCreatedGame(id, { from: accounts[1] });
    });
  });

  it('should pay the winner of a game if red', async function () {
    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

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

    await instance.makeMoveAndClaimVictory(id, 6, [3, 4, 5, 6], { gasPrice: 0 });
    await instance.withdrawPayments({ from: accounts[0], gasPrice: 0 });

    var balPost = web3.eth.getBalance(accounts[0]);

    assert.isTrue(balPre.add(web3.toWei(.02, "ether")).eq(balPost));
  });

  it('should pay the winner of a game if black', async function () {
    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

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

    await instance.makeMoveAndClaimVictory(id, 3, [0, 1, 2, 3], { from: accounts[1], gasPrice: 0 });
    await instance.withdrawPayments({ from: accounts[1], gasPrice: 0 });

    var balPost = web3.eth.getBalance(accounts[1]);

    assert.isTrue(balPre.add(web3.toWei(.02, "ether")).eq(balPost));
  });

  it('should allow claiming victory horizontal', async function () {
    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

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

    await instance.makeMoveAndClaimVictory(id, 11, [9, 10, 11, 12]);
  });

  it('should allow claiming victory vertical', async function () {

    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

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

    await instance.makeMoveAndClaimVictory(id, 24, [3, 10, 17, 24]);
  });

  it('should allow claiming victory both diagnols', async function () {
    // Diagnol Up-Right

    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

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

    await instance.makeMoveAndClaimVictory(id, 27, [3, 11, 19, 27]);

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

    await instance.makeMoveAndClaimVictory(id, 29, [11, 17, 23, 29], ac1);
  });

  it('should deny claiming victory with wrong pieces', async function () {
    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    await assertWillRevert(function () {
      return instance.makeMoveAndClaimVictory(id, 3, [0, 1, 2, 3]);
    });

    await instance.makeMove(id, 3, ac0);
    await instance.makeMove(id, 2, ac1);
    await instance.makeMove(id, 4, ac0);
    await instance.makeMove(id, 1, ac1);
    await instance.makeMove(id, 5, ac0);
    await instance.makeMove(id, 0, ac1);
    await instance.makeMove(id, 6, ac0);
    await assertWillRevert(function () {
      return instance.makeMoveAndClaimVictory(id, 7, [3, 4, 5, 6], { from: accounts[1], gasPrice: 0 });
    });

    await assertWillRevert(function () {
      return instance.makeMoveAndClaimVictory(id, 7, [0, 1, 2, 3], { from: accounts[1], gasPrice: 0 });
    });
  });

  it('should deny claiming victory when pieces do not line up', async function () {

    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

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

    await assertWillRevert(function () {
      return instance.makeMoveAndClaimVictory(id, 19, [2, 10, 18, 19], ac0);
    });
  });

  it('should deny claiming victory when there is a break between two pieces', async function () {
    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

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
    await assertWillRevert(function () {
      return instance.makeMoveAndClaimVictory(id, 6, [0, 2, 4, 6], ac0);
    });
  });

  it('should deny claiming victory when pieces wrap around', async function () {
    var instance = await ConnectFour.deployed();

    var ac0 = { from: accounts[0] };
    var ac1 = { from: accounts[1] };

    //Straight line
    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * * * * *
    * * * * * * *
    R R R * * * *
    B B B * * * R
    */

    await instance.makeMove(id, 6, ac0);
    await instance.makeMove(id, 0, ac1);
    await instance.makeMove(id, 7, ac0);
    await instance.makeMove(id, 1, ac1);
    await instance.makeMove(id, 8, ac0);
    await instance.makeMove(id, 2, ac1);
    await assertWillRevert(function () {
      return instance.makeMoveAndClaimVictory(id, 9, [6, 7, 8, 9], ac0);
    });

    //Diagnol left
    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * * * * * * *
    * * * * * * *
    R * * * * * R
    B R * * * * B
    B B R * * * R
    */

    await instance.makeMove(id, 2, ac0);
    await instance.makeMove(id, 1, ac1);
    await instance.makeMove(id, 8, ac0);
    await instance.makeMove(id, 0, ac1);
    await instance.makeMove(id, 6, ac0);
    await instance.makeMove(id, 7, ac1);
    await instance.makeMove(id, 14, ac0);
    await instance.makeMove(id, 13, ac1);
    await assertWillRevert(function () {
      return instance.makeMoveAndClaimVictory(id, 20, [2, 8, 14, 20], ac0);
    });

    //Diagnol right
    var id = await createAndJoinGame(instance, payment, accounts[0], accounts[1]);

    /*
    * * * * * * *
    * R * * * * *
    R R * * * * *
    B B * * * * *
    B R * * * * R
    B R * B * R B
    */

    await instance.makeMove(id, 5, ac0);
    await instance.makeMove(id, 6, ac1);
    await instance.makeMove(id, 13, ac0);
    await instance.makeMove(id, 0, ac1);
    await instance.makeMove(id, 1, ac0);
    await instance.makeMove(id, 7, ac1);
    await instance.makeMove(id, 8, ac0);
    await instance.makeMove(id, 14, ac1);
    await instance.makeMove(id, 21, ac0);
    await instance.makeMove(id, 15, ac1);
    await instance.makeMove(id, 22, ac0);
    await instance.makeMove(id, 3, ac1);
    await assertWillRevert(function () {
      return instance.makeMoveAndClaimVictory(id, 29, [5, 13, 21, 29], ac0);
    });
  });
});

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["default"] = increaseTime;
/* harmony export (immutable) */ __webpack_exports__["increaseTimeTo"] = increaseTimeTo;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__latestTime__ = __webpack_require__(2);


// Increases testrpc time by the passed duration in seconds
function increaseTime(duration) {
  const id = Date.now()

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration],
      id: id,
    }, err1 => {
      if (err1) return reject(err1)

      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id+1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res)
      })
    })
  })
}

/**
 * Beware that due to the need of calling two separate testrpc methods and rpc calls overhead
 * it's hard to increase time precisely to a target point so design your test to tolerate
 * small fluctuations from time to time.
 *
 * @param target time in seconds
 */
function increaseTimeTo(target) {
  let now = Object(__WEBPACK_IMPORTED_MODULE_0__latestTime__["a" /* default */])();
  if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
  let diff = target - now;
  return increaseTime(diff);
}

const duration = {
  seconds: function(val) { return val},
  minutes: function(val) { return val * this.seconds(60) },
  hours:   function(val) { return val * this.minutes(60) },
  days:    function(val) { return val * this.hours(24) },
  weeks:   function(val) { return val * this.days(7) },
  years:   function(val) { return val * this.days(365)}
};
/* harmony export (immutable) */ __webpack_exports__["duration"] = duration;



/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = latestTime;
// Returns the time of the last mined block in seconds
function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = function(error) {
  assert.isAbove(error.message.search('revert'), -1, 'Error containing "revert" must be returned');
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {!function(e,t){ true?module.exports=t():"function"==typeof define&&define.amd?define(t):e.moment=t()}(this,function(){"use strict";function e(){return Qe.apply(null,arguments)}function t(e){return e instanceof Array||"[object Array]"===Object.prototype.toString.call(e)}function n(e){return null!=e&&"[object Object]"===Object.prototype.toString.call(e)}function s(e){return void 0===e}function i(e){return"number"==typeof e||"[object Number]"===Object.prototype.toString.call(e)}function r(e){return e instanceof Date||"[object Date]"===Object.prototype.toString.call(e)}function a(e,t){var n,s=[];for(n=0;n<e.length;++n)s.push(t(e[n],n));return s}function o(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function u(e,t){for(var n in t)o(t,n)&&(e[n]=t[n]);return o(t,"toString")&&(e.toString=t.toString),o(t,"valueOf")&&(e.valueOf=t.valueOf),e}function l(e,t,n,s){return ge(e,t,n,s,!0).utc()}function d(e){return null==e._pf&&(e._pf={empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],meridiem:null,rfc2822:!1,weekdayMismatch:!1}),e._pf}function h(e){if(null==e._isValid){var t=d(e),n=Xe.call(t.parsedDateParts,function(e){return null!=e}),s=!isNaN(e._d.getTime())&&t.overflow<0&&!t.empty&&!t.invalidMonth&&!t.invalidWeekday&&!t.weekdayMismatch&&!t.nullInput&&!t.invalidFormat&&!t.userInvalidated&&(!t.meridiem||t.meridiem&&n);if(e._strict&&(s=s&&0===t.charsLeftOver&&0===t.unusedTokens.length&&void 0===t.bigHour),null!=Object.isFrozen&&Object.isFrozen(e))return s;e._isValid=s}return e._isValid}function c(e){var t=l(NaN);return null!=e?u(d(t),e):d(t).userInvalidated=!0,t}function f(e,t){var n,i,r;if(s(t._isAMomentObject)||(e._isAMomentObject=t._isAMomentObject),s(t._i)||(e._i=t._i),s(t._f)||(e._f=t._f),s(t._l)||(e._l=t._l),s(t._strict)||(e._strict=t._strict),s(t._tzm)||(e._tzm=t._tzm),s(t._isUTC)||(e._isUTC=t._isUTC),s(t._offset)||(e._offset=t._offset),s(t._pf)||(e._pf=d(t)),s(t._locale)||(e._locale=t._locale),Ke.length>0)for(n=0;n<Ke.length;n++)s(r=t[i=Ke[n]])||(e[i]=r);return e}function m(t){f(this,t),this._d=new Date(null!=t._d?t._d.getTime():NaN),this.isValid()||(this._d=new Date(NaN)),!1===et&&(et=!0,e.updateOffset(this),et=!1)}function _(e){return e instanceof m||null!=e&&null!=e._isAMomentObject}function y(e){return e<0?Math.ceil(e)||0:Math.floor(e)}function g(e){var t=+e,n=0;return 0!==t&&isFinite(t)&&(n=y(t)),n}function p(e,t,n){var s,i=Math.min(e.length,t.length),r=Math.abs(e.length-t.length),a=0;for(s=0;s<i;s++)(n&&e[s]!==t[s]||!n&&g(e[s])!==g(t[s]))&&a++;return a+r}function w(t){!1===e.suppressDeprecationWarnings&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+t)}function v(t,n){var s=!0;return u(function(){if(null!=e.deprecationHandler&&e.deprecationHandler(null,t),s){for(var i,r=[],a=0;a<arguments.length;a++){if(i="","object"==typeof arguments[a]){i+="\n["+a+"] ";for(var o in arguments[0])i+=o+": "+arguments[0][o]+", ";i=i.slice(0,-2)}else i=arguments[a];r.push(i)}w(t+"\nArguments: "+Array.prototype.slice.call(r).join("")+"\n"+(new Error).stack),s=!1}return n.apply(this,arguments)},n)}function M(t,n){null!=e.deprecationHandler&&e.deprecationHandler(t,n),tt[t]||(w(n),tt[t]=!0)}function S(e){return e instanceof Function||"[object Function]"===Object.prototype.toString.call(e)}function D(e,t){var s,i=u({},e);for(s in t)o(t,s)&&(n(e[s])&&n(t[s])?(i[s]={},u(i[s],e[s]),u(i[s],t[s])):null!=t[s]?i[s]=t[s]:delete i[s]);for(s in e)o(e,s)&&!o(t,s)&&n(e[s])&&(i[s]=u({},i[s]));return i}function k(e){null!=e&&this.set(e)}function Y(e,t){var n=e.toLowerCase();st[n]=st[n+"s"]=st[t]=e}function O(e){return"string"==typeof e?st[e]||st[e.toLowerCase()]:void 0}function T(e){var t,n,s={};for(n in e)o(e,n)&&(t=O(n))&&(s[t]=e[n]);return s}function x(e,t){it[e]=t}function b(e,t,n){var s=""+Math.abs(e),i=t-s.length;return(e>=0?n?"+":"":"-")+Math.pow(10,Math.max(0,i)).toString().substr(1)+s}function P(e,t,n,s){var i=s;"string"==typeof s&&(i=function(){return this[s]()}),e&&(ut[e]=i),t&&(ut[t[0]]=function(){return b(i.apply(this,arguments),t[1],t[2])}),n&&(ut[n]=function(){return this.localeData().ordinal(i.apply(this,arguments),e)})}function W(e){return e.match(/\[[\s\S]/)?e.replace(/^\[|\]$/g,""):e.replace(/\\/g,"")}function H(e,t){return e.isValid()?(t=R(t,e.localeData()),ot[t]=ot[t]||function(e){var t,n,s=e.match(rt);for(t=0,n=s.length;t<n;t++)ut[s[t]]?s[t]=ut[s[t]]:s[t]=W(s[t]);return function(t){var i,r="";for(i=0;i<n;i++)r+=S(s[i])?s[i].call(t,e):s[i];return r}}(t),ot[t](e)):e.localeData().invalidDate()}function R(e,t){function n(e){return t.longDateFormat(e)||e}var s=5;for(at.lastIndex=0;s>=0&&at.test(e);)e=e.replace(at,n),at.lastIndex=0,s-=1;return e}function C(e,t,n){Yt[e]=S(t)?t:function(e,s){return e&&n?n:t}}function F(e,t){return o(Yt,e)?Yt[e](t._strict,t._locale):new RegExp(function(e){return U(e.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(e,t,n,s,i){return t||n||s||i}))}(e))}function U(e){return e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function L(e,t){var n,s=t;for("string"==typeof e&&(e=[e]),i(t)&&(s=function(e,n){n[t]=g(e)}),n=0;n<e.length;n++)Ot[e[n]]=s}function N(e,t){L(e,function(e,n,s,i){s._w=s._w||{},t(e,s._w,s,i)})}function G(e,t,n){null!=t&&o(Ot,e)&&Ot[e](t,n._a,n,e)}function V(e){return E(e)?366:365}function E(e){return e%4==0&&e%100!=0||e%400==0}function I(t,n){return function(s){return null!=s?(j(this,t,s),e.updateOffset(this,n),this):A(this,t)}}function A(e,t){return e.isValid()?e._d["get"+(e._isUTC?"UTC":"")+t]():NaN}function j(e,t,n){e.isValid()&&!isNaN(n)&&("FullYear"===t&&E(e.year())&&1===e.month()&&29===e.date()?e._d["set"+(e._isUTC?"UTC":"")+t](n,e.month(),Z(n,e.month())):e._d["set"+(e._isUTC?"UTC":"")+t](n))}function Z(e,t){if(isNaN(e)||isNaN(t))return NaN;var n=function(e,t){return(e%t+t)%t}(t,12);return e+=(t-n)/12,1===n?E(e)?29:28:31-n%7%2}function z(e,t){var n;if(!e.isValid())return e;if("string"==typeof t)if(/^\d+$/.test(t))t=g(t);else if(t=e.localeData().monthsParse(t),!i(t))return e;return n=Math.min(e.date(),Z(e.year(),t)),e._d["set"+(e._isUTC?"UTC":"")+"Month"](t,n),e}function $(t){return null!=t?(z(this,t),e.updateOffset(this,!0),this):A(this,"Month")}function q(){function e(e,t){return t.length-e.length}var t,n,s=[],i=[],r=[];for(t=0;t<12;t++)n=l([2e3,t]),s.push(this.monthsShort(n,"")),i.push(this.months(n,"")),r.push(this.months(n,"")),r.push(this.monthsShort(n,""));for(s.sort(e),i.sort(e),r.sort(e),t=0;t<12;t++)s[t]=U(s[t]),i[t]=U(i[t]);for(t=0;t<24;t++)r[t]=U(r[t]);this._monthsRegex=new RegExp("^("+r.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+i.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+s.join("|")+")","i")}function J(e){var t=new Date(Date.UTC.apply(null,arguments));return e<100&&e>=0&&isFinite(t.getUTCFullYear())&&t.setUTCFullYear(e),t}function B(e,t,n){var s=7+t-n;return-((7+J(e,0,s).getUTCDay()-t)%7)+s-1}function Q(e,t,n,s,i){var r,a,o=1+7*(t-1)+(7+n-s)%7+B(e,s,i);return o<=0?a=V(r=e-1)+o:o>V(e)?(r=e+1,a=o-V(e)):(r=e,a=o),{year:r,dayOfYear:a}}function X(e,t,n){var s,i,r=B(e.year(),t,n),a=Math.floor((e.dayOfYear()-r-1)/7)+1;return a<1?s=a+K(i=e.year()-1,t,n):a>K(e.year(),t,n)?(s=a-K(e.year(),t,n),i=e.year()+1):(i=e.year(),s=a),{week:s,year:i}}function K(e,t,n){var s=B(e,t,n),i=B(e+1,t,n);return(V(e)-s+i)/7}function ee(){function e(e,t){return t.length-e.length}var t,n,s,i,r,a=[],o=[],u=[],d=[];for(t=0;t<7;t++)n=l([2e3,1]).day(t),s=this.weekdaysMin(n,""),i=this.weekdaysShort(n,""),r=this.weekdays(n,""),a.push(s),o.push(i),u.push(r),d.push(s),d.push(i),d.push(r);for(a.sort(e),o.sort(e),u.sort(e),d.sort(e),t=0;t<7;t++)o[t]=U(o[t]),u[t]=U(u[t]),d[t]=U(d[t]);this._weekdaysRegex=new RegExp("^("+d.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+u.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+o.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+a.join("|")+")","i")}function te(){return this.hours()%12||12}function ne(e,t){P(e,0,0,function(){return this.localeData().meridiem(this.hours(),this.minutes(),t)})}function se(e,t){return t._meridiemParse}function ie(e){return e?e.toLowerCase().replace("_","-"):e}function re(e){var t=null;if(!Xt[e]&&"undefined"!=typeof module&&module&&module.exports)try{t=Jt._abbr;!(function webpackMissingModule() { var e = new Error("Cannot find module \"./locale\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()),ae(t)}catch(e){}return Xt[e]}function ae(e,t){var n;return e&&(n=s(t)?ue(e):oe(e,t))&&(Jt=n),Jt._abbr}function oe(e,t){if(null!==t){var n=Qt;if(t.abbr=e,null!=Xt[e])M("defineLocaleOverride","use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."),n=Xt[e]._config;else if(null!=t.parentLocale){if(null==Xt[t.parentLocale])return Kt[t.parentLocale]||(Kt[t.parentLocale]=[]),Kt[t.parentLocale].push({name:e,config:t}),null;n=Xt[t.parentLocale]._config}return Xt[e]=new k(D(n,t)),Kt[e]&&Kt[e].forEach(function(e){oe(e.name,e.config)}),ae(e),Xt[e]}return delete Xt[e],null}function ue(e){var n;if(e&&e._locale&&e._locale._abbr&&(e=e._locale._abbr),!e)return Jt;if(!t(e)){if(n=re(e))return n;e=[e]}return function(e){for(var t,n,s,i,r=0;r<e.length;){for(t=(i=ie(e[r]).split("-")).length,n=(n=ie(e[r+1]))?n.split("-"):null;t>0;){if(s=re(i.slice(0,t).join("-")))return s;if(n&&n.length>=t&&p(i,n,!0)>=t-1)break;t--}r++}return null}(e)}function le(e){var t,n=e._a;return n&&-2===d(e).overflow&&(t=n[xt]<0||n[xt]>11?xt:n[bt]<1||n[bt]>Z(n[Tt],n[xt])?bt:n[Pt]<0||n[Pt]>24||24===n[Pt]&&(0!==n[Wt]||0!==n[Ht]||0!==n[Rt])?Pt:n[Wt]<0||n[Wt]>59?Wt:n[Ht]<0||n[Ht]>59?Ht:n[Rt]<0||n[Rt]>999?Rt:-1,d(e)._overflowDayOfYear&&(t<Tt||t>bt)&&(t=bt),d(e)._overflowWeeks&&-1===t&&(t=Ct),d(e)._overflowWeekday&&-1===t&&(t=Ft),d(e).overflow=t),e}function de(e,t,n){return null!=e?e:null!=t?t:n}function he(t){var n,s,i,r,a,o=[];if(!t._d){for(i=function(t){var n=new Date(e.now());return t._useUTC?[n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()]:[n.getFullYear(),n.getMonth(),n.getDate()]}(t),t._w&&null==t._a[bt]&&null==t._a[xt]&&function(e){var t,n,s,i,r,a,o,u;if(null!=(t=e._w).GG||null!=t.W||null!=t.E)r=1,a=4,n=de(t.GG,e._a[Tt],X(pe(),1,4).year),s=de(t.W,1),((i=de(t.E,1))<1||i>7)&&(u=!0);else{r=e._locale._week.dow,a=e._locale._week.doy;var l=X(pe(),r,a);n=de(t.gg,e._a[Tt],l.year),s=de(t.w,l.week),null!=t.d?((i=t.d)<0||i>6)&&(u=!0):null!=t.e?(i=t.e+r,(t.e<0||t.e>6)&&(u=!0)):i=r}s<1||s>K(n,r,a)?d(e)._overflowWeeks=!0:null!=u?d(e)._overflowWeekday=!0:(o=Q(n,s,i,r,a),e._a[Tt]=o.year,e._dayOfYear=o.dayOfYear)}(t),null!=t._dayOfYear&&(a=de(t._a[Tt],i[Tt]),(t._dayOfYear>V(a)||0===t._dayOfYear)&&(d(t)._overflowDayOfYear=!0),s=J(a,0,t._dayOfYear),t._a[xt]=s.getUTCMonth(),t._a[bt]=s.getUTCDate()),n=0;n<3&&null==t._a[n];++n)t._a[n]=o[n]=i[n];for(;n<7;n++)t._a[n]=o[n]=null==t._a[n]?2===n?1:0:t._a[n];24===t._a[Pt]&&0===t._a[Wt]&&0===t._a[Ht]&&0===t._a[Rt]&&(t._nextDay=!0,t._a[Pt]=0),t._d=(t._useUTC?J:function(e,t,n,s,i,r,a){var o=new Date(e,t,n,s,i,r,a);return e<100&&e>=0&&isFinite(o.getFullYear())&&o.setFullYear(e),o}).apply(null,o),r=t._useUTC?t._d.getUTCDay():t._d.getDay(),null!=t._tzm&&t._d.setUTCMinutes(t._d.getUTCMinutes()-t._tzm),t._nextDay&&(t._a[Pt]=24),t._w&&void 0!==t._w.d&&t._w.d!==r&&(d(t).weekdayMismatch=!0)}}function ce(e){var t,n,s,i,r,a,o=e._i,u=en.exec(o)||tn.exec(o);if(u){for(d(e).iso=!0,t=0,n=sn.length;t<n;t++)if(sn[t][1].exec(u[1])){i=sn[t][0],s=!1!==sn[t][2];break}if(null==i)return void(e._isValid=!1);if(u[3]){for(t=0,n=rn.length;t<n;t++)if(rn[t][1].exec(u[3])){r=(u[2]||" ")+rn[t][0];break}if(null==r)return void(e._isValid=!1)}if(!s&&null!=r)return void(e._isValid=!1);if(u[4]){if(!nn.exec(u[4]))return void(e._isValid=!1);a="Z"}e._f=i+(r||"")+(a||""),_e(e)}else e._isValid=!1}function fe(e,t,n,s,i,r){var a=[function(e){var t=parseInt(e,10);{if(t<=49)return 2e3+t;if(t<=999)return 1900+t}return t}(e),Vt.indexOf(t),parseInt(n,10),parseInt(s,10),parseInt(i,10)];return r&&a.push(parseInt(r,10)),a}function me(e){var t=on.exec(function(e){return e.replace(/\([^)]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").trim()}(e._i));if(t){var n=fe(t[4],t[3],t[2],t[5],t[6],t[7]);if(!function(e,t,n){if(e&&jt.indexOf(e)!==new Date(t[0],t[1],t[2]).getDay())return d(n).weekdayMismatch=!0,n._isValid=!1,!1;return!0}(t[1],n,e))return;e._a=n,e._tzm=function(e,t,n){if(e)return un[e];if(t)return 0;var s=parseInt(n,10),i=s%100;return(s-i)/100*60+i}(t[8],t[9],t[10]),e._d=J.apply(null,e._a),e._d.setUTCMinutes(e._d.getUTCMinutes()-e._tzm),d(e).rfc2822=!0}else e._isValid=!1}function _e(t){if(t._f!==e.ISO_8601)if(t._f!==e.RFC_2822){t._a=[],d(t).empty=!0;var n,s,i,r,a,o=""+t._i,u=o.length,l=0;for(i=R(t._f,t._locale).match(rt)||[],n=0;n<i.length;n++)r=i[n],(s=(o.match(F(r,t))||[])[0])&&((a=o.substr(0,o.indexOf(s))).length>0&&d(t).unusedInput.push(a),o=o.slice(o.indexOf(s)+s.length),l+=s.length),ut[r]?(s?d(t).empty=!1:d(t).unusedTokens.push(r),G(r,s,t)):t._strict&&!s&&d(t).unusedTokens.push(r);d(t).charsLeftOver=u-l,o.length>0&&d(t).unusedInput.push(o),t._a[Pt]<=12&&!0===d(t).bigHour&&t._a[Pt]>0&&(d(t).bigHour=void 0),d(t).parsedDateParts=t._a.slice(0),d(t).meridiem=t._meridiem,t._a[Pt]=function(e,t,n){var s;if(null==n)return t;return null!=e.meridiemHour?e.meridiemHour(t,n):null!=e.isPM?((s=e.isPM(n))&&t<12&&(t+=12),s||12!==t||(t=0),t):t}(t._locale,t._a[Pt],t._meridiem),he(t),le(t)}else me(t);else ce(t)}function ye(o){var l=o._i,y=o._f;return o._locale=o._locale||ue(o._l),null===l||void 0===y&&""===l?c({nullInput:!0}):("string"==typeof l&&(o._i=l=o._locale.preparse(l)),_(l)?new m(le(l)):(r(l)?o._d=l:t(y)?function(e){var t,n,s,i,r;if(0===e._f.length)return d(e).invalidFormat=!0,void(e._d=new Date(NaN));for(i=0;i<e._f.length;i++)r=0,t=f({},e),null!=e._useUTC&&(t._useUTC=e._useUTC),t._f=e._f[i],_e(t),h(t)&&(r+=d(t).charsLeftOver,r+=10*d(t).unusedTokens.length,d(t).score=r,(null==s||r<s)&&(s=r,n=t));u(e,n||t)}(o):y?_e(o):function(o){var u=o._i;s(u)?o._d=new Date(e.now()):r(u)?o._d=new Date(u.valueOf()):"string"==typeof u?function(t){var n=an.exec(t._i);null===n?(ce(t),!1===t._isValid&&(delete t._isValid,me(t),!1===t._isValid&&(delete t._isValid,e.createFromInputFallback(t)))):t._d=new Date(+n[1])}(o):t(u)?(o._a=a(u.slice(0),function(e){return parseInt(e,10)}),he(o)):n(u)?function(e){if(!e._d){var t=T(e._i);e._a=a([t.year,t.month,t.day||t.date,t.hour,t.minute,t.second,t.millisecond],function(e){return e&&parseInt(e,10)}),he(e)}}(o):i(u)?o._d=new Date(u):e.createFromInputFallback(o)}(o),h(o)||(o._d=null),o))}function ge(e,s,i,r,a){var o={};return!0!==i&&!1!==i||(r=i,i=void 0),(n(e)&&function(e){if(Object.getOwnPropertyNames)return 0===Object.getOwnPropertyNames(e).length;var t;for(t in e)if(e.hasOwnProperty(t))return!1;return!0}(e)||t(e)&&0===e.length)&&(e=void 0),o._isAMomentObject=!0,o._useUTC=o._isUTC=a,o._l=i,o._i=e,o._f=s,o._strict=r,function(e){var t=new m(le(ye(e)));return t._nextDay&&(t.add(1,"d"),t._nextDay=void 0),t}(o)}function pe(e,t,n,s){return ge(e,t,n,s,!1)}function we(e,n){var s,i;if(1===n.length&&t(n[0])&&(n=n[0]),!n.length)return pe();for(s=n[0],i=1;i<n.length;++i)n[i].isValid()&&!n[i][e](s)||(s=n[i]);return s}function ve(e){var t=T(e),n=t.year||0,s=t.quarter||0,i=t.month||0,r=t.week||0,a=t.day||0,o=t.hour||0,u=t.minute||0,l=t.second||0,d=t.millisecond||0;this._isValid=function(e){for(var t in e)if(-1===Ut.call(hn,t)||null!=e[t]&&isNaN(e[t]))return!1;for(var n=!1,s=0;s<hn.length;++s)if(e[hn[s]]){if(n)return!1;parseFloat(e[hn[s]])!==g(e[hn[s]])&&(n=!0)}return!0}(t),this._milliseconds=+d+1e3*l+6e4*u+1e3*o*60*60,this._days=+a+7*r,this._months=+i+3*s+12*n,this._data={},this._locale=ue(),this._bubble()}function Me(e){return e instanceof ve}function Se(e){return e<0?-1*Math.round(-1*e):Math.round(e)}function De(e,t){P(e,0,0,function(){var e=this.utcOffset(),n="+";return e<0&&(e=-e,n="-"),n+b(~~(e/60),2)+t+b(~~e%60,2)})}function ke(e,t){var n=(t||"").match(e);if(null===n)return null;var s=((n[n.length-1]||[])+"").match(cn)||["-",0,0],i=60*s[1]+g(s[2]);return 0===i?0:"+"===s[0]?i:-i}function Ye(t,n){var s,i;return n._isUTC?(s=n.clone(),i=(_(t)||r(t)?t.valueOf():pe(t).valueOf())-s.valueOf(),s._d.setTime(s._d.valueOf()+i),e.updateOffset(s,!1),s):pe(t).local()}function Oe(e){return 15*-Math.round(e._d.getTimezoneOffset()/15)}function Te(){return!!this.isValid()&&(this._isUTC&&0===this._offset)}function xe(e,t){var n,s,r,a=e,u=null;return Me(e)?a={ms:e._milliseconds,d:e._days,M:e._months}:i(e)?(a={},t?a[t]=e:a.milliseconds=e):(u=fn.exec(e))?(n="-"===u[1]?-1:1,a={y:0,d:g(u[bt])*n,h:g(u[Pt])*n,m:g(u[Wt])*n,s:g(u[Ht])*n,ms:g(Se(1e3*u[Rt]))*n}):(u=mn.exec(e))?(n="-"===u[1]?-1:(u[1],1),a={y:be(u[2],n),M:be(u[3],n),w:be(u[4],n),d:be(u[5],n),h:be(u[6],n),m:be(u[7],n),s:be(u[8],n)}):null==a?a={}:"object"==typeof a&&("from"in a||"to"in a)&&(r=function(e,t){var n;if(!e.isValid()||!t.isValid())return{milliseconds:0,months:0};t=Ye(t,e),e.isBefore(t)?n=Pe(e,t):((n=Pe(t,e)).milliseconds=-n.milliseconds,n.months=-n.months);return n}(pe(a.from),pe(a.to)),(a={}).ms=r.milliseconds,a.M=r.months),s=new ve(a),Me(e)&&o(e,"_locale")&&(s._locale=e._locale),s}function be(e,t){var n=e&&parseFloat(e.replace(",","."));return(isNaN(n)?0:n)*t}function Pe(e,t){var n={milliseconds:0,months:0};return n.months=t.month()-e.month()+12*(t.year()-e.year()),e.clone().add(n.months,"M").isAfter(t)&&--n.months,n.milliseconds=+t-+e.clone().add(n.months,"M"),n}function We(e,t){return function(n,s){var i,r;return null===s||isNaN(+s)||(M(t,"moment()."+t+"(period, number) is deprecated. Please use moment()."+t+"(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."),r=n,n=s,s=r),n="string"==typeof n?+n:n,i=xe(n,s),He(this,i,e),this}}function He(t,n,s,i){var r=n._milliseconds,a=Se(n._days),o=Se(n._months);t.isValid()&&(i=null==i||i,o&&z(t,A(t,"Month")+o*s),a&&j(t,"Date",A(t,"Date")+a*s),r&&t._d.setTime(t._d.valueOf()+r*s),i&&e.updateOffset(t,a||o))}function Re(e,t){var n,s=12*(t.year()-e.year())+(t.month()-e.month()),i=e.clone().add(s,"months");return n=t-i<0?(t-i)/(i-e.clone().add(s-1,"months")):(t-i)/(e.clone().add(s+1,"months")-i),-(s+n)||0}function Ce(e){var t;return void 0===e?this._locale._abbr:(null!=(t=ue(e))&&(this._locale=t),this)}function Fe(){return this._locale}function Ue(e,t){P(0,[e,e.length],0,t)}function Le(e,t,n,s,i){var r;return null==e?X(this,s,i).year:(r=K(e,s,i),t>r&&(t=r),function(e,t,n,s,i){var r=Q(e,t,n,s,i),a=J(r.year,0,r.dayOfYear);return this.year(a.getUTCFullYear()),this.month(a.getUTCMonth()),this.date(a.getUTCDate()),this}.call(this,e,t,n,s,i))}function Ne(e,t){t[Rt]=g(1e3*("0."+e))}function Ge(e){return e}function Ve(e,t,n,s){var i=ue(),r=l().set(s,t);return i[n](r,e)}function Ee(e,t,n){if(i(e)&&(t=e,e=void 0),e=e||"",null!=t)return Ve(e,t,n,"month");var s,r=[];for(s=0;s<12;s++)r[s]=Ve(e,s,n,"month");return r}function Ie(e,t,n,s){"boolean"==typeof e?(i(t)&&(n=t,t=void 0),t=t||""):(n=t=e,e=!1,i(t)&&(n=t,t=void 0),t=t||"");var r=ue(),a=e?r._week.dow:0;if(null!=n)return Ve(t,(n+a)%7,s,"day");var o,u=[];for(o=0;o<7;o++)u[o]=Ve(t,(o+a)%7,s,"day");return u}function Ae(e,t,n,s){var i=xe(t,n);return e._milliseconds+=s*i._milliseconds,e._days+=s*i._days,e._months+=s*i._months,e._bubble()}function je(e){return e<0?Math.floor(e):Math.ceil(e)}function Ze(e){return 4800*e/146097}function ze(e){return 146097*e/4800}function $e(e){return function(){return this.as(e)}}function qe(e){return function(){return this.isValid()?this._data[e]:NaN}}function Je(e){return(e>0)-(e<0)||+e}function Be(){if(!this.isValid())return this.localeData().invalidDate();var e,t,n=An(this._milliseconds)/1e3,s=An(this._days),i=An(this._months);t=y((e=y(n/60))/60),n%=60,e%=60;var r=y(i/12),a=i%=12,o=s,u=t,l=e,d=n?n.toFixed(3).replace(/\.?0+$/,""):"",h=this.asSeconds();if(!h)return"P0D";var c=h<0?"-":"",f=Je(this._months)!==Je(h)?"-":"",m=Je(this._days)!==Je(h)?"-":"",_=Je(this._milliseconds)!==Je(h)?"-":"";return c+"P"+(r?f+r+"Y":"")+(a?f+a+"M":"")+(o?m+o+"D":"")+(u||l||d?"T":"")+(u?_+u+"H":"")+(l?_+l+"M":"")+(d?_+d+"S":"")}var Qe,Xe;Xe=Array.prototype.some?Array.prototype.some:function(e){for(var t=Object(this),n=t.length>>>0,s=0;s<n;s++)if(s in t&&e.call(this,t[s],s,t))return!0;return!1};var Ke=e.momentProperties=[],et=!1,tt={};e.suppressDeprecationWarnings=!1,e.deprecationHandler=null;var nt;nt=Object.keys?Object.keys:function(e){var t,n=[];for(t in e)o(e,t)&&n.push(t);return n};var st={},it={},rt=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,at=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,ot={},ut={},lt=/\d/,dt=/\d\d/,ht=/\d{3}/,ct=/\d{4}/,ft=/[+-]?\d{6}/,mt=/\d\d?/,_t=/\d\d\d\d?/,yt=/\d\d\d\d\d\d?/,gt=/\d{1,3}/,pt=/\d{1,4}/,wt=/[+-]?\d{1,6}/,vt=/\d+/,Mt=/[+-]?\d+/,St=/Z|[+-]\d\d:?\d\d/gi,Dt=/Z|[+-]\d\d(?::?\d\d)?/gi,kt=/[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,Yt={},Ot={},Tt=0,xt=1,bt=2,Pt=3,Wt=4,Ht=5,Rt=6,Ct=7,Ft=8;P("Y",0,0,function(){var e=this.year();return e<=9999?""+e:"+"+e}),P(0,["YY",2],0,function(){return this.year()%100}),P(0,["YYYY",4],0,"year"),P(0,["YYYYY",5],0,"year"),P(0,["YYYYYY",6,!0],0,"year"),Y("year","y"),x("year",1),C("Y",Mt),C("YY",mt,dt),C("YYYY",pt,ct),C("YYYYY",wt,ft),C("YYYYYY",wt,ft),L(["YYYYY","YYYYYY"],Tt),L("YYYY",function(t,n){n[Tt]=2===t.length?e.parseTwoDigitYear(t):g(t)}),L("YY",function(t,n){n[Tt]=e.parseTwoDigitYear(t)}),L("Y",function(e,t){t[Tt]=parseInt(e,10)}),e.parseTwoDigitYear=function(e){return g(e)+(g(e)>68?1900:2e3)};var Ut,Lt=I("FullYear",!0);Ut=Array.prototype.indexOf?Array.prototype.indexOf:function(e){var t;for(t=0;t<this.length;++t)if(this[t]===e)return t;return-1},P("M",["MM",2],"Mo",function(){return this.month()+1}),P("MMM",0,0,function(e){return this.localeData().monthsShort(this,e)}),P("MMMM",0,0,function(e){return this.localeData().months(this,e)}),Y("month","M"),x("month",8),C("M",mt),C("MM",mt,dt),C("MMM",function(e,t){return t.monthsShortRegex(e)}),C("MMMM",function(e,t){return t.monthsRegex(e)}),L(["M","MM"],function(e,t){t[xt]=g(e)-1}),L(["MMM","MMMM"],function(e,t,n,s){var i=n._locale.monthsParse(e,s,n._strict);null!=i?t[xt]=i:d(n).invalidMonth=e});var Nt=/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,Gt="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),Vt="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),Et=kt,It=kt;P("w",["ww",2],"wo","week"),P("W",["WW",2],"Wo","isoWeek"),Y("week","w"),Y("isoWeek","W"),x("week",5),x("isoWeek",5),C("w",mt),C("ww",mt,dt),C("W",mt),C("WW",mt,dt),N(["w","ww","W","WW"],function(e,t,n,s){t[s.substr(0,1)]=g(e)});P("d",0,"do","day"),P("dd",0,0,function(e){return this.localeData().weekdaysMin(this,e)}),P("ddd",0,0,function(e){return this.localeData().weekdaysShort(this,e)}),P("dddd",0,0,function(e){return this.localeData().weekdays(this,e)}),P("e",0,0,"weekday"),P("E",0,0,"isoWeekday"),Y("day","d"),Y("weekday","e"),Y("isoWeekday","E"),x("day",11),x("weekday",11),x("isoWeekday",11),C("d",mt),C("e",mt),C("E",mt),C("dd",function(e,t){return t.weekdaysMinRegex(e)}),C("ddd",function(e,t){return t.weekdaysShortRegex(e)}),C("dddd",function(e,t){return t.weekdaysRegex(e)}),N(["dd","ddd","dddd"],function(e,t,n,s){var i=n._locale.weekdaysParse(e,s,n._strict);null!=i?t.d=i:d(n).invalidWeekday=e}),N(["d","e","E"],function(e,t,n,s){t[s]=g(e)});var At="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),jt="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),Zt="Su_Mo_Tu_We_Th_Fr_Sa".split("_"),zt=kt,$t=kt,qt=kt;P("H",["HH",2],0,"hour"),P("h",["hh",2],0,te),P("k",["kk",2],0,function(){return this.hours()||24}),P("hmm",0,0,function(){return""+te.apply(this)+b(this.minutes(),2)}),P("hmmss",0,0,function(){return""+te.apply(this)+b(this.minutes(),2)+b(this.seconds(),2)}),P("Hmm",0,0,function(){return""+this.hours()+b(this.minutes(),2)}),P("Hmmss",0,0,function(){return""+this.hours()+b(this.minutes(),2)+b(this.seconds(),2)}),ne("a",!0),ne("A",!1),Y("hour","h"),x("hour",13),C("a",se),C("A",se),C("H",mt),C("h",mt),C("k",mt),C("HH",mt,dt),C("hh",mt,dt),C("kk",mt,dt),C("hmm",_t),C("hmmss",yt),C("Hmm",_t),C("Hmmss",yt),L(["H","HH"],Pt),L(["k","kk"],function(e,t,n){var s=g(e);t[Pt]=24===s?0:s}),L(["a","A"],function(e,t,n){n._isPm=n._locale.isPM(e),n._meridiem=e}),L(["h","hh"],function(e,t,n){t[Pt]=g(e),d(n).bigHour=!0}),L("hmm",function(e,t,n){var s=e.length-2;t[Pt]=g(e.substr(0,s)),t[Wt]=g(e.substr(s)),d(n).bigHour=!0}),L("hmmss",function(e,t,n){var s=e.length-4,i=e.length-2;t[Pt]=g(e.substr(0,s)),t[Wt]=g(e.substr(s,2)),t[Ht]=g(e.substr(i)),d(n).bigHour=!0}),L("Hmm",function(e,t,n){var s=e.length-2;t[Pt]=g(e.substr(0,s)),t[Wt]=g(e.substr(s))}),L("Hmmss",function(e,t,n){var s=e.length-4,i=e.length-2;t[Pt]=g(e.substr(0,s)),t[Wt]=g(e.substr(s,2)),t[Ht]=g(e.substr(i))});var Jt,Bt=I("Hours",!0),Qt={calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},longDateFormat:{LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},invalidDate:"Invalid date",ordinal:"%d",dayOfMonthOrdinalParse:/\d{1,2}/,relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",ss:"%d seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},months:Gt,monthsShort:Vt,week:{dow:0,doy:6},weekdays:At,weekdaysMin:Zt,weekdaysShort:jt,meridiemParse:/[ap]\.?m?\.?/i},Xt={},Kt={},en=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,tn=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,nn=/Z|[+-]\d\d(?::?\d\d)?/,sn=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/]],rn=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],an=/^\/?Date\((\-?\d+)/i,on=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,un={UT:0,GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};e.createFromInputFallback=v("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",function(e){e._d=new Date(e._i+(e._useUTC?" UTC":""))}),e.ISO_8601=function(){},e.RFC_2822=function(){};var ln=v("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",function(){var e=pe.apply(null,arguments);return this.isValid()&&e.isValid()?e<this?this:e:c()}),dn=v("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",function(){var e=pe.apply(null,arguments);return this.isValid()&&e.isValid()?e>this?this:e:c()}),hn=["year","quarter","month","week","day","hour","minute","second","millisecond"];De("Z",":"),De("ZZ",""),C("Z",Dt),C("ZZ",Dt),L(["Z","ZZ"],function(e,t,n){n._useUTC=!0,n._tzm=ke(Dt,e)});var cn=/([\+\-]|\d\d)/gi;e.updateOffset=function(){};var fn=/^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/,mn=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;xe.fn=ve.prototype,xe.invalid=function(){return xe(NaN)};var _n=We(1,"add"),yn=We(-1,"subtract");e.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",e.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var gn=v("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",function(e){return void 0===e?this.localeData():this.locale(e)});P(0,["gg",2],0,function(){return this.weekYear()%100}),P(0,["GG",2],0,function(){return this.isoWeekYear()%100}),Ue("gggg","weekYear"),Ue("ggggg","weekYear"),Ue("GGGG","isoWeekYear"),Ue("GGGGG","isoWeekYear"),Y("weekYear","gg"),Y("isoWeekYear","GG"),x("weekYear",1),x("isoWeekYear",1),C("G",Mt),C("g",Mt),C("GG",mt,dt),C("gg",mt,dt),C("GGGG",pt,ct),C("gggg",pt,ct),C("GGGGG",wt,ft),C("ggggg",wt,ft),N(["gggg","ggggg","GGGG","GGGGG"],function(e,t,n,s){t[s.substr(0,2)]=g(e)}),N(["gg","GG"],function(t,n,s,i){n[i]=e.parseTwoDigitYear(t)}),P("Q",0,"Qo","quarter"),Y("quarter","Q"),x("quarter",7),C("Q",lt),L("Q",function(e,t){t[xt]=3*(g(e)-1)}),P("D",["DD",2],"Do","date"),Y("date","D"),x("date",9),C("D",mt),C("DD",mt,dt),C("Do",function(e,t){return e?t._dayOfMonthOrdinalParse||t._ordinalParse:t._dayOfMonthOrdinalParseLenient}),L(["D","DD"],bt),L("Do",function(e,t){t[bt]=g(e.match(mt)[0])});var pn=I("Date",!0);P("DDD",["DDDD",3],"DDDo","dayOfYear"),Y("dayOfYear","DDD"),x("dayOfYear",4),C("DDD",gt),C("DDDD",ht),L(["DDD","DDDD"],function(e,t,n){n._dayOfYear=g(e)}),P("m",["mm",2],0,"minute"),Y("minute","m"),x("minute",14),C("m",mt),C("mm",mt,dt),L(["m","mm"],Wt);var wn=I("Minutes",!1);P("s",["ss",2],0,"second"),Y("second","s"),x("second",15),C("s",mt),C("ss",mt,dt),L(["s","ss"],Ht);var vn=I("Seconds",!1);P("S",0,0,function(){return~~(this.millisecond()/100)}),P(0,["SS",2],0,function(){return~~(this.millisecond()/10)}),P(0,["SSS",3],0,"millisecond"),P(0,["SSSS",4],0,function(){return 10*this.millisecond()}),P(0,["SSSSS",5],0,function(){return 100*this.millisecond()}),P(0,["SSSSSS",6],0,function(){return 1e3*this.millisecond()}),P(0,["SSSSSSS",7],0,function(){return 1e4*this.millisecond()}),P(0,["SSSSSSSS",8],0,function(){return 1e5*this.millisecond()}),P(0,["SSSSSSSSS",9],0,function(){return 1e6*this.millisecond()}),Y("millisecond","ms"),x("millisecond",16),C("S",gt,lt),C("SS",gt,dt),C("SSS",gt,ht);var Mn;for(Mn="SSSS";Mn.length<=9;Mn+="S")C(Mn,vt);for(Mn="S";Mn.length<=9;Mn+="S")L(Mn,Ne);var Sn=I("Milliseconds",!1);P("z",0,0,"zoneAbbr"),P("zz",0,0,"zoneName");var Dn=m.prototype;Dn.add=_n,Dn.calendar=function(t,n){var s=t||pe(),i=Ye(s,this).startOf("day"),r=e.calendarFormat(this,i)||"sameElse",a=n&&(S(n[r])?n[r].call(this,s):n[r]);return this.format(a||this.localeData().calendar(r,this,pe(s)))},Dn.clone=function(){return new m(this)},Dn.diff=function(e,t,n){var s,i,r;if(!this.isValid())return NaN;if(!(s=Ye(e,this)).isValid())return NaN;switch(i=6e4*(s.utcOffset()-this.utcOffset()),t=O(t)){case"year":r=Re(this,s)/12;break;case"month":r=Re(this,s);break;case"quarter":r=Re(this,s)/3;break;case"second":r=(this-s)/1e3;break;case"minute":r=(this-s)/6e4;break;case"hour":r=(this-s)/36e5;break;case"day":r=(this-s-i)/864e5;break;case"week":r=(this-s-i)/6048e5;break;default:r=this-s}return n?r:y(r)},Dn.endOf=function(e){return void 0===(e=O(e))||"millisecond"===e?this:("date"===e&&(e="day"),this.startOf(e).add(1,"isoWeek"===e?"week":e).subtract(1,"ms"))},Dn.format=function(t){t||(t=this.isUtc()?e.defaultFormatUtc:e.defaultFormat);var n=H(this,t);return this.localeData().postformat(n)},Dn.from=function(e,t){return this.isValid()&&(_(e)&&e.isValid()||pe(e).isValid())?xe({to:this,from:e}).locale(this.locale()).humanize(!t):this.localeData().invalidDate()},Dn.fromNow=function(e){return this.from(pe(),e)},Dn.to=function(e,t){return this.isValid()&&(_(e)&&e.isValid()||pe(e).isValid())?xe({from:this,to:e}).locale(this.locale()).humanize(!t):this.localeData().invalidDate()},Dn.toNow=function(e){return this.to(pe(),e)},Dn.get=function(e){return e=O(e),S(this[e])?this[e]():this},Dn.invalidAt=function(){return d(this).overflow},Dn.isAfter=function(e,t){var n=_(e)?e:pe(e);return!(!this.isValid()||!n.isValid())&&("millisecond"===(t=O(s(t)?"millisecond":t))?this.valueOf()>n.valueOf():n.valueOf()<this.clone().startOf(t).valueOf())},Dn.isBefore=function(e,t){var n=_(e)?e:pe(e);return!(!this.isValid()||!n.isValid())&&("millisecond"===(t=O(s(t)?"millisecond":t))?this.valueOf()<n.valueOf():this.clone().endOf(t).valueOf()<n.valueOf())},Dn.isBetween=function(e,t,n,s){return("("===(s=s||"()")[0]?this.isAfter(e,n):!this.isBefore(e,n))&&(")"===s[1]?this.isBefore(t,n):!this.isAfter(t,n))},Dn.isSame=function(e,t){var n,s=_(e)?e:pe(e);return!(!this.isValid()||!s.isValid())&&("millisecond"===(t=O(t||"millisecond"))?this.valueOf()===s.valueOf():(n=s.valueOf(),this.clone().startOf(t).valueOf()<=n&&n<=this.clone().endOf(t).valueOf()))},Dn.isSameOrAfter=function(e,t){return this.isSame(e,t)||this.isAfter(e,t)},Dn.isSameOrBefore=function(e,t){return this.isSame(e,t)||this.isBefore(e,t)},Dn.isValid=function(){return h(this)},Dn.lang=gn,Dn.locale=Ce,Dn.localeData=Fe,Dn.max=dn,Dn.min=ln,Dn.parsingFlags=function(){return u({},d(this))},Dn.set=function(e,t){if("object"==typeof e)for(var n=function(e){var t=[];for(var n in e)t.push({unit:n,priority:it[n]});return t.sort(function(e,t){return e.priority-t.priority}),t}(e=T(e)),s=0;s<n.length;s++)this[n[s].unit](e[n[s].unit]);else if(e=O(e),S(this[e]))return this[e](t);return this},Dn.startOf=function(e){switch(e=O(e)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":case"date":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===e&&this.weekday(0),"isoWeek"===e&&this.isoWeekday(1),"quarter"===e&&this.month(3*Math.floor(this.month()/3)),this},Dn.subtract=yn,Dn.toArray=function(){return[this.year(),this.month(),this.date(),this.hour(),this.minute(),this.second(),this.millisecond()]},Dn.toObject=function(){return{years:this.year(),months:this.month(),date:this.date(),hours:this.hours(),minutes:this.minutes(),seconds:this.seconds(),milliseconds:this.milliseconds()}},Dn.toDate=function(){return new Date(this.valueOf())},Dn.toISOString=function(e){if(!this.isValid())return null;var t=!0!==e,n=t?this.clone().utc():this;return n.year()<0||n.year()>9999?H(n,t?"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYYYY-MM-DD[T]HH:mm:ss.SSSZ"):S(Date.prototype.toISOString)?t?this.toDate().toISOString():new Date(this._d.valueOf()).toISOString().replace("Z",H(n,"Z")):H(n,t?"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYY-MM-DD[T]HH:mm:ss.SSSZ")},Dn.inspect=function(){if(!this.isValid())return"moment.invalid(/* "+this._i+" */)";var e="moment",t="";this.isLocal()||(e=0===this.utcOffset()?"moment.utc":"moment.parseZone",t="Z");var n="["+e+'("]',s=0<=this.year()&&this.year()<=9999?"YYYY":"YYYYYY",i=t+'[")]';return this.format(n+s+"-MM-DD[T]HH:mm:ss.SSS"+i)},Dn.toJSON=function(){return this.isValid()?this.toISOString():null},Dn.toString=function(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},Dn.unix=function(){return Math.floor(this.valueOf()/1e3)},Dn.valueOf=function(){return this._d.valueOf()-6e4*(this._offset||0)},Dn.creationData=function(){return{input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}},Dn.year=Lt,Dn.isLeapYear=function(){return E(this.year())},Dn.weekYear=function(e){return Le.call(this,e,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)},Dn.isoWeekYear=function(e){return Le.call(this,e,this.isoWeek(),this.isoWeekday(),1,4)},Dn.quarter=Dn.quarters=function(e){return null==e?Math.ceil((this.month()+1)/3):this.month(3*(e-1)+this.month()%3)},Dn.month=$,Dn.daysInMonth=function(){return Z(this.year(),this.month())},Dn.week=Dn.weeks=function(e){var t=this.localeData().week(this);return null==e?t:this.add(7*(e-t),"d")},Dn.isoWeek=Dn.isoWeeks=function(e){var t=X(this,1,4).week;return null==e?t:this.add(7*(e-t),"d")},Dn.weeksInYear=function(){var e=this.localeData()._week;return K(this.year(),e.dow,e.doy)},Dn.isoWeeksInYear=function(){return K(this.year(),1,4)},Dn.date=pn,Dn.day=Dn.days=function(e){if(!this.isValid())return null!=e?this:NaN;var t=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=e?(e=function(e,t){return"string"!=typeof e?e:isNaN(e)?"number"==typeof(e=t.weekdaysParse(e))?e:null:parseInt(e,10)}(e,this.localeData()),this.add(e-t,"d")):t},Dn.weekday=function(e){if(!this.isValid())return null!=e?this:NaN;var t=(this.day()+7-this.localeData()._week.dow)%7;return null==e?t:this.add(e-t,"d")},Dn.isoWeekday=function(e){if(!this.isValid())return null!=e?this:NaN;if(null!=e){var t=function(e,t){return"string"==typeof e?t.weekdaysParse(e)%7||7:isNaN(e)?null:e}(e,this.localeData());return this.day(this.day()%7?t:t-7)}return this.day()||7},Dn.dayOfYear=function(e){var t=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==e?t:this.add(e-t,"d")},Dn.hour=Dn.hours=Bt,Dn.minute=Dn.minutes=wn,Dn.second=Dn.seconds=vn,Dn.millisecond=Dn.milliseconds=Sn,Dn.utcOffset=function(t,n,s){var i,r=this._offset||0;if(!this.isValid())return null!=t?this:NaN;if(null!=t){if("string"==typeof t){if(null===(t=ke(Dt,t)))return this}else Math.abs(t)<16&&!s&&(t*=60);return!this._isUTC&&n&&(i=Oe(this)),this._offset=t,this._isUTC=!0,null!=i&&this.add(i,"m"),r!==t&&(!n||this._changeInProgress?He(this,xe(t-r,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,e.updateOffset(this,!0),this._changeInProgress=null)),this}return this._isUTC?r:Oe(this)},Dn.utc=function(e){return this.utcOffset(0,e)},Dn.local=function(e){return this._isUTC&&(this.utcOffset(0,e),this._isUTC=!1,e&&this.subtract(Oe(this),"m")),this},Dn.parseZone=function(){if(null!=this._tzm)this.utcOffset(this._tzm,!1,!0);else if("string"==typeof this._i){var e=ke(St,this._i);null!=e?this.utcOffset(e):this.utcOffset(0,!0)}return this},Dn.hasAlignedHourOffset=function(e){return!!this.isValid()&&(e=e?pe(e).utcOffset():0,(this.utcOffset()-e)%60==0)},Dn.isDST=function(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()},Dn.isLocal=function(){return!!this.isValid()&&!this._isUTC},Dn.isUtcOffset=function(){return!!this.isValid()&&this._isUTC},Dn.isUtc=Te,Dn.isUTC=Te,Dn.zoneAbbr=function(){return this._isUTC?"UTC":""},Dn.zoneName=function(){return this._isUTC?"Coordinated Universal Time":""},Dn.dates=v("dates accessor is deprecated. Use date instead.",pn),Dn.months=v("months accessor is deprecated. Use month instead",$),Dn.years=v("years accessor is deprecated. Use year instead",Lt),Dn.zone=v("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",function(e,t){return null!=e?("string"!=typeof e&&(e=-e),this.utcOffset(e,t),this):-this.utcOffset()}),Dn.isDSTShifted=v("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",function(){if(!s(this._isDSTShifted))return this._isDSTShifted;var e={};if(f(e,this),(e=ye(e))._a){var t=e._isUTC?l(e._a):pe(e._a);this._isDSTShifted=this.isValid()&&p(e._a,t.toArray())>0}else this._isDSTShifted=!1;return this._isDSTShifted});var kn=k.prototype;kn.calendar=function(e,t,n){var s=this._calendar[e]||this._calendar.sameElse;return S(s)?s.call(t,n):s},kn.longDateFormat=function(e){var t=this._longDateFormat[e],n=this._longDateFormat[e.toUpperCase()];return t||!n?t:(this._longDateFormat[e]=n.replace(/MMMM|MM|DD|dddd/g,function(e){return e.slice(1)}),this._longDateFormat[e])},kn.invalidDate=function(){return this._invalidDate},kn.ordinal=function(e){return this._ordinal.replace("%d",e)},kn.preparse=Ge,kn.postformat=Ge,kn.relativeTime=function(e,t,n,s){var i=this._relativeTime[n];return S(i)?i(e,t,n,s):i.replace(/%d/i,e)},kn.pastFuture=function(e,t){var n=this._relativeTime[e>0?"future":"past"];return S(n)?n(t):n.replace(/%s/i,t)},kn.set=function(e){var t,n;for(n in e)S(t=e[n])?this[n]=t:this["_"+n]=t;this._config=e,this._dayOfMonthOrdinalParseLenient=new RegExp((this._dayOfMonthOrdinalParse.source||this._ordinalParse.source)+"|"+/\d{1,2}/.source)},kn.months=function(e,n){return e?t(this._months)?this._months[e.month()]:this._months[(this._months.isFormat||Nt).test(n)?"format":"standalone"][e.month()]:t(this._months)?this._months:this._months.standalone},kn.monthsShort=function(e,n){return e?t(this._monthsShort)?this._monthsShort[e.month()]:this._monthsShort[Nt.test(n)?"format":"standalone"][e.month()]:t(this._monthsShort)?this._monthsShort:this._monthsShort.standalone},kn.monthsParse=function(e,t,n){var s,i,r;if(this._monthsParseExact)return function(e,t,n){var s,i,r,a=e.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],s=0;s<12;++s)r=l([2e3,s]),this._shortMonthsParse[s]=this.monthsShort(r,"").toLocaleLowerCase(),this._longMonthsParse[s]=this.months(r,"").toLocaleLowerCase();return n?"MMM"===t?-1!==(i=Ut.call(this._shortMonthsParse,a))?i:null:-1!==(i=Ut.call(this._longMonthsParse,a))?i:null:"MMM"===t?-1!==(i=Ut.call(this._shortMonthsParse,a))?i:-1!==(i=Ut.call(this._longMonthsParse,a))?i:null:-1!==(i=Ut.call(this._longMonthsParse,a))?i:-1!==(i=Ut.call(this._shortMonthsParse,a))?i:null}.call(this,e,t,n);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),s=0;s<12;s++){if(i=l([2e3,s]),n&&!this._longMonthsParse[s]&&(this._longMonthsParse[s]=new RegExp("^"+this.months(i,"").replace(".","")+"$","i"),this._shortMonthsParse[s]=new RegExp("^"+this.monthsShort(i,"").replace(".","")+"$","i")),n||this._monthsParse[s]||(r="^"+this.months(i,"")+"|^"+this.monthsShort(i,""),this._monthsParse[s]=new RegExp(r.replace(".",""),"i")),n&&"MMMM"===t&&this._longMonthsParse[s].test(e))return s;if(n&&"MMM"===t&&this._shortMonthsParse[s].test(e))return s;if(!n&&this._monthsParse[s].test(e))return s}},kn.monthsRegex=function(e){return this._monthsParseExact?(o(this,"_monthsRegex")||q.call(this),e?this._monthsStrictRegex:this._monthsRegex):(o(this,"_monthsRegex")||(this._monthsRegex=It),this._monthsStrictRegex&&e?this._monthsStrictRegex:this._monthsRegex)},kn.monthsShortRegex=function(e){return this._monthsParseExact?(o(this,"_monthsRegex")||q.call(this),e?this._monthsShortStrictRegex:this._monthsShortRegex):(o(this,"_monthsShortRegex")||(this._monthsShortRegex=Et),this._monthsShortStrictRegex&&e?this._monthsShortStrictRegex:this._monthsShortRegex)},kn.week=function(e){return X(e,this._week.dow,this._week.doy).week},kn.firstDayOfYear=function(){return this._week.doy},kn.firstDayOfWeek=function(){return this._week.dow},kn.weekdays=function(e,n){return e?t(this._weekdays)?this._weekdays[e.day()]:this._weekdays[this._weekdays.isFormat.test(n)?"format":"standalone"][e.day()]:t(this._weekdays)?this._weekdays:this._weekdays.standalone},kn.weekdaysMin=function(e){return e?this._weekdaysMin[e.day()]:this._weekdaysMin},kn.weekdaysShort=function(e){return e?this._weekdaysShort[e.day()]:this._weekdaysShort},kn.weekdaysParse=function(e,t,n){var s,i,r;if(this._weekdaysParseExact)return function(e,t,n){var s,i,r,a=e.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],s=0;s<7;++s)r=l([2e3,1]).day(s),this._minWeekdaysParse[s]=this.weekdaysMin(r,"").toLocaleLowerCase(),this._shortWeekdaysParse[s]=this.weekdaysShort(r,"").toLocaleLowerCase(),this._weekdaysParse[s]=this.weekdays(r,"").toLocaleLowerCase();return n?"dddd"===t?-1!==(i=Ut.call(this._weekdaysParse,a))?i:null:"ddd"===t?-1!==(i=Ut.call(this._shortWeekdaysParse,a))?i:null:-1!==(i=Ut.call(this._minWeekdaysParse,a))?i:null:"dddd"===t?-1!==(i=Ut.call(this._weekdaysParse,a))?i:-1!==(i=Ut.call(this._shortWeekdaysParse,a))?i:-1!==(i=Ut.call(this._minWeekdaysParse,a))?i:null:"ddd"===t?-1!==(i=Ut.call(this._shortWeekdaysParse,a))?i:-1!==(i=Ut.call(this._weekdaysParse,a))?i:-1!==(i=Ut.call(this._minWeekdaysParse,a))?i:null:-1!==(i=Ut.call(this._minWeekdaysParse,a))?i:-1!==(i=Ut.call(this._weekdaysParse,a))?i:-1!==(i=Ut.call(this._shortWeekdaysParse,a))?i:null}.call(this,e,t,n);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),s=0;s<7;s++){if(i=l([2e3,1]).day(s),n&&!this._fullWeekdaysParse[s]&&(this._fullWeekdaysParse[s]=new RegExp("^"+this.weekdays(i,"").replace(".",".?")+"$","i"),this._shortWeekdaysParse[s]=new RegExp("^"+this.weekdaysShort(i,"").replace(".",".?")+"$","i"),this._minWeekdaysParse[s]=new RegExp("^"+this.weekdaysMin(i,"").replace(".",".?")+"$","i")),this._weekdaysParse[s]||(r="^"+this.weekdays(i,"")+"|^"+this.weekdaysShort(i,"")+"|^"+this.weekdaysMin(i,""),this._weekdaysParse[s]=new RegExp(r.replace(".",""),"i")),n&&"dddd"===t&&this._fullWeekdaysParse[s].test(e))return s;if(n&&"ddd"===t&&this._shortWeekdaysParse[s].test(e))return s;if(n&&"dd"===t&&this._minWeekdaysParse[s].test(e))return s;if(!n&&this._weekdaysParse[s].test(e))return s}},kn.weekdaysRegex=function(e){return this._weekdaysParseExact?(o(this,"_weekdaysRegex")||ee.call(this),e?this._weekdaysStrictRegex:this._weekdaysRegex):(o(this,"_weekdaysRegex")||(this._weekdaysRegex=zt),this._weekdaysStrictRegex&&e?this._weekdaysStrictRegex:this._weekdaysRegex)},kn.weekdaysShortRegex=function(e){return this._weekdaysParseExact?(o(this,"_weekdaysRegex")||ee.call(this),e?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):(o(this,"_weekdaysShortRegex")||(this._weekdaysShortRegex=$t),this._weekdaysShortStrictRegex&&e?this._weekdaysShortStrictRegex:this._weekdaysShortRegex)},kn.weekdaysMinRegex=function(e){return this._weekdaysParseExact?(o(this,"_weekdaysRegex")||ee.call(this),e?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):(o(this,"_weekdaysMinRegex")||(this._weekdaysMinRegex=qt),this._weekdaysMinStrictRegex&&e?this._weekdaysMinStrictRegex:this._weekdaysMinRegex)},kn.isPM=function(e){return"p"===(e+"").toLowerCase().charAt(0)},kn.meridiem=function(e,t,n){return e>11?n?"pm":"PM":n?"am":"AM"},ae("en",{dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(e){var t=e%10;return e+(1===g(e%100/10)?"th":1===t?"st":2===t?"nd":3===t?"rd":"th")}}),e.lang=v("moment.lang is deprecated. Use moment.locale instead.",ae),e.langData=v("moment.langData is deprecated. Use moment.localeData instead.",ue);var Yn=Math.abs,On=$e("ms"),Tn=$e("s"),xn=$e("m"),bn=$e("h"),Pn=$e("d"),Wn=$e("w"),Hn=$e("M"),Rn=$e("y"),Cn=qe("milliseconds"),Fn=qe("seconds"),Un=qe("minutes"),Ln=qe("hours"),Nn=qe("days"),Gn=qe("months"),Vn=qe("years"),En=Math.round,In={ss:44,s:45,m:45,h:22,d:26,M:11},An=Math.abs,jn=ve.prototype;return jn.isValid=function(){return this._isValid},jn.abs=function(){var e=this._data;return this._milliseconds=Yn(this._milliseconds),this._days=Yn(this._days),this._months=Yn(this._months),e.milliseconds=Yn(e.milliseconds),e.seconds=Yn(e.seconds),e.minutes=Yn(e.minutes),e.hours=Yn(e.hours),e.months=Yn(e.months),e.years=Yn(e.years),this},jn.add=function(e,t){return Ae(this,e,t,1)},jn.subtract=function(e,t){return Ae(this,e,t,-1)},jn.as=function(e){if(!this.isValid())return NaN;var t,n,s=this._milliseconds;if("month"===(e=O(e))||"year"===e)return t=this._days+s/864e5,n=this._months+Ze(t),"month"===e?n:n/12;switch(t=this._days+Math.round(ze(this._months)),e){case"week":return t/7+s/6048e5;case"day":return t+s/864e5;case"hour":return 24*t+s/36e5;case"minute":return 1440*t+s/6e4;case"second":return 86400*t+s/1e3;case"millisecond":return Math.floor(864e5*t)+s;default:throw new Error("Unknown unit "+e)}},jn.asMilliseconds=On,jn.asSeconds=Tn,jn.asMinutes=xn,jn.asHours=bn,jn.asDays=Pn,jn.asWeeks=Wn,jn.asMonths=Hn,jn.asYears=Rn,jn.valueOf=function(){return this.isValid()?this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*g(this._months/12):NaN},jn._bubble=function(){var e,t,n,s,i,r=this._milliseconds,a=this._days,o=this._months,u=this._data;return r>=0&&a>=0&&o>=0||r<=0&&a<=0&&o<=0||(r+=864e5*je(ze(o)+a),a=0,o=0),u.milliseconds=r%1e3,e=y(r/1e3),u.seconds=e%60,t=y(e/60),u.minutes=t%60,n=y(t/60),u.hours=n%24,a+=y(n/24),i=y(Ze(a)),o+=i,a-=je(ze(i)),s=y(o/12),o%=12,u.days=a,u.months=o,u.years=s,this},jn.clone=function(){return xe(this)},jn.get=function(e){return e=O(e),this.isValid()?this[e+"s"]():NaN},jn.milliseconds=Cn,jn.seconds=Fn,jn.minutes=Un,jn.hours=Ln,jn.days=Nn,jn.weeks=function(){return y(this.days()/7)},jn.months=Gn,jn.years=Vn,jn.humanize=function(e){if(!this.isValid())return this.localeData().invalidDate();var t=this.localeData(),n=function(e,t,n){var s=xe(e).abs(),i=En(s.as("s")),r=En(s.as("m")),a=En(s.as("h")),o=En(s.as("d")),u=En(s.as("M")),l=En(s.as("y")),d=i<=In.ss&&["s",i]||i<In.s&&["ss",i]||r<=1&&["m"]||r<In.m&&["mm",r]||a<=1&&["h"]||a<In.h&&["hh",a]||o<=1&&["d"]||o<In.d&&["dd",o]||u<=1&&["M"]||u<In.M&&["MM",u]||l<=1&&["y"]||["yy",l];return d[2]=t,d[3]=+e>0,d[4]=n,function(e,t,n,s,i){return i.relativeTime(t||1,!!n,e,s)}.apply(null,d)}(this,!e,t);return e&&(n=t.pastFuture(+this,n)),t.postformat(n)},jn.toISOString=Be,jn.toString=Be,jn.toJSON=Be,jn.locale=Ce,jn.localeData=Fe,jn.toIsoString=v("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",Be),jn.lang=gn,P("X",0,0,"unix"),P("x",0,0,"valueOf"),C("x",Mt),C("X",/[+-]?\d+(\.\d{1,3})?/),L("X",function(e,t,n){n._d=new Date(1e3*parseFloat(e,10))}),L("x",function(e,t,n){n._d=new Date(g(e))}),e.version="2.20.0",function(e){Qe=e}(pe),e.fn=Dn,e.min=function(){return we("isBefore",[].slice.call(arguments,0))},e.max=function(){return we("isAfter",[].slice.call(arguments,0))},e.now=function(){return Date.now?Date.now():+new Date},e.utc=l,e.unix=function(e){return pe(1e3*e)},e.months=function(e,t){return Ee(e,t,"months")},e.isDate=r,e.locale=ae,e.invalid=c,e.duration=xe,e.isMoment=_,e.weekdays=function(e,t,n){return Ie(e,t,n,"weekdays")},e.parseZone=function(){return pe.apply(null,arguments).parseZone()},e.localeData=ue,e.isDuration=Me,e.monthsShort=function(e,t){return Ee(e,t,"monthsShort")},e.weekdaysMin=function(e,t,n){return Ie(e,t,n,"weekdaysMin")},e.defineLocale=oe,e.updateLocale=function(e,t){if(null!=t){var n,s,i=Qt;null!=(s=re(e))&&(i=s._config),(n=new k(t=D(i,t))).parentLocale=Xt[e],Xt[e]=n,ae(e)}else null!=Xt[e]&&(null!=Xt[e].parentLocale?Xt[e]=Xt[e].parentLocale:null!=Xt[e]&&delete Xt[e]);return Xt[e]},e.locales=function(){return nt(Xt)},e.weekdaysShort=function(e,t,n){return Ie(e,t,n,"weekdaysShort")},e.normalizeUnits=O,e.relativeTimeRounding=function(e){return void 0===e?En:"function"==typeof e&&(En=e,!0)},e.relativeTimeThreshold=function(e,t){return void 0!==In[e]&&(void 0===t?In[e]:(In[e]=t,"s"===e&&(In.ss=t-1),!0))},e.calendarFormat=function(e,t){var n=e.diff(t,"days",!0);return n<-6?"sameElse":n<-1?"lastWeek":n<0?"lastDay":n<1?"sameDay":n<2?"nextDay":n<7?"nextWeek":"sameElse"},e.prototype=Dn,e.HTML5_FMT={DATETIME_LOCAL:"YYYY-MM-DDTHH:mm",DATETIME_LOCAL_SECONDS:"YYYY-MM-DDTHH:mm:ss",DATETIME_LOCAL_MS:"YYYY-MM-DDTHH:mm:ss.SSS",DATE:"YYYY-MM-DD",TIME:"HH:mm",TIME_SECONDS:"HH:mm:ss",TIME_MS:"HH:mm:ss.SSS",WEEK:"YYYY-[W]WW",MONTH:"YYYY-MM"},e});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module)))

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ })
/******/ ]);