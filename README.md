A Connect Four Dapp
=

Play connect four on the ethereum blockchain!

Winnings are enforced by smart contract. Not making a move for a certain amount of time is considered a forfeit.

Uses ganache for local testing

To test changes:
 - Start ganache
  - The GUI for ganache is a bit buggy, so use the command-line ganache instead
  - `ganache-cli -p 7545 -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"`
 - To test the smart contract
  - `npm run test`
 - To test changes and redeploy the smart contract to ganache:
  - `npm run dw`
 - To test changes to the webpage
  - `npm run build` _or_ `webpack`
