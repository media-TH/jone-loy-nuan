import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
	let response = NextResponse.next({
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
			return response;
		}

		const supabase = createServerClient(supabaseUrl, supabaseKey, {
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(name: string, value: string, options: CookieOptions) {
					request.cookies.set({
						name,
						value,
						...options,
					});
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({
						name,
						value,
						...options,
					});
				},
				remove(name: string, options: CookieOptions) {
					request.cookies.set({
						name,
						value: "",
						...options,
					});
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({
						name,
						value: "",
						...options,
					});
				},
			},
		});

		// Get user session for authentication check
		const { data: { user }, error } = await supabase.auth.getUser();
		
		// Check if accessing admin routes (including the hidden path)
		const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') || 
							 request.nextUrl.pathname.startsWith('/x9k2m7n4p8q1');
		
		if (isAdminRoute) {
			// If no user or error getting user, redirect to login
			if (!user || error) {
				const loginUrl = new URL('/login', request.url);
				loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
				return NextResponse.redirect(loginUrl);
			}
		}
	} catch (error) {
		console.error("[middleware] updateSession error", error);
		
		// If error and accessing admin routes, redirect to login
		if (request.nextUrl.pathname.startsWith('/admin') || 
			request.nextUrl.pathname.startsWith('/x9k2m7n4p8q1')) {
			const loginUrl = new URL('/login', request.url);
			loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
			return NextResponse.redirect(loginUrl);
		}
		
		// Return the original response even if session fetch fails for non-admin routes
		return response;
	}

	return response;
}
