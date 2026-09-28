/**
 * Admin gate for route handlers and server actions under the management portal.
 *
 * Reads the Supabase Auth session from cookies (same client as app/(admin)/mgmt-portal/layout.tsx),
 * asks Supabase to verify it with auth.getUser(), then applies lib/security/admin-policy.ts.
 *
 *   const admin = await requireAdmin();
 *   if (!admin.ok) return admin.response;
 */

import "server-only";

import type { User } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { evaluateAdminAccess, parseAdminAllowlist } from "@/lib/security/admin-policy";
import { noStoreJson } from "@/lib/security/responses";

export type AdminCheck =
	| { ok: true; user: User }
	| { ok: false; status: 401 | 403 | 503; code: "unauthenticated" | "forbidden" | "auth_unavailable" };

export type AdminGuard =
	| { ok: true; user: User }
	| { ok: false; response: NextResponse<{ error: string; message: string }> };

const MESSAGES: Record<Exclude<AdminCheck, { ok: true }>["code"], string> = {
	unauthenticated: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
	forbidden: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนผู้ดูแลระบบ",
	auth_unavailable: "ระบบยืนยันตัวตนไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่อีกครั้ง",
};

function isSupabaseConfigured(): boolean {
	return Boolean(
		process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
			(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
				process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
	);
}

/** Resolve the current admin, or why not. Never throws. */
export async function getAdminUser(): Promise<AdminCheck> {
	if (!isSupabaseConfigured()) {
		return { ok: false, status: 503, code: "auth_unavailable" };
	}

	try {
		const supabase = await createClient();
		const { data, error } = await supabase.auth.getUser();
		const user = error ? null : data.user;

		const decision = evaluateAdminAccess(user, parseAdminAllowlist(process.env.ADMIN_EMAILS));
		if (!decision.ok) return decision;
		// evaluateAdminAccess only returns ok for a non-null user.
		return { ok: true, user: user as User };
	} catch (error) {
		console.error("[require-admin] session check failed", error);
		return { ok: false, status: 503, code: "auth_unavailable" };
	}
}

/** For route handlers: the admin user, or a ready-made 401 / 403 / 503 JSON response (no-store). */
export async function requireAdmin(): Promise<AdminGuard> {
	const check = await getAdminUser();
	if (check.ok) return check;

	return {
		ok: false,
		response: noStoreJson(
			{ error: check.code, message: MESSAGES[check.code] },
			{ status: check.status },
		),
	};
}
