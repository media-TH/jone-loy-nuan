import { createServerClient } from "@supabase/ssr"

// Server-only Supabase client using the Service Role key.
// Never import this into client components.
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SECRET_KEY

  if (!url || !serviceKey) {
    throw new Error("Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SECRET_KEY")
  }

  return createServerClient(url, serviceKey, {
    cookies: {
      get() {
        return undefined
      },
      set() {
        // no-op for admin client
      },
      remove() {
        // no-op for admin client
      },
    },
  })
}

