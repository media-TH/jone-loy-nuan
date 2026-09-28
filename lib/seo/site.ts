/**
 * Site identity and indexing policy, shared by metadata, robots.txt, the sitemap, JSON-LD and
 * the generated Open Graph images.
 *
 * NEXT_PUBLIC_SITE_URL is the canonical origin (the real site). Canonical URLs always point at
 * it, so forks and preview deployments never compete with the real site; on top of that they are
 * marked noindex (see isIndexableDeployment / isIndexableHost).
 */

type Env = Readonly<Record<string, string | undefined>>;

const DEFAULT_SITE_URL = "https://xn--12co4czb5a2kj.online";

/** Origin of an http(s) URL; anything else (unset, malformed, other schemes) falls back to the real site. */
export function resolveSiteUrl(value: string | undefined): URL {
	const trimmed = value?.trim();
	if (trimmed) {
		try {
			const url = new URL(trimmed);
			if (url.protocol === "https:" || url.protocol === "http:") return new URL(url.origin);
		} catch {
			// Fall through to the default below.
		}
	}
	return new URL(DEFAULT_SITE_URL);
}

const siteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** Canonical origin without a trailing slash, e.g. "https://xn--12co4czb5a2kj.online". */
export const SITE_URL = siteUrl.origin;
/** Canonical host in its ASCII (punycode) form, the way it arrives in the Host header. */
export const SITE_HOST = siteUrl.hostname;

export const SITE_NAME = "สแกนโจร.online";
export const SITE_SHORT_NAME = "สแกนโจร";
export const SITE_TAGLINE = "แบบทดสอบความรู้เท่าทันมิจฉาชีพ";
export const SITE_DESCRIPTION =
	"เรียนรู้วิธีป้องกันตัวเองจากการโกงออนไลน์ ผ่านแบบทดสอบที่เข้าใจง่าย พร้อมสถานการณ์จำลองที่ใกล้เคียงชีวิตจริง";
export const SITE_LOCALE = "th_TH";
export const SITE_LANGUAGE = "th";

/** The organisations that publish the site (schema.org publisher, footer credit). */
export const PUBLISHERS = [
	{
		id: "bot",
		name: "ธนาคารแห่งประเทศไทย",
		alternateName: "Bank of Thailand",
		url: "https://www.bot.or.th",
	},
	{
		id: "tmf",
		name: "กองทุนพัฒนาสื่อปลอดภัยและสร้างสรรค์",
		alternateName: "Thai Media Fund",
		url: "https://www.thaimediafund.or.th",
	},
] as const;

/** Absolute URL on the canonical origin for a site path ("/learn" → "https://…/learn"). */
export function absoluteUrl(path = "/"): string {
	return new URL(path, SITE_URL).toString();
}

/** Lower-cased ASCII hostname of a Host header value or URL ("Example.com:443" → "example.com"). */
export function normalizeHost(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	try {
		return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname;
	} catch {
		return null;
	}
}

/**
 * Whether this deployment may be indexed at all. Build-time safe (env only), so static pages
 * can bake the answer into their robots meta.
 *
 * - Only Vercel production deployments are indexable; previews and local builds never are.
 * - A fork that deploys to its own production domain without setting NEXT_PUBLIC_SITE_URL still
 *   carries the real site's canonical URL; it is caught by comparing Vercel's production domain
 *   (VERCEL_PROJECT_PRODUCTION_URL) with that canonical host. Setting NEXT_PUBLIC_SITE_URL
 *   explicitly declares the canonical host and skips that comparison (robots.txt still checks
 *   the request host).
 */
export function isIndexableDeployment(env: Env = process.env): boolean {
	if (env.VERCEL_ENV !== "production") return false;
	if (env.NEXT_PUBLIC_SITE_URL?.trim()) return true;

	const productionHost = normalizeHost(env.VERCEL_PROJECT_PRODUCTION_URL);
	const canonicalHost = resolveSiteUrl(undefined).hostname;
	return productionHost === null || productionHost === canonicalHost;
}

/** Whether a request to `host` may be crawled: an indexable deployment served on the canonical host. */
export function isIndexableHost(host: string | null | undefined, env: Env = process.env): boolean {
	if (!isIndexableDeployment(env)) return false;
	const canonicalHost = resolveSiteUrl(env.NEXT_PUBLIC_SITE_URL).hostname;
	return normalizeHost(host) === canonicalHost;
}

/** Evaluated once per server process / build; drives the default robots meta in app/layout.tsx. */
export const IS_INDEXABLE_DEPLOYMENT = isIndexableDeployment();
