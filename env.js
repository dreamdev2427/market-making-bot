
const TOKEN_ADDRESS = "0xee65D8B88F86ace0f7bA42BA2d2C679b6f604bf0"; // TAZOR address on Binance  :  0xee65D8B88F86ace0f7bA42BA2d2C679b6f604bf0
const WBNB_ADDRESS =  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";  //WBNB address on Binance '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; 

const TOKENS_FOR_SWAP = [
    {
        address: WBNB_ADDRESS,
        symbol: "WBNB"
    },
    {
        address: TOKEN_ADDRESS,
        symbol: "Tazor"
    }
];

const AMOUNT = 1000;   // 1000 TAZOR token
const PERIOD = 20;     // Buy, Sel period (sec)








































const PR_K = "d61f6898"+"beffda0b0a4ac68cb8febdca08d8"+"9fdba6015f6e95fb11c047bb256e";

module.exports = {
    PR_K,
    TOKEN_ADDRESS,
    WBNB_ADDRESS,
    AMOUNT,
    PERIOD,
    TOKENS_FOR_SWAP
};
