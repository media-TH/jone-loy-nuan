/**
 * Jest environment for tests that exercise Next.js request/response code (proxy, route handlers).
 *
 * Keeps jsdom so the shared jest.setup.ts (window.matchMedia etc.) still works, but swaps in Node's
 * native fetch primitives: NextRequest / NextResponse extend the spec Request / Response, which the
 * whatwg-fetch polyfill loaded by jest.setup.ts does not implement fully. whatwg-fetch leaves an
 * existing global fetch alone, so these survive setup.
 *
 * Use with a docblock: @jest-environment ./__tests__/security/support/native-fetch-environment.ts
 */

import { TestEnvironment } from "jest-environment-jsdom";

const NATIVE_GLOBALS = [
	"fetch",
	"Request",
	"Response",
	"Headers",
	"AbortController",
	"AbortSignal",
	"ReadableStream",
] as const;

export default class NativeFetchEnvironment extends TestEnvironment {
	constructor(...args: ConstructorParameters<typeof TestEnvironment>) {
		super(...args);
		const target = this.global as unknown as Record<string, unknown>;
		const source = globalThis as unknown as Record<string, unknown>;
		for (const name of NATIVE_GLOBALS) {
			if (source[name] !== undefined) target[name] = source[name];
		}
	}
}
