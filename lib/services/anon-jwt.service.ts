/**
 * Anon JWT from Edge Function. Default: issue-anon-jwt.
 * Replaces client-generated anon ID with server-issued JWT for quiz flow.
 * Optional: NEXT_PUBLIC_SUPABASE_ANON_TOKEN_FUNCTION=anon-token if you deploy as anon-token.
 */

export interface AnonJwtResult {
	token: string;
	anon_user_id: string;
	/** Unix timestamp (seconds) or ISO string from Edge Function */
	expires_at?: number | string;
}

const DEFAULT_FUNCTION_NAME = "issue-anon-jwt";
const CACHE_KEY = "anon_jwt_cache";

type CacheEntry = AnonJwtResult & { expiresAt?: number };

let memoryCache: CacheEntry | null = null;

function getEdgeFunctionUrl(): string {
	const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for anon JWT");
	const name = process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN_FUNCTION ?? DEFAULT_FUNCTION_NAME;
	return `${base.replace(/\/$/, "")}/functions/v2/${name}`;
}

/** Decode JWT payload to get sub (anon_user_id) when Edge Function doesn't return it. */
function decodeSubFromJwt(token: string): string | null {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		const decoded = JSON.parse(atob(payload)) as { sub?: string };
		return decoded.sub ?? null;
	} catch {
		return null;
	}
}

/**
 * Request anon JWT from Edge Function. Caches result in memory (and optionally localStorage).
 * Call once at quiz start; subsequent calls return cached value until expiry.
 */
export async function getAnonToken(): Promise<AnonJwtResult> {
	if (typeof window === "undefined") {
		throw new Error("getAnonToken must be called on the client");
	}

	// Prefer memory cache
	if (memoryCache?.token) {
		const expiresAt = memoryCache.expiresAt;
		if (!expiresAt || Date.now() < expiresAt - 60_000) {
			return {
				token: memoryCache.token,
				anon_user_id: memoryCache.anon_user_id,
				expires_at: memoryCache.expires_at,
			};
		}
	}

	const url = getEdgeFunctionUrl();
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`issue-anon-jwt failed: ${res.status} ${text}`);
	}

	const data = (await res.json()) as {
		token?: string;
		anon_user_id?: string;
		/** Unix timestamp (seconds) or ISO string */
		expires_at?: number | string;
	};

	if (!data.token) {
		throw new Error("issue-anon-jwt: no token in response");
	}

	const anon_user_id =
		data.anon_user_id ?? decodeSubFromJwt(data.token) ?? `user_anon_${Date.now()}`;
	const expiresAt =
		data.expires_at == null
			? undefined
			: typeof data.expires_at === "number"
				? data.expires_at * 1000
				: new Date(data.expires_at).getTime();

	const entry: CacheEntry = {
		token: data.token,
		anon_user_id,
		expires_at: data.expires_at,
		expiresAt,
	};
	memoryCache = entry;

	// Optional: persist for refresh (same tab only; avoid cross-tab issues)
	try {
		sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
	} catch {
		// ignore
	}

	return {
		token: entry.token,
		anon_user_id: entry.anon_user_id,
		expires_at: entry.expires_at,
	};
}

/**
 * Restore cached anon JWT from sessionStorage (e.g. after refresh).
 * Returns null if no valid cache. Call getAnonToken() to fetch new one.
 */
export function getCachedAnonToken(): AnonJwtResult | null {
	if (typeof window === "undefined") return null;

	if (memoryCache?.token) {
		return {
			token: memoryCache.token,
			anon_user_id: memoryCache.anon_user_id,
			expires_at: memoryCache.expires_at,
		};
	}

	try {
		const raw = sessionStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const entry = JSON.parse(raw) as CacheEntry;
		if (!entry.token || !entry.anon_user_id) return null;
		const expired = entry.expiresAt != null && Date.now() >= entry.expiresAt - 60_000;
		if (expired) {
			sessionStorage.removeItem(CACHE_KEY);
			return null;
		}
		memoryCache = entry;
		return {
			token: entry.token,
			anon_user_id: entry.anon_user_id,
			expires_at: entry.expires_at,
		};
	} catch {
		return null;
	}
}

/** Clear cached anon JWT (e.g. for testing or logout). */
export function clearAnonToken(): void {
	memoryCache = null;
	try {
		sessionStorage.removeItem(CACHE_KEY);
	} catch {
		// ignore
	}
}
