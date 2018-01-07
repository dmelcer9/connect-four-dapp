A Connect Four Dapp
=

Play connect four on the ethereum blockchain!

Winnings are enforced by smart contract. Not making a move for a certain amount of time is considered a forfeit.

Uses ganache for local testing

To test changes:
 - Start ganache
   - The GUI for ganache is a bit buggy, so use the command-line ganache instead
   - `ganache-cli -p 7545 -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"`
 - To test the smart contract itself
   - `npm run test`
 - To deploy the contract to ganache and run a dev server:
   - `npm run dev`

To deploy to ropsten (via infura):
  - Modify truffle.js to include your desired mnemonic and infura API key
  - `npm run deploy-ropsten`
