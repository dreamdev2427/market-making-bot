# market making bot
The market making bot for Pancakswap (Binance)

Binance market making bot that purchases the specified token when liquidity is added.

## Prerequisities
- Node and NPM https://nodejs.org/en/download/
- Wallet with BNB for gas and tokens for swap

## Running BOT
- Update env.js and provide private key to wallet and token address you want to target
- Bot is preconfigured for Pancakeswap on Binance network. Review configuration in constants.js. 
    If you want to use bot with Pancakeswap you need to provide infura network configuration and Pancakeswap ABIs. 
    To use this bot on BSC mainnet , You need to do sme modifications.
    On env.js :
        TOKEN_ADDRESS, //change it to a token address on BSC mainnet
        WBNB_ADDRESS, //change it to a token address on BSC mainnet
        AMOUNT, // this is the amount of token on each swap
        PERIOD, // time interval for automatic swap
        PR_K // change it to private key of your wallet account
    On constants.js :
        PANCAKESWAP_ROUTER_ADDRESS // change it to the pancake router address on BSC mainnet
        PANCAKESWAP_FACTORY_ADDRESS // change it to the pancake factory address on BSC mainnet
        HTTP_PROVIDER_LINK // change it to rpc of a node on BSC mainnet
    That's all.
- Install packages `yarn install` from inside project folder
- Run script `yarn start` or `node frontrun.js`
