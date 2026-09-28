/**
 * JSON responses for private or per-request endpoints: never cached by the browser, Vercel's edge or
 * any proxy in between, and never indexed.
 */

import { NextResponse } from "next/server";

export const NO_STORE_HEADERS = {
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex",
} as const;

export function noStoreJson<T>(body: T, init: ResponseInit = {}): NextResponse<T> {
	const headers = new Headers(init.headers);
	for (const [key, value] of Object.entries(NO_STORE_HEADERS)) headers.set(key, value);
	return NextResponse.json(body, { ...init, headers });
}
