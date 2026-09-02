// Quick test: spawn MCP server, send initialize + tools/call, check response.
import { spawn } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";

const key = process.env.SPECCY_MCP_WALLET_KEY;
if (!key) { console.error("set SPECCY_MCP_WALLET_KEY first"); process.exit(1); }

const transport = new StdioClientTransport({ command: "node", args: ["index.js"], env: { ...process.env, SPECCY_MCP_WALLET_KEY: key } });
const client = new Client({ name: "test-client", version: "0.1.0" }, { capabilities: {} });
await client.connect(transport);

const { tools } = await client.listTools();
console.log("tools:", tools.map(t => t.name));

const r1 = await client.callTool({ name: "get_prediction_markets", arguments: { limit: 2 } });
const d1 = JSON.parse(r1.content[0].text);
console.log("markets count:", d1.count, "| top:", d1.markets?.[0]?.question?.slice(0, 50));

const r2 = await client.callTool({ name: "exec_python", arguments: { code: "print(7*6)" } });
const d2 = JSON.parse(r2.content[0].text);
console.log("exec stdout:", d2.result?.stdout?.trim());

const r5 = await client.callTool({ name: "tts_synthesize", arguments: { text: "Hallo, dit is een test.", voice: "M1", lang: "nl" } });
const d5raw = r5.content[0].text;
try { const d5 = JSON.parse(d5raw); console.log("tts tier:", d5.tier, "| size:", d5.result?.size, "bytes | duration:", d5.result?.durationMs, "ms"); } catch { console.log("tts (network may be unavailable in this sandbox):", d5raw.slice(0,120)); }

await client.close();
console.log("OK");
