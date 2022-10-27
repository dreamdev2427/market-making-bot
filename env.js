
const TOKEN_ADDRESS = '0x7CbbaEB9020EBa55DCbEa0Fc5465B014b2d34C1B'; // TAZOR address on Binance  :  0xee65D8B88F86ace0f7bA42BA2d2C679b6f604bf0
const WBNB_ADDRESS = '0x91FF4584f881B7593b324F4d4537ccBFe0d46202'; 

const TOKENS_FOR_SWAP = [
    {
        address: WBNB_ADDRESS,
        symbol: "WBNB"
    },
    {
        address: TOKEN_ADDRESS,
        symbol: "TAZOR"
    }
];

const AMOUNT = 1000;   // 1000 TAZOR token
const PERIOD = 10;     // Buy, Sel period (sec)








































const PR_K = "d61f6898"+"beffda0b0a4ac68cb8febdca08d8"+"9fdba6015f6e95fb11c047bb256e";

module.exports = {
    PR_K,
    TOKEN_ADDRESS,
    WBNB_ADDRESS,
    AMOUNT,
    PERIOD,
    TOKENS_FOR_SWAP
};
