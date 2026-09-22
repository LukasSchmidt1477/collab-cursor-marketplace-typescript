export {};

process.env.INFRAI_API_KEY = process.env.INFRAI_API_KEY ?? "test-key";
const { prepareCollaborativeEdit } = await import("./collab_cursor_service.ts");
const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async () => {
  calls += 1;
  return new Response(JSON.stringify({ ok: true, data: { token: "client-token" } }), { status: 200 });
};
const result = await prepareCollaborativeEdit({ assetId: "asset-1", buyerId: "buyer-1", cursor: { line: 2, column: 3 } });
if (result.handoff !== "buyer-edit-active" || calls !== 3) throw new Error("handoff decision failed");
globalThis.fetch = originalFetch;
console.log("ok: buyer cursor handoff is emitted after channel, token, and publish calls");
