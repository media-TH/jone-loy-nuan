// Edge Function: issue-anon-jwt
// Returns JWT + anon_user_id for quiz flow. RLS ใช้ auth.jwt() ->> 'anon_user_id' ได้ต้องเซ็นด้วย Project JWT Secret.
// Env: SECRET_KEY หรือ ANON_JWT_SECRET (ตั้งเป็น Dashboard → API → JWT Secret), TOKEN_TTL_SECONDS
//
// The anonymous id is ALWAYS generated here. A token proves "I am this id" to RLS and to the PDPA
// erase / withdraw actions, so it must never be issued for an id the caller names (ADR-005).

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

const DEFAULT_TTL_SECONDS = 60 * 60 * 24;
const MIN_TTL_SECONDS = 5 * 60;
const MAX_TTL_SECONDS = 60 * 60 * 24;

/** TOKEN_TTL_SECONDS clamped to 5 min–24 h; unset or not a number = 24 h (never a token without exp). */
function tokenTtlSeconds(raw: string | undefined): number {
  const parsed = raw === undefined ? NaN : Math.floor(Number(raw));
  if (!Number.isFinite(parsed)) return DEFAULT_TTL_SECONDS;
  return Math.min(MAX_TTL_SECONDS, Math.max(MIN_TTL_SECONDS, parsed));
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

    // The request body is ignored on purpose: nothing the caller sends can choose the id.
    const anon_user_id = generateAnonId();

    // Only the project's JWT secret makes tokens PostgREST accepts. The service-role key is an API
    // key, not a signing secret, so it is deliberately not a fallback.
    const secret = Deno.env.get("SECRET_KEY") ?? Deno.env.get("ANON_JWT_SECRET");
    if (!secret) {
      console.error("Missing SECRET_KEY or ANON_JWT_SECRET (the project JWT secret)");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ttl = tokenTtlSeconds(Deno.env.get("TOKEN_TTL_SECONDS"));
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
