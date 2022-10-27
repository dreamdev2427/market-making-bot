/**
 * Perform a front-running attack on uniswap
 */
const fs = require('fs');
var Web3 = require("web3");
var abiDecoder = require("abi-decoder");
var colors = require("colors");
var Tx = require("ethereumjs-tx").Transaction;
var axios = require("axios");
const { setIntervalAsync } = require('set-interval-async/dynamic');
var BigNumber = require("big-number");
const ERC20ABI = require("./ERC20.json");

const {
  PANCAKESWAP_ROUTER_ADDRESS,
  PANCAKESWAP_FACTORY_ADDRESS,
  PANCAKESWAP_ROUTER_ABI,
  PANCAKESWAP_FACTORY_ABI,
  PANCAKESWAP_POOL_ABI,
  HTTP_PROVIDER_LINK,
  GAS_STATION,
} = require("./constants.js");
const { PR_K, TOKEN_ADDRESS, AMOUNT, PERIOD, WBNB_ADDRESS } = require("./env.js");

var input_token_info;
var out_token_info;
var pool_info;
var gas_price_info;

var web3;
var pancakeRouter;
var uniswapFactory;
var USER_WALLET;

var swap_started = false;
var isBuyOrSell = true;

async function createWeb3() {
  try 
  {
    web3 = new Web3(new Web3.providers.HttpProvider(HTTP_PROVIDER_LINK));
   
    pancakeRouter = new web3.eth.Contract(
      PANCAKESWAP_ROUTER_ABI,
      PANCAKESWAP_ROUTER_ADDRESS
    );
    uniswapFactory = new web3.eth.Contract(
      PANCAKESWAP_FACTORY_ABI,
      PANCAKESWAP_FACTORY_ADDRESS
    );
    abiDecoder.addABI(PANCAKESWAP_ROUTER_ABI);

    return true;
  } 
  catch (error) {
    console.log("create web3 : ", error);
    throw error;
  }
}

async function main() {
  try {
    await createWeb3();

    try {
      USER_WALLET = web3.eth.accounts.privateKeyToAccount(PR_K);
    } catch (error) {
      console.log(
        "\x1b[31m%s\x1b[0m",
        "Your private key is invalid. Update env.js with correct PR_K"
      );
      throw error;
    }

    await prepareSwap();
    await approve(WBNB_ADDRESS, USER_WALLET);
    await approve(TOKEN_ADDRESS, USER_WALLET);

    doSwap();
  }catch(err) {
    console.log("Exception on main configurations : ", err);
  }  
}

async function doSwap(
) {
  setIntervalAsync(
		async () => 
    {
      try 
      {    
        await prepareSwap();

        if (isBuyOrSell === true) 
        {      
          console.log("Performing a swap for buy TAZOR tokens ...");

          var realInput =
            BigNumber(input_token_info.balance) > BigNumber(amount).multiply(BigNumber(10 ** input_token_info.decimals))
              ? BigNumber(amount).multiply(BigNumber(10 ** input_token_info.decimals))
              : BigNumber(input_token_info.balance);     

          var outputtoken = await pancakeRouter.methods
            .getAmountOut(
              realInput.toString(),
              pool_info.input_volumn.toString(),
              pool_info.output_volumn.toString()
            )
            .call();

          await swap(
            outputtoken,
            realInput,
            0,
            out_token_address,
            user_wallet
          );

          console.log(
            "Wait until the large volumn transaction is done...",
            transaction["hash"]
          );

          console.log("Buy succeed:");
          isBuyOrSell = false;
          return;
        }
        else {
          //Sell      
          console.log("Performing a swap for sell  TAZOR tokens ...");

          var outputeth = await pancakeRouter.methods
            .getAmountOut(
              outputtoken,
              pool_info.output_volumn.toString(),
              pool_info.input_volumn.toString()
            )
            .call();
          outputeth = outputeth * 0.999;

          await swap(
            outputtoken,
            outputeth,
            1,
            out_token_address,
            user_wallet
          );

          console.log("Sell succeed");
          succeed = true;
          swap_started = false;
          isBuyOrSell = true;
          return;
        }
      } catch (error) {
        swap_started = false;
        console.log("Exception on swap : ", error);
      }
    },
		PERIOD * 1000
	)
}

async function approve(token_address, user_wallet) {
  try {
    var allowance = await out_token_info.token_contract.methods
      .allowance(user_wallet.address, PANCAKESWAP_ROUTER_ADDRESS)
      .call();

    allowance = BigNumber(Math.floor(Number(allowance)).toString());
    amountToSpend = web3.utils.toWei((2 ** 64 - 1).toString(), "ether");

    var gasPrice = (await getCurrentGasPrices()).high;

    if (allowance - amountToSpend < 0) {
      console.log("max_allowance : ", amountToSpend.toString());
      var approveTX = {
        from: user_wallet.address,
        to: token_address,
        gas: gasLimit,
        gasPrice: gasPrice,
        data: out_token_info.token_contract.methods
          .approve(PANCAKESWAP_ROUTER_ADDRESS, amountToSpend)
          .encodeABI(),
      };

      var signedTX = await user_wallet.signTransaction(approveTX);
      var result = await web3.eth.sendSignedTransaction(
        signedTX.rawTransaction
      );

      console.log("Sucessfully approved ", token_address);
    }
  } catch (error) {
    console.log("Error on approve ", error);
    throw error;
  }
}

async function swap(
  outputtoken,
  inputtokens,
  trade,
  out_token_address,
  user_wallet
) {
  try 
  {
    let newGasPrice = gas_price_info.medium;
    let gasLimit = (300000).toString();

    // Get a wallet address from a private key
    var from = user_wallet;
    var deadline;
    var swap;

    var nonce = await web3.eth.getTransactionCount(from.address, "pending");
    nonce = web3.utils.toHex(nonce);

    //w3.eth.getBlock(w3.eth.blockNumber).timestamp
    await web3.eth.getBlock("latest", (error, block) => {
      deadline = Number(block.timestamp) + Number(1800); // transaction expires in 1800 seconds (30 minutes)
    });

    deadline = web3.utils.toHex(deadline);

    if (trade == 0) {
      //buy
      console.log(
        "Get_Amount: ".red,
        (outputtoken / 10 ** out_token_info.decimals).toFixed(6) +
          " " +
          out_token_info.symbol
      );

      swap = pancakeRouter.methods.swapExactTokensForTokens(
        inputtokens,
        "0",
        [WBNB_ADDRESS, out_token_address],
        from.address,
        deadline
      );
      var encodedABI = swap.encodeABI();
      gasLimit = await swap.estimateGas({ from: user_wallet.address });

      var tx = {
        from: from.address,
        to: PANCAKESWAP_ROUTER_ADDRESS,
        gas: gasLimit,
        gasPrice: newGasPrice,
        data: encodedABI,
        nonce: nonce,
      };
    } 
    else {
      //sell
      console.log(
        "Get_Min_Amount ".yellow,
        (inputtokens / 10 ** input_token_info.decimals).toFixed(6) +
          " " +
          input_token_info.symbol
      );

      var amountOutMin = web3.utils
        .toBN(inputtokens)
        .multiply(web3.utils.toBN((80).toString()))
        .divide(web3.utils.toBN("100"));

      swap = pancakeRouter.methods.swapExactTokensForTokens(
        outputtoken.toString(),
        "0",
        [out_token_address, WBNB_ADDRESS],
        from.address,
        deadline
      );
      var encodedABI = swap.encodeABI();
      gasLimit = await swap.estimateGas({ from: accountStr });

      var tx = {
        from: from.address,
        to: PANCAKESWAP_ROUTER_ADDRESS,
        gas: gasLimit,
        gasPrice: newGasPrice,
        data: encodedABI,
        nonce: nonce,
      };
    }

    var signedTx = await from.signTransaction(tx);

    console.log("====signed transaction=====", gasLimit, newGasPrice);
    await web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .on("transactionHash", function (hash) {
        console.log("swap : ", hash);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        if (trade == 0) {
        } else {
        }
      })
      .on("receipt", function (receipt) {         
      })
      .on("error", function (error, receipt) {
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        if (trade == 0) {
          console.log("Swap failed(buy)");
        } else {
          console.log("Swap failed(sell)");
        }
      });
  } catch (error) {
    console.log("Error on swap ");
    throw error;
  }
}

async function getCurrentGasPrices() {
  try {
    var response = await axios.get(GAS_STATION);
    var prices = {
      low: response.data.data.slow.price,
      medium: response.data.data.normal.price,
      high: response.data.data.fast.price,
    };
    if(!swap_started) console.log("\n");
    var log_str = "***** gas price information *****";
    if(!swap_started) console.log(log_str.green);
    var log_str =
      "High: " +
      prices.high +
      "        medium: " +
      prices.medium +
      "        low: " +
      prices.low;
    if(!swap_started) console.log(log_str);
    return prices;
  } catch (error) {
    throw error;
  }
}

async function getPoolInfo(in_token_address, out_token_address) {
  var log_str =
    "*****\t" +
    input_token_info.symbol +
    "-" +
    out_token_info.symbol +
    " Pair Pool Info\t*****";
  if(!swap_started) console.log(log_str.green);

  try {
    var pool_address = await uniswapFactory.methods
      .getPair(in_token_address, out_token_address)
      .call();
    if (pool_address == "0x0000000000000000000000000000000000000000") {
      log_str =
        "Uniswap has no " +
        out_token_info.symbol +
        "-" +
        input_token_info.symbol +
        " pair";
        if(!swap_started)  console.log(log_str.yellow);
      return false;
    }

    var log_str = "Address:\t" + pool_address;
    if(!swap_started) console.log(log_str.white);

    var pool_contract = new web3.eth.Contract(PANCAKESWAP_POOL_ABI, pool_address);
    var reserves = await pool_contract.methods.getReserves().call();

    var token0_address = await pool_contract.methods.token0().call();

    if (token0_address === WBNB_ADDRESS) {
      var forward = true;
      var weth_balance = reserves[0];
      var token_balance = reserves[1];
    } else {
      var forward = false;
      var weth_balance = reserves[1];
      var token_balance = reserves[0];
    }

    var log_str =
      (weth_balance / 10 ** input_token_info.decimals).toFixed(5) +
      "\t" +
      input_token_info.symbol;
    if(!swap_started) console.log(log_str.white);

    var log_str =
      (token_balance / 10 ** out_token_info.decimals).toFixed(5) +
      "\t" +
      out_token_info.symbol;
    if(!swap_started) console.log(log_str.white);

    pool_info = {
      contract: pool_contract,
      forward: forward,
      input_volumn: weth_balance,
      output_volumn: token_balance,
    };

    return true;
  } catch (error) {
    console.log("Error: Get Pair Info", error);
    throw error;
  }
}

async function getETHInfo(user_wallet) {
  try {
    var balance = await web3.eth.getBalance(user_wallet.address);
    var decimals = 18;
    var symbol = "ETH";

    return {
      address: WBNB_ADDRESS,
      balance: balance,
      symbol: symbol,
      decimals: decimals,
    };
  } catch (error) {
    console.log("get WETH balance ", error);
    throw error;
  }
}

async function getTokenInfo(tokenAddr, user_wallet) {
  try {
    var token_abi = ERC20ABI;

    //get token info
    var token_contract = new web3.eth.Contract(token_abi, tokenAddr);

    var balance = await token_contract.methods
      .balanceOf(user_wallet.address)
      .call();
    var decimals = await token_contract.methods.decimals().call();
    var symbol = await token_contract.methods.symbol().call();

    return {
      address: tokenAddr,
      balance: balance,
      symbol: symbol,
      decimals: decimals,
      token_contract,
    };
  } catch (error) {
    console.log("Failed Token Info : ", error);
    throw error;
  }
}

async function prepareSwap() {
  in_token_address = WBNB_ADDRESS;
  out_token_address = TOKEN_ADDRESS;
  user_wallet = USER_WALLET;
  amount = AMOUNT;
  period = PERIOD;

  try {
    gas_price_info = await getCurrentGasPrices();

    var log_str = "***** Your Wallet Balance *****";
    log_str = "wallet address:\t" + user_wallet.address;
    if(!swap_started) console.log(log_str.green);

    let native_info = await getETHInfo(user_wallet);
    log_str =
      "WETH balance:\t" + web3.utils.fromWei(native_info.balance, "ether");
      if(!swap_started) console.log(log_str.green);

    if (native_info.balance < 0.05 * 10 ** 18) 
    {
      console.log("INSUFFICIENT WETH BALANCE!".yellow);
      log_str =
        "Your wallet WETH balance must be more 0.02 " +
        native_info.symbol +
        "(+0.05 ETH:GasFee) ";
        if(!swap_started) console.log(log_str.red);

      return false;
    }

    input_token_info = await getTokenInfo(
      in_token_address,
      user_wallet
    );

    if (input_token_info.balance <= 0) {
      console.log("INSUFFICIENT INUT TOKEN BALANCE!".yellow);
      log_str =
        "Your input token balance must be more 0 " + input_token_info.symbol;
        if(!swap_started) console.log(log_str.red);

      return false;
    }

    //out token balance
    out_token_info = await getTokenInfo(
      out_token_address,
      user_wallet
    );
    if (out_token_info === null) {
      return false;
    }

    log_str =
      (
        Number(out_token_info.balance) /
        10 ** Number(out_token_info.decimals)
      ).toFixed(5) +
      "\t" +
      out_token_info.symbol;
    if(!swap_started) console.log(log_str.white);

    //check pool info
    if (
      (await getPoolInfo(
        input_token_info.address,
        out_token_info.address
      )) == false
    )
      return false;
   
    return true;
  } catch (error) {
    throw error;
  }
}

main();
