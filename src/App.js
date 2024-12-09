import React, { useState } from "react";
import Web3 from "web3";

const pancakeSwapAbi = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
];

const tokenAbi = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const pancakeSwapContract = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const BNBTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // BNB
const USDTokenAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT
const web3 = new Web3("https://bsc-dataseed1.binance.org");

const App = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenPrice, setTokenPrice] = useState(null);

  const setDecimals = (number, decimals) => {
    console.log(`Setting decimals for number: ${number} with decimals: ${decimals}`);
    number = number.toString();
    const numberAbs = number.split(".")[0];
    let numberDecimals = number.split(".")[1] || "";
    while (numberDecimals.length < decimals) {
      numberDecimals += "0";
    }
    const finalNumber = numberAbs + numberDecimals;
    console.log(`Number after setting decimals: ${finalNumber}`);
    return finalNumber;
  };

  const calcSell = async (tokensToSell, tokenAddress) => {
    console.log(`Calculating token price for address: ${tokenAddress} with tokens to sell: ${tokensToSell}`);
    const tokenRouter = new web3.eth.Contract(tokenAbi, tokenAddress);
    const tokenDecimals = await tokenRouter.methods.decimals().call();
    console.log(`Fetched token decimals: ${tokenDecimals}`);
    tokensToSell = setDecimals(tokensToSell, tokenDecimals);

    try {
      const router = new web3.eth.Contract(pancakeSwapAbi, pancakeSwapContract);
      console.log(`Calling PancakeSwap getAmountsOut for token to BNB price`);
      const amountOut = await router.methods
        .getAmountsOut(tokensToSell, [tokenAddress, BNBTokenAddress])
        .call();
      console.log(`Received amountOut: ${amountOut}`);
      return web3.utils.fromWei(amountOut[1], 'ether');
    } catch (error) {
      console.error("Error in calcSell:", error);
      return 0;
    }
  };

  const calcBNBPrice = async () => {
    console.log(`Calculating BNB price in USD`);
    const bnbToSell = web3.utils.toWei("1", "ether");
    

    try {
      const router = new web3.eth.Contract(pancakeSwapAbi, pancakeSwapContract);
      console.log(`Calling PancakeSwap getAmountsOut for BNB to USD price`);
      const amountOut = await router.methods
        .getAmountsOut(bnbToSell, [BNBTokenAddress, USDTokenAddress])
        .call();
      console.log(`Received BNB price in USD: ${amountOut}`);
      return web3.utils.fromWei(amountOut[1], 'ether');
    } catch (error) {
      console.error("Error in calcBNBPrice:", error);
      return 0;
    }
  };

  const fetchTokenPrice = async () => {
    console.log(`Starting token price fetch for address: ${tokenAddress}`);
    if (!web3.utils.isAddress(tokenAddress)) {
      alert("Invalid token address");
      console.error("Invalid token address entered");
      return;
    }

    const bnbPrice = await calcBNBPrice();
    console.log(`BNB Price in USD: ${bnbPrice}`);
    const tokensToSell = 1;
    const priceInBnb = await calcSell(tokensToSell, tokenAddress) / tokensToSell;
    console.log(`Token price in BNB: ${priceInBnb}`);
    const priceInUSD = (priceInBnb * bnbPrice).toFixed(8);
    console.log(`Token price in USD: ${priceInUSD}`);
    setTokenPrice(priceInUSD);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>BSC Token Price Checker</h1>
      <input
        type="text"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        placeholder="Enter BSC Token Address"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          fontSize: "16px",
        }}
      />
      <button
        onClick={fetchTokenPrice}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Fetch Price
      </button>
      {tokenPrice && (
        <h2 style={{ marginTop: "20px" }}>
          Token Price in USD: ${tokenPrice}
        </h2>
      )}
    </div>
  );
};

export default App;