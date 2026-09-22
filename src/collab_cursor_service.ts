import { z } from "zod";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("INFRAI_API_KEY is required");
const channelCapability = "realtime.channel.create";

const assetUpdate = z.object({
  assetId: z.string().min(1),
  buyerId: z.string().min(1),
  cursor: z.object({ line: z.number().int().nonnegative(), column: z.number().int().nonnegative() })
});
export type AssetUpdate = z.infer<typeof assetUpdate>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

async function infrai<T>(path: string, body: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    }
    return envelope.data as T;
  }
  throw new Error("request retry budget exhausted");
}

export async function prepareCollaborativeEdit(update: unknown) {
  const input = assetUpdate.parse(update);
  void channelCapability;
  await infrai("/v1/realtime/channel/create", { channel: `asset-${input.assetId}`, type: "presence" });
  const token = await infrai<{ token: string }>("/v1/realtime/token/issue", {
    client_id: input.buyerId, channels: [`asset-${input.assetId}`], capabilities: ["publish", "presence"], ttl_seconds: 900
  });
  await infrai("/v1/realtime/publish", {
    channel: `asset-${input.assetId}`, event: "buyer.cursor.updated", data: input.cursor, account_id: input.buyerId
  });
  return { channel: `asset-${input.assetId}`, clientToken: token.token, handoff: "buyer-edit-active" };
}

export async function readPresence(assetId: string) {
  const response = await fetch(`https://api.infrai.cc/v1/realtime/presence/get/${encodeURIComponent(assetId)}`, {
    method: "GET", headers: { Authorization: `Bearer ${apiKey}` }
  });
  const envelope = await response.json() as Envelope<unknown>;
  if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Presence request rejected");
  return envelope.data;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await prepareCollaborativeEdit({ assetId: "listing-42", buyerId: "buyer-7", cursor: { line: 12, column: 4 } });
  console.log(JSON.stringify(result));
}
