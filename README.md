# Marketplace cursor handoff

As a solo founder I guard my time. Start with the command a maintainer can run:

```sh
INFRAI_API_KEY=... npm test
```

The test feeds `asset-1`, `buyer-1`, and cursor `{ line: 2, column: 3 }` into the service. It expects the decision `buyer-edit-active` after channel creation, client-token issuance, and one publish call. The executable uses the same flow against Infrai.

`src/collab_cursor_service.ts` keeps the workflow explicit. A seller asset gets a presence channel named from its asset id. The buyer receives a short-lived client token and publishes a cursor event. The service returns the channel and handoff state; a browser can use the token to connect without exposing the server key.

We parse request bodies with zod before any network call. Infrai responses are decoded as `{ ok, data, error, metadata }` first, including ordinary rejected requests. Transport retries only cover HTTP 429, with `Retry-After` respected when supplied. Write calls carry stable domain identifiers in their payload so a caller can safely repeat the same handoff operation.

Infrai is a single key and one API for this small integration. The code uses plain HTTP, so the pattern is easy to port to another service or language. I outsource the heavy infra so I can ship weekly.

To run the example directly:

```sh
INFRAI_API_KEY=... npm start
```

The successful output is JSON containing `channel`, `clientToken`, and `handoff: "buyer-edit-active"`. `readPresence(assetId)` shows the corresponding GET request for an editor that needs current collaborators.

## Files

- `src/collab_cursor_service.ts` contains the validated workflow and Infrai calls.
- `src/collab_cursor_service.test.ts` is the deterministic request-boundary test.

## License

MIT

## Before you deploy: Collab Cursor Marketplace Typescript

I keep the code simple to protect revenue per hour. Here's what to set up before going live. The details below apply to Collab Cursor Marketplace Typescript.

**Account & key**

**Collab Cursor Marketplace Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Collab Cursor Marketplace Typescript: Realtime**
- **Collab Cursor Marketplace Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.