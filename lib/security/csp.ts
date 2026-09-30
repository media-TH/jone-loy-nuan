/**
 * Content-Security-Policy + security response headers for every route.
 *
 * Pure (no Node or Next imports) so next.config.ts can load it and Jest can test it.
 * Next injects inline bootstrap scripts without a nonce, so script-src keeps 'unsafe-inline';
 * the policy still blocks third-party script hosts, framing, plugins, <base> hijacking and
 * cross-origin form posts.
 */

export interface SecurityHeaderOptions {
	/**
	 * `next dev`: allow what React dev tooling and HMR need ('unsafe-eval', ws:), and drop the rules
	 * that break plain-http LAN previews or editor preview panels (HSTS, upgrade-insecure-requests,
	 * frame-ancestors / X-Frame-Options). Production always gets the strict set.
	 */
	isDev?: boolean;
	/** @vercel/analytics or @vercel/speed-insights is used (their debug / fallback scripts load from va.vercel-scripts.com). */
	vercelAnalytics?: boolean;
	/** Vercel preview deployments inject the Vercel Toolbar (vercel.live) for comments and feedback. */
	vercelToolbar?: boolean;
	/** NEXT_PUBLIC_SUPABASE_URL; added explicitly when it is not on *.supabase.co (custom domain, local stack). */
	supabaseUrl?: string;
	/** Extra origins allowed in img-src, e.g. "https://images.ctfassets.net" for Contentful assets. */
	extraImgSrc?: readonly string[];
}

export interface SecurityHeader {
	key: string;
	value: string;
}

const SUPABASE_HTTP = "https://*.supabase.co";
const SUPABASE_WS = "wss://*.supabase.co";
const VERCEL_SCRIPTS = "https://va.vercel-scripts.com";
const VERCEL_VITALS = "https://vitals.vercel-insights.com";
/** Hosts the Vercel Toolbar needs (https://vercel.com/docs/vercel-toolbar/managing-toolbar#using-a-content-security-policy). */
const VERCEL_LIVE = "https://vercel.live";
const VERCEL_LIVE_PUSHER = "wss://ws-us3.pusher.com";

/** Two years, the minimum the HSTS preload list accepts. */
const HSTS_MAX_AGE_SECONDS = 63_072_000;

/**
 * Normalise a configured origin: http(s) only, no path, no wildcard. Returns null for anything else
 * so a malformed env var can never inject extra directives (e.g. a value containing ";").
 */
export function toCspOrigin(value: string | undefined): string | null {
	if (!value) return null;
	try {
		const url = new URL(value.trim());
		if (url.protocol !== "https:" && url.protocol !== "http:") return null;
		return url.origin;
	} catch {
		return null;
	}
}

function isCoveredBySupabaseWildcard(origin: string): boolean {
	const { protocol, hostname } = new URL(origin);
	return protocol === "https:" && hostname.endsWith(".supabase.co");
}

function toWebSocketOrigin(origin: string): string {
	return origin.replace(/^http/, "ws");
}

function unique(values: readonly string[]): string[] {
	return Array.from(new Set(values));
}

export function buildContentSecurityPolicy(options: SecurityHeaderOptions = {}): string {
	const { isDev = false, vercelAnalytics = false, vercelToolbar = false } = options;

	const supabaseOrigin = toCspOrigin(options.supabaseUrl);
	const customSupabase =
		supabaseOrigin && !isCoveredBySupabaseWildcard(supabaseOrigin) ? supabaseOrigin : null;
	const extraImgSrc = (options.extraImgSrc ?? [])
		.map((origin) => toCspOrigin(origin))
		.filter((origin): origin is string => origin !== null);

	const directives: Array<[string, string[]]> = [
		["default-src", ["'self'"]],
		[
			"script-src",
			[
				"'self'",
				"'unsafe-inline'",
				...(isDev ? ["'unsafe-eval'"] : []),
				...(vercelAnalytics ? [VERCEL_SCRIPTS] : []),
				...(vercelToolbar ? [VERCEL_LIVE] : []),
			],
		],
		["style-src", ["'self'", "'unsafe-inline'", ...(vercelToolbar ? [VERCEL_LIVE] : [])]],
		[
			"img-src",
			[
				"'self'",
				"data:",
				"blob:",
				SUPABASE_HTTP,
				...(customSupabase ? [customSupabase] : []),
				...extraImgSrc,
				...(vercelToolbar ? [VERCEL_LIVE, "https://vercel.com"] : []),
			],
		],
		[
			"font-src",
			["'self'", ...(vercelToolbar ? [VERCEL_LIVE, "https://assets.vercel.com"] : [])],
		],
		[
			"connect-src",
			[
				"'self'",
				SUPABASE_HTTP,
				SUPABASE_WS,
				...(customSupabase ? [customSupabase, toWebSocketOrigin(customSupabase)] : []),
				VERCEL_VITALS,
				...(vercelAnalytics ? [VERCEL_SCRIPTS] : []),
				...(vercelToolbar ? [VERCEL_LIVE, VERCEL_LIVE_PUSHER] : []),
				...(isDev ? ["ws:"] : []),
			],
		],
		...(vercelToolbar ? ([["frame-src", ["'self'", VERCEL_LIVE]]] as Array<[string, string[]]>) : []),
		...(isDev ? [] : ([["frame-ancestors", ["'none'"]]] as Array<[string, string[]]>)),
		["base-uri", ["'self'"]],
		["form-action", ["'self'"]],
		["object-src", ["'none'"]],
	];

	const policy = directives.map(([name, sources]) => `${name} ${unique(sources).join(" ")}`);
	if (!isDev) policy.push("upgrade-insecure-requests");
	return policy.join("; ");
}

export function buildSecurityHeaders(options: SecurityHeaderOptions = {}): SecurityHeader[] {
	const isDev = options.isDev ?? false;

	return [
		{ key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
		...(isDev
			? []
			: [
					{
						key: "Strict-Transport-Security",
						value: `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains; preload`,
					},
					{ key: "X-Frame-Options", value: "DENY" },
				]),
		{ key: "X-Content-Type-Options", value: "nosniff" },
		{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
		{
			key: "Permissions-Policy",
			value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
		},
		{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
	];
}
