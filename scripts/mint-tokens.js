"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var starknet_1 = require("starknet");
// Configuration
var RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/cf52O0RwFy1mEB0uoYsel";
var WBTC_ADDRESS = "0x07d0fc03b7853f9dad8bb8a5bcac9ad8716c464428298f3770c909a11520061c";
var USDC_ADDRESS = "0x017947ec3c751a4aacca5b86aba3d809902455fcc0008e3b1433e69ea60851a4";
var DEPLOYER_ADDRESS = "0x00731f307c7d91b94d88bfea5c43efabafbd71bbedfaabf3ba13aac012745b9f";
// ERC20 ABI (minimal for minting)
var ERC20_ABI = [
    "fn mint(to: core::starknet::contract_address::ContractAddress, amount: u256) -> bool",
    "fn balance_of(account: core::starknet::contract_address::ContractAddress) -> u256"
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var recipient, provider, wbtc, usdc;
        return __generator(this, function (_a) {
            recipient = process.argv[2];
            if (!recipient) {
                console.log("Usage: npx tsx scripts/mint-tokens.ts <RECIPIENT_ADDRESS>");
                console.log("Example: npx tsx scripts/mint-tokens.ts 0x123...");
                process.exit(1);
            }
            console.log("Recipient:", recipient);
            provider = new starknet_1.RpcProvider({ nodeUrl: RPC_URL });
            // Get deployer account (needs private key in .env)
            // For now, we'll use the already deployed account
            console.log("\nMinting tokens to:", recipient);
            wbtc = new starknet_1.Contract(ERC20_ABI, WBTC_ADDRESS, provider);
            try {
                console.log("\nMinting 1 WBTC...");
                // Note: This will fail if the deployer key is not available
                // In production, you'd use the deployer account
                console.log("WBTC mint call prepared for:", WBTC_ADDRESS);
                console.log("Recipient will receive: 1 WBTC (100000000 in smallest units)");
            }
            catch (e) {
                console.error("Error:", e);
            }
            usdc = new starknet_1.Contract(ERC20_ABI, USDC_ADDRESS, provider);
            try {
                console.log("\nMinting 50000 USDC...");
                console.log("USDC mint call prepared for:", USDC_ADDRESS);
                console.log("Recipient will receive: 50000 USDC (50000000000 in smallest units)");
            }
            catch (e) {
                console.error("Error:", e);
            }
            console.log("\n⚠️  To actually mint, you need to invoke the mint function from the deployer wallet.");
            console.log("   Or deploy a new ERC20 with yourself as owner.");
            return [2 /*return*/];
        });
    });
}
main();
