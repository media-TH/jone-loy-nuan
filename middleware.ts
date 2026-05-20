import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/mgmt-portal", "/dashboard"];

const isProtectedPath = (pathname: string) =>
	PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export async function middleware(request: NextRequest) {
	if (!isProtectedPath(request.nextUrl.pathname)) {
		return NextResponse.next();
	}

	const response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

	if (!supabaseUrl || !supabaseKey) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const supabase = createServerClient(supabaseUrl, supabaseKey, {
		cookies: {
			get(name: string) {
				return request.cookies.get(name)?.value;
			},
			set(name: string, value: string, options: CookieOptions) {
				request.cookies.set({ name, value, ...options });
				response.cookies.set({ name, value, ...options });
			},
			remove(name: string, options: CookieOptions) {
				request.cookies.set({ name, value: "", ...options });
				response.cookies.set({ name, value: "", ...options });
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
		return NextResponse.redirect(loginUrl);
	}

	return response;
}

export const config = {
	matcher: ["/mgmt-portal/:path*", "/dashboard/:path*"],
};
