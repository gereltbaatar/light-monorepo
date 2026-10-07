import { createServerClient } from "@supabase/ssr";
import { createClient as createTokenClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

// Native apps send their Supabase session as a bearer token instead of cookies.
function createBearerClient(token: string) {
  const client = createTokenClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  const getUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = (jwt?: string) => getUser(jwt ?? token);
  return client;
}

export async function createClient() {
  const authorization = (await headers()).get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) return createBearerClient(token);

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
