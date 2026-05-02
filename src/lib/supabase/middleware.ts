import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session and forwards updated cookies on the response.
 * Required for reliable server-side auth when using @supabase/ssr with the App Router.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        if (cacheHeaders) {
          for (const [headerKey, headerValue] of Object.entries(cacheHeaders)) {
            if (typeof headerValue === "string") {
              supabaseResponse.headers.set(headerKey, headerValue);
            }
          }
        }
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}
