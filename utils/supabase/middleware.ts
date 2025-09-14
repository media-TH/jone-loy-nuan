import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		// If env variables are missing simply skip the session handling
		if (!supabaseUrl || !supabaseKey) {
			console.warn(
				"[middleware] Supabase env vars missing – skipping session sync"
			);
			return supabaseResponse;
		}

		const supabase = createServerClient(supabaseUrl, supabaseKey, {
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(name: string, value: string, options: CookieOptions) {
					// Update the request cookies for subsequent middleware/handlers
					request.cookies.set({
						name,
						value,
						...options,
					});
					// Update the response cookies to send to the browser
					supabaseResponse.cookies.set({
						name,
						value,
						...options,
						// Ensure proper cookie settings for session persistence
						httpOnly: options.httpOnly ?? true,
						secure: process.env.NODE_ENV === 'production',
						sameSite: options.sameSite ?? 'lax',
						path: options.path ?? '/',
					});
				},
				remove(name: string, options: CookieOptions) {
					// Update the request cookies for subsequent middleware/handlers
					request.cookies.set({
						name,
						value: "",
						...options,
					});
					// Update the response cookies to send to the browser
					supabaseResponse.cookies.set({
						name,
						value: "",
						...options,
						// Ensure proper cookie settings for removal
						httpOnly: options.httpOnly ?? true,
						secure: process.env.NODE_ENV === 'production',
						sameSite: options.sameSite ?? 'lax',
						path: options.path ?? '/',
						maxAge: 0,
					});
				},
			},
		});

		// Refresh session to ensure it's up to date
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();

		// Check if accessing admin routes (including the hidden path)
		const isAdminRoute = request.nextUrl.pathname.startsWith('/(admin)') ||
			request.nextUrl.pathname.startsWith('/x9k2m7n4p8q1');

		// Skip auth check for login page to prevent redirect loops
		const isLoginPage = request.nextUrl.pathname === '/login';



		if (isAdminRoute && !isLoginPage) {
			// If no session or session error, redirect to login
			if (!session || sessionError) {
				console.log("[middleware] No valid session for admin route, redirecting to login");
				const loginUrl = new URL('/login', request.url);
				loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
				return NextResponse.redirect(loginUrl);
			}

			// Additional check: verify the user exists and is valid
			const { data: { user }, error: userError } = await supabase.auth.getUser();
			if (!user || userError) {
				console.log("[middleware] No valid user for admin route, redirecting to login");
				const loginUrl = new URL('/login', request.url);
				loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
				return NextResponse.redirect(loginUrl);
			}

		}

		// If user is logged in and trying to access login page, redirect to admin
		if (isLoginPage && session && !sessionError) {
			const redirectTo = request.nextUrl.searchParams.get('redirectTo');
			const finalRedirect = redirectTo?.startsWith('/admin')
				? redirectTo.replace('/admin', '/x9k2m7n4p8q1')
				: redirectTo || "/x9k2m7n4p8q1";
			return NextResponse.redirect(new URL(finalRedirect, request.url));
		}

	} catch (error) {
		console.error("[middleware] updateSession error", error);

		// If error and accessing admin routes, redirect to login
		const isAdminRoute = request.nextUrl.pathname.startsWith('/(admin)') ||
			request.nextUrl.pathname.startsWith('/x9k2m7n4p8q1');
		const isLoginPage = request.nextUrl.pathname === '/login';

		if (isAdminRoute && !isLoginPage) {
			const loginUrl = new URL('/login', request.url);
			loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
			loginUrl.searchParams.set('error', 'no_session');
			return NextResponse.redirect(loginUrl);
		}

		// Return the response even if session fetch fails for non-admin routes
		return supabaseResponse;
	}

	return supabaseResponse;
}
