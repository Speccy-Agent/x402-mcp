#!/usr/bin/env node
// @speccy/x402-mcp — MCP server wrapping Speccy's paid x402 endpoints.
// Agents call tools, this server pays per call in USDC on Base via x402.
// Uses one operator wallet (set via SPECCY_MCP_WALLET_KEY) to settle payments.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

const API_BASE = process.env.SPECCY_MCP_API_BASE || "https://api.speccy.cloud";
const EXEC_BASE = process.env.SPECCY_MCP_EXEC_BASE || "https://exec.speccy.cloud";
const NETWORK = "eip155:8453";
const PAYER_KEY = process.env.SPECCY_MCP_WALLET_KEY;

if (!PAYER_KEY) {
  process.stderr.write("SPECCY_MCP_WALLET_KEY env required (operator's x402 payer private key, 0x-prefixed hex)\n");
  process.exit(1);
}

// Shared x402 client + paid fetch
const account = privateKeyToAccount(PAYER_KEY);
const client = new x402Client().register(NETWORK, new ExactEvmScheme(account));
const paidFetch = wrapFetchWithPayment(fetch, client);

const server = new McpServer({
  name: "speccy-x402",
  version: "0.1.0",
});

server.tool(
  "get_prediction_markets",
  "Get top Polymarket prediction markets. Costs $0.01 USDC per call (x402 settled in background).",
  {
    limit: z.number().int().min(1).max(50).default(20).describe("Number of markets (1-50)"),
    sort: z.enum(["volume", "liquidity", "startDate"]).default("volume").describe("Sort field"),
  },
  async ({ limit, sort }) => {
    try {
      const res = await paidFetch(`${API_BASE}/v1/predictions/polymarket?limit=${limit}&sort=${sort}`);
      if (!res.ok) return { content: [{ type: "text", text: `Error ${res.status}: ${await res.text()}` }], isError: true };
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Tool error: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "exec_python",
  "Run Python code in an isolated Docker sandbox. Costs $0.02 USDC per execution. No network, read-only filesystem, 30s timeout, 64KB output cap.",
  {
    code: z.string().max(65536).describe("Python source code to execute"),
  },
  async ({ code }) => {
    try {
      const res = await paidFetch(`${EXEC_BASE}/v1/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "python", code }),
      });
      if (!res.ok) return { content: [{ type: "text", text: `Error ${res.status}: ${await res.text()}` }], isError: true };
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Tool error: ${e.message}` }], isError: true };
    }
  }
);

// Graceful shutdown
process.on("SIGTERM", async () => { await server.close(); process.exit(0); });
process.on("SIGINT", async () => { await server.close(); process.exit(0); });

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(`[speccy-x402-mcp] connected via stdio (network=${NETWORK})\n`);
