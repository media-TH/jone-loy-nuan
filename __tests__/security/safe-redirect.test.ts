import { safeRedirectPath } from "@/lib/security/safe-redirect";

describe("safeRedirectPath", () => {
	it("keeps same-site paths, including query and hash", () => {
		expect(safeRedirectPath("/mgmt-portal")).toBe("/mgmt-portal");
		expect(safeRedirectPath("/mgmt-portal/quiz?tab=2#top")).toBe("/mgmt-portal/quiz?tab=2#top");
	});

	it.each([
		"https://evil.example/phish",
		"//evil.example",
		"/\\evil.example",
		"\\\\evil.example",
		"javascript:alert(1)",
		"mgmt-portal",
		"/\t/evil.example",
		"/\n/evil.example",
		"",
	])("falls back for %p", (value) => {
		expect(safeRedirectPath(value, "/mgmt-portal")).toBe("/mgmt-portal");
	});

	it("falls back for non-strings", () => {
		expect(safeRedirectPath(null)).toBe("/");
		expect(safeRedirectPath(undefined)).toBe("/");
		expect(safeRedirectPath(42)).toBe("/");
	});
});
