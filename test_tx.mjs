import { RpcProvider, hash, CallData } from 'starknet';
import fs from 'fs';

const abi = JSON.parse(fs.readFileSync('app/lib/vesu_vault_abi.json', 'utf8'));
const callData = new CallData(abi);

const VAULT_ADDRESS = "0x024644fe658c37453af830257038271915c657191a151d1a3ff511221e061647";

async function run() {
    const args = {
      proof: ["1"],
      public_inputs: {
        merkle_root: "0x2ce70b20f2facf9439aef64f50a83c8281ca35496614e1a47bbbfc08902d9c5",
        borrow_amount: "1000000",
        btc_price: "65000000000",
        usdc_price: "1000000",
        min_health_factor: "110",
        nullifier: "0x42f70b20f2facf9439aef64f50a83c8281ca35000000000000000000000000"
      },
      recipient: "0x0606fe85cf75eb8cd5aa4bc640f09a9aff0bd03b1de09277fbc265bf8d58c82a"
    };

    const calldata = callData.compile("borrow", args).map(v => {
        if (typeof v === 'string' && v.startsWith('0x')) return v;
        return "0x" + BigInt(v).toString(16);
    });
    console.log("Hex Calldata:", calldata);

    try {
      const response = await fetch("https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/cf52O0RwFy1mEB0uoYsel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [{
            contract_address: VAULT_ADDRESS,
            entry_point_selector: hash.getSelectorFromName("borrow"),
            calldata: calldata
          }, "latest"],
          id: 1
        })
      });
      const data = await response.json();
      console.log("Response:", JSON.stringify(data, null, 2));
    } catch(e) {
      console.log("Error:", e.message);
    }
}
run();
