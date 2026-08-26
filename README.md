# @speccy/x402-mcp

MCP server wrapping **Speccy's paid x402 endpoints**. Give any MCP-compatible AI agent two superpower tools — prediction-market data and a sandboxed Python executor — and the server pays per call in USDC on Base on your behalf.

No x402 knowledge required by the agent. No wallet setup on the agent side. Just install the server, point your agent at it, done.

## Tools

| Tool | Description | Cost per call |
|---|---|---|
| `get_prediction_markets` | Top Polymarket prediction markets (volume, liquidity, or startDate sort) | $0.01 USDC |
| `exec_python` | Run Python 3.12 code in an isolated Docker sandbox (no network, read-only FS, 30s timeout, 64KB output) | $0.02 USDC |
| `transform_media` | Run FFmpeg on a video/audio file (3 tiers: copy $0.005, transform $0.05, heavy $0.20) | $0.005–$0.20 USDC |
| `web_search` | Real-time web search + extract via Tavily (3 modes: search $0.005, extract $0.02, smart search+extract $0.05) | $0.005–$0.05 USDC |

## Install

```bash
npm install -g @speccy/x402-mcp
```

## Configure

Set the operator wallet key (the wallet that pays x402 per call):

```bash
export SPECCY_MCP_WALLET_KEY="0x..."   # operator wallet private key
```

Optional overrides:
- `SPECCY_MCP_API_BASE` (default `https://api.speccy.cloud`) — Polymarket endpoint
- `SPECCY_MCP_EXEC_BASE` (default `https://exec.speccy.cloud`) — sandbox exec endpoint

## Wire into an MCP-compatible agent

### Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "speccy-x402": {
      "command": "speccy-x402-mcp",
      "env": { "SPECCY_MCP_WALLET_KEY": "0x..." }
    }
  }
}
```

### Any MCP client (stdio):

```bash
SPECCY_MCP_WALLET_KEY=0x... speccy-x402-mcp
```

## Architecture

```
[Agent] → MCP tool call (stdio) → [this server] → x402 paid fetch → [Speccy endpoint on VPS]
                                                                → [CDP facilitator] → on-chain USDC transfer
```

The server holds one operator wallet. Each call triggers an x402 payment from that wallet. Settlement alerts go to the operator's Telegram via the Notifier bot (same backend as the HTTP endpoints).

## Notes

- The wallet key never leaves the operator's machine (env var, not a config file).
- Fund the wallet with USDC on Base mainnet (`eip155:8453`) and a tiny amount of ETH for margin (only used if the wallet ever does non-x402 transfers).
- Currently settles on Base mainnet only. Testnet / other chains would need an `X402_NETWORK` env and a matching facilitator.
- Each call is independent and stateless — no sessions, no state on the server.

## Source / issues

- Source: github.com/speccy-ai/x402-mcp (placeholder)
- Issues / feature requests: open an issue on the repo, or message @SpeccyNotifierbot on Telegram

## License

MIT — by Philip (Esla) for Speccy.
