import { $ } from "bun";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPoseidon } from "circomlibjs";

let poseidon: any = null;
const apiDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(apiDir, "..");
const circuitDir = path.join(repoRoot, "zk-badges", "donation_badge");

async function getPoseidon() {
  if (!poseidon) {
    poseidon = await buildPoseidon();
  }
  return poseidon;
}

const port = Number(process.env.PORT || 3001);
const decoder = new TextDecoder();

function ensureToolingPath() {
  const home = process.env.HOME || "";
  const toolingPaths = [
    `${home}/.nargo/bin`,
    `${home}/.bb`,
    `${home}/.bun/bin`,
  ].filter(Boolean);

  const currentPath = process.env.PATH || "";
  const hasAll = toolingPaths.every((p) => currentPath.split(":").includes(p));
  if (!hasAll) {
    process.env.PATH = [...toolingPaths, currentPath].filter(Boolean).join(":");
  }
}

ensureToolingPath();

function decodeOutput(output?: Uint8Array | string | null): string {
  if (!output) return "";
  if (typeof output === "string") return output;
  return decoder.decode(output);
}

async function runCmd(label: string, cmd: string): Promise<string> {
  const runtimePath = (process.env.PATH || "").replace(/"/g, '\\"');
  const shellCmd = `export PATH="${runtimePath}" && cd "${circuitDir}" && ${cmd}`;
  const proc = await $`bash -lc ${shellCmd}`.nothrow();
  const stdout = decodeOutput(proc.stdout);
  const stderr = decodeOutput(proc.stderr);

  if (proc.exitCode !== 0) {
    console.error(`[${label}] failed (exit ${proc.exitCode})`);
    if (stdout.trim()) console.error(`[${label}] stdout:\n${stdout}`);
    if (stderr.trim()) console.error(`[${label}] stderr:\n${stderr}`);
    throw new Error(`${label} failed (exit ${proc.exitCode}). Check server logs for details.`);
  }

  return stdout;
}

const server = Bun.serve({
  port,
  async fetch(req) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (req.method === "POST" && req.url.includes("/api/generate-proof")) {
      try {
        const body = await req.json();
        const { donationamount, threshold, donorsecret, badgetier } = body;
        console.log("Generating proof for:", { donationamount, threshold, badgetier });

        const p = await getPoseidon();
        const hash = p([BigInt(donorsecret), BigInt(donationamount)]);
        const commitment = p.F.toString(hash);
        console.log("Computed commitment:", commitment);

        const proverToml = `donation_amount = ${donationamount}
donor_secret = ${donorsecret}
threshold = ${threshold}
badge_tier = ${badgetier}
donation_commitment = "${commitment}"
`;
        writeFileSync(path.join(circuitDir, "Prover.toml"), proverToml);

        console.log("Running nargo execute...");
        await runCmd("nargo execute", "nargo execute witness");
        console.log("Running bb prove...");
        await runCmd(
          "bb prove",
          "bb prove_ultra_keccak_honk -b ./target/donation_badge.json -w ./target/witness.gz -o ./target/proof",
        );
        console.log("Running bb write_vk...");
        await runCmd(
          "bb write_vk",
          "bb write_vk_ultra_keccak_honk -b ./target/donation_badge.json -o ./target/vk",
        );
        console.log("Running garaga calldata...");
        const result = await runCmd(
          "garaga calldata",
          "garaga calldata --system ultra_keccak_honk --vk ./target/vk --proof ./target/proof --format array",
        );

        console.log("Proof generated successfully!");
        return new Response(JSON.stringify({ calldata: result.trim(), commitment, success: true }), { headers });
      } catch (error: any) {
        console.error("Error:", error.message || error);
        return new Response(JSON.stringify({ error: error.message || String(error), success: false }), { headers, status: 500 });
      }
    }
    return new Response(JSON.stringify({ error: "Not found" }), { headers, status: 404 });
  },
});

console.log("Proof API running on http://localhost:" + server.port);
