// Edge Function: issue-anon-jwt
// Returns JWT + anon_user_id for quiz flow. RLS ใช้ auth.jwt() ->> 'anon_user_id' ได้ต้องเซ็นด้วย Project JWT Secret.
// Env: SECRET_KEY หรือ ANON_JWT_SECRET (ตั้งเป็น Dashboard → API → JWT Secret), TOKEN_TTL_SECONDS

function base64UrlEncode(buf: Uint8Array): string {
  const s = btoa(String.fromCharCode(...buf));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function utf8ToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function signHS256(message: string, secret: string): Promise<Uint8Array> {
  const keyData = utf8ToUint8Array(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, utf8ToUint8Array(message));
  return new Uint8Array(sig);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function generateAnonId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 60;
const rateMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = nowSeconds();
  const state = rateMap.get(key);
  if (!state || now >= state.windowStart + RATE_LIMIT_WINDOW) {
    rateMap.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (state.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, retryAfter: state.windowStart + RATE_LIMIT_WINDOW - now };
  }
  state.count += 1;
  rateMap.set(key, state);
  return { allowed: true, remaining: RATE_LIMIT_MAX - state.count };
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retry_after: rl.retryAfter }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    let body: { requested_anon_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const anon_user_id = body.requested_anon_id?.trim() || generateAnonId();

    const secret =
      Deno.env.get("SECRET_KEY") ??
      Deno.env.get("ANON_JWT_SECRET") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secret) {
      console.error("Missing SECRET_KEY, ANON_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ttl = Number(Deno.env.get("TOKEN_TTL_SECONDS") ?? 60 * 60 * 24);
    const iat = nowSeconds();
    const exp = iat + ttl;

    const header = { alg: "HS256", typ: "JWT" };
    const payload: Record<string, unknown> = {
      sub: anon_user_id,
      role: "authenticated",
      anon_user_id,
      iat,
      exp,
    };

    const headerB64 = base64UrlEncode(utf8ToUint8Array(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(utf8ToUint8Array(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;
    const sig = await signHS256(signingInput, secret);
    const sigB64 = base64UrlEncode(sig);
    const jwt = `${signingInput}.${sigB64}`;

    const responseMode = Deno.env.get("ANON_TOKEN_RESPONSE") ?? "json";
    if (responseMode === "cookie") {
      const cookieParts = [
        "anon_jwt=" + jwt,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=" + ttl,
      ];
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Set-Cookie": cookieParts.join("; ") },
      });
    }

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(
      JSON.stringify({ token: jwt, anon_user_id, expires_at: exp }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("Unexpected error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
