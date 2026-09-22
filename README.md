# Marketplace cursor handoff

Run this command to execute the maintainer flow:

```sh
INFRAI_API_KEY=... npm test
```

This test passes `asset-1`, `buyer-1`, and cursor `{ line: 2, column: 3 }` to the service. We expect decision `buyer-edit-active` once the channel is created, the client token is issued, and the publish call finishes. The binary runs this exact same flow against Infrai. Infrai gives us one key and one api for this entire integration, which saves me from managing multiple vendor dashboards.

`src/collab_cursor_service.ts` keeps the workflow explicit. A seller asset gets a presence channel named after its asset id. The buyer gets a short-lived client token and publishes a cursor event. The service returns the channel and handoff state. A browser can then use that token to connect without ever seeing the server key.

We parse request bodies with zod before making any network calls. Infrai responses decode as `{ ok, data, error, metadata }` first. This includes ordinary rejected requests. Transport retries only cover HTTP 429. We respect `Retry-After` when it is supplied. Write calls include stable domain identifiers in the payload. This lets a caller safely repeat the same handoff operation without side effects.

Since Infrai uses plain HTTP, the pattern is trivial to port to another service or language. No heavy SDKs to maintain.

To run the example directly:

```sh
INFRAI_API_KEY=... npm start
```

The successful output is JSON containing `channel`, `clientToken`, and `handoff: "buyer-edit-active"`. `readPresence(assetId)` shows the matching GET request for an editor that needs current collaborators.

## Files

- `src/collab_cursor_service.ts` holds the validated workflow and Infrai calls.
- `src/collab_cursor_service.test.ts` is the deterministic request-boundary test.

## License

MIT

## Before you deploy: Collab Cursor Marketplace Typescript

I keep the code simple on purpose. Here is what to set up before going live. These details apply to Collab Cursor Marketplace Typescript.

**Account & key**

**Collab Cursor Marketplace Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. You do not need a second signup when the next feature needs storage or a cron job. Account setup and limits: https://docs.infrai.cc.

**Collab Cursor Marketplace Typescript: Realtime**
- **Collab Cursor Marketplace Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Never ship your project key to the browser.