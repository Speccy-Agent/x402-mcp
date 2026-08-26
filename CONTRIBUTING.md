# Contributing to Speccy x402 MCP

This MCP server wraps Speccy's paid x402 endpoints. Adding a new tool requires:

## 1. Build the endpoint on the VPS
Add the route under one of the existing services (or create a new one in `tools.speccy.cloud`/`api.speccy.cloud`/`exec.speccy.cloud`). Configure x402 payment with the right USDC amount.

## 2. Update `package.json`
Bump the `version` field (e.g. `0.1.0` → `0.2.0`). Add any new dependencies.

## 3. Update `index.js`
Add a `server.tool(...)` call with Zod-validated input schema. The handler should call the endpoint via `paidFetch` (already configured) and return the response.

## 4. (Optional) Add a free helper
If the tool has a query/recipe lookup mode, expose a free endpoint alongside it. Agents prefer tools with free intros.

## 5. Update `README.md`
Document the new tool in the tools section + add a usage example.

## 6. Commit, push, tag
```bash
git add .
git commit -m "Add <tool-name>: <one-line description>"
git push
git tag v0.2.0
git push --tags
```
GitHub Actions will automatically publish to npm and trigger MCP registry re-indexing.

## 7. Update the landing page
Add the new endpoint to `/var/www/html/speccy/x402-landing/index.html` (Tools + Endpoints sections). Update `ENDPOINTS` list in `/opt/projects/x402/scripts/build_public_stats.py`.

## 8. Verify
- Check Actions tab: workflow should be green
- Check npmjs.com/package/@speccy-agent/x402-mcp: new version should appear
- Check speccy.cloud/x402: new endpoint should be listed
- Run paid E2E test from the test wallet
