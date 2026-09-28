import { readFileSync } from "node:fs";
import path from "node:path";
import {
	CLIENT_STORAGE,
	CONSENT_PURPOSE_IDS,
	CONTACT_FALLBACK,
	DATA_INVENTORY,
	LAWFUL_BASES,
	POLICY_VERSION,
	PURPOSES,
	RETENTION,
	RETENTION_JOB,
	consentFieldName,
	controllerValue,
	assertControllerConfiguredForProduction,
	erasableClientKeys,
	isControllerConfigured,
} from "@/lib/privacy/policy";
import { THAI_PROVINCES, isProvince } from "@/lib/privacy/provinces";
import { GENDER_VALUES } from "@/lib/privacy/survey";

const root = path.join(__dirname, "..", "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const migration = read("supabase/migrations/08-pdpa-consent-retention.sql");

const THAI = /[฀-๿]/;

describe("POLICY_VERSION", () => {
	it("is the ISO date of the notice in force", () => {
		expect(POLICY_VERSION).toBe("2026-09-28");
		expect(new Date(`${POLICY_VERSION}T00:00:00Z`).toISOString().slice(0, 10)).toBe(POLICY_VERSION);
	});
});

describe("RETENTION", () => {
	it("keeps demographics 12 months, sessions 24 months, the consent log 5 years", () => {
		expect(RETENTION.demographics).toEqual({ months: 12, action: "aggregate_then_delete" });
		expect(RETENTION.quizSessions).toEqual({ months: 24, action: "anonymise" });
		expect(RETENTION.consentLog).toEqual({ months: 60, action: "delete" });
	});

	it("keeps the consent log longer than any data it covers", () => {
		expect(RETENTION.demographics.months).toBeLessThan(RETENTION.quizSessions.months);
		expect(RETENTION.consentLog.months).toBeGreaterThan(RETENTION.demographics.months + 36);
	});

	it.each([
		["v_demographics_cutoff", RETENTION.demographics.months],
		["v_sessions_cutoff", RETENTION.quizSessions.months],
		["v_consent_cutoff", RETENTION.consentLog.months],
	])("matches %s in pdpa_retention_purge()", (variable, months) => {
		const match = migration.match(
			new RegExp(`${variable}\\s+constant\\s+timestamptz\\s*:=\\s*now\\(\\)\\s*-\\s*interval '(\\d+) months'`),
		);
		expect(match?.[1]).toBe(String(months));
	});

	it("is scheduled daily at 02:30 Asia/Bangkok", () => {
		expect(migration).toContain(`'${RETENTION_JOB.name}',\n  '${RETENTION_JOB.cronUtc}'`);
		const [minute, hour] = RETENTION_JOB.cronUtc.split(" ").map(Number);
		const bangkok = new Date(Date.UTC(2026, 0, 1, hour, minute)).toLocaleTimeString("en-GB", {
			timeZone: "Asia/Bangkok",
			hour: "2-digit",
			minute: "2-digit",
		});
		expect(bangkok).toBe("02:30");
	});

	it("unschedules an existing job before scheduling it again (idempotent)", () => {
		expect(migration.indexOf(`cron.unschedule('${RETENTION_JOB.name}')`)).toBeGreaterThan(-1);
		expect(migration.indexOf(`cron.unschedule('${RETENTION_JOB.name}')`)).toBeLessThan(
			migration.indexOf("select cron.schedule("),
		);
	});
});

describe("database constraints mirror the TypeScript lists", () => {
	it("consent purposes", () => {
		const list = CONSENT_PURPOSE_IDS.map((id) => `'${id}'`).join(", ");
		expect(migration).toContain(`check (purpose in (${list}))`);
	});

	it("gender values", () => {
		const list = GENDER_VALUES.map((value) => `'${value}'`).join(", ");
		expect(migration).toContain(`gender in (${list})`);
	});

	it("keeps the PDPA functions away from the public API roles", () => {
		for (const fn of [
			"pdpa_retention_purge()",
			"pdpa_erase_subject(text)",
			"pdpa_erase_demographics(text)",
		]) {
			expect(migration).toContain(`revoke execute on function public.${fn} from public, anon, authenticated;`);
			expect(migration).toContain(`grant execute on function public.${fn} to service_role;`);
		}
	});
});

describe("PURPOSES", () => {
	it("has unique ids and Thai copy", () => {
		expect(new Set(PURPOSES.map((purpose) => purpose.id)).size).toBe(PURPOSES.length);
		for (const purpose of PURPOSES) {
			expect(purpose.title).toMatch(THAI);
			expect(purpose.description).toMatch(THAI);
			expect(LAWFUL_BASES[purpose.lawfulBasis]).toBeDefined();
		}
	});

	it("asks for consent exactly for the consent purposes", () => {
		const consentIds = PURPOSES.filter((purpose) => purpose.basis === "consent").map((p) => p.id);
		expect(consentIds).toEqual([...CONSENT_PURPOSE_IDS]);
		for (const purpose of PURPOSES) {
			expect(purpose.basis === "consent").toBe(purpose.lawfulBasis === "consent");
		}
	});

	it("names the ConsentPanel form field after the purpose", () => {
		expect(consentFieldName("demographics")).toBe("consent_demographics");
	});
});

describe("DATA_INVENTORY", () => {
	it("points every entry at a known retention rule and lawful basis", () => {
		for (const item of DATA_INVENTORY) {
			expect(LAWFUL_BASES[item.lawfulBasis]).toBeDefined();
			if ("retentionKey" in item) expect(RETENTION[item.retentionKey]).toBeDefined();
		}
	});

	it("marks demographics as optional and consent-based", () => {
		const demographics = DATA_INVENTORY.find((item) => item.id === "demographics");
		expect(demographics).toMatchObject({ lawfulBasis: "consent", optional: true });
	});
});

describe("CLIENT_STORAGE", () => {
	it("matches the keys the services actually write", () => {
		expect(read("lib/services/anon-jwt.service.ts")).toContain('const CACHE_KEY = "anon_jwt_cache";');
		expect(read("lib/services/anonymous-user.service.ts")).toContain(
			"const STORAGE_KEY = 'scan_jone_anonymous_user';",
		);
		expect(CLIENT_STORAGE.map((entry) => entry.key).sort()).toEqual([
			"anon_jwt_cache",
			"scan_jone_anonymous_user",
		]);
	});

	it("lists every key for erasure, by storage area, as fresh arrays", () => {
		const keys = erasableClientKeys();
		expect(keys).toEqual({
			localStorage: ["scan_jone_anonymous_user"],
			sessionStorage: ["anon_jwt_cache"],
		});
		keys.localStorage.push("mutated");
		expect(erasableClientKeys().localStorage).toEqual(["scan_jone_anonymous_user"]);
	});
});

describe("controller contact", () => {
	it("falls back to 'โปรดติดต่อผู้ดูแลระบบ' for unset details", () => {
		expect(CONTACT_FALLBACK).toBe("โปรดติดต่อผู้ดูแลระบบ");
		expect(controllerValue(null)).toBe(CONTACT_FALLBACK);
		expect(controllerValue(undefined)).toBe(CONTACT_FALLBACK);
		expect(controllerValue("   ")).toBe(CONTACT_FALLBACK);
		expect(controllerValue(" dpo@example.org ")).toBe("dpo@example.org");
	});

	it("is configured only when name, address and email are all set", () => {
		const complete = { name: "หน่วยงาน", address: "ที่อยู่", email: "privacy@example.org", dpoEmail: null };
		expect(isControllerConfigured(complete)).toBe(true);
		expect(isControllerConfigured({ ...complete, address: " " })).toBe(false);
		expect(isControllerConfigured({ ...complete, email: null })).toBe(false);
	});

	it("blocks a Vercel production build until the controller is filled in (s.23(5))", () => {
		const missing = { name: null, address: null, email: null, dpoEmail: null };
		const complete = { name: "หน่วยงาน", address: "ที่อยู่", email: "privacy@example.org", dpoEmail: null };

		expect(() => assertControllerConfiguredForProduction({ VERCEL_ENV: "production" }, missing)).toThrow(
			/CONTROLLER/,
		);
		expect(() => assertControllerConfiguredForProduction({ VERCEL_ENV: "production" }, complete)).not.toThrow();
		expect(() => assertControllerConfiguredForProduction({ VERCEL_ENV: "preview" }, missing)).not.toThrow();
		expect(() => assertControllerConfiguredForProduction({}, missing)).not.toThrow();
	});
});

describe("THAI_PROVINCES", () => {
	it("lists the 77 provinces once each, Bangkok first", () => {
		expect(THAI_PROVINCES).toHaveLength(77);
		expect(new Set(THAI_PROVINCES).size).toBe(77);
		expect(THAI_PROVINCES[0]).toBe("กรุงเทพมหานคร");
		expect(THAI_PROVINCES).toContain("บึงกาฬ");
		for (const province of THAI_PROVINCES) expect(province).toMatch(/^[฀-๿]+$/);
	});

	it("validates membership", () => {
		expect(isProvince("พระนครศรีอยุธยา")).toBe(true);
		expect(isProvince("อยุธยา")).toBe(false);
		expect(isProvince(undefined)).toBe(false);
	});
});
