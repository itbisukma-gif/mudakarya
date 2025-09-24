'use server';

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Buffer } from 'buffer';

export const createClient = () => {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    // This can happen during build time, return a dummy or handle it gracefully.
    // For now, throwing an error on server-side usage is fine if env vars are expected.
    throw new Error("Supabase URL and Anon Key are required for server-side client.");
  }

  // Create a server-side client with the user's cookies
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // During the build process, these variables might be undefined.
    // We can return a mock or limited client, but for now, to fix the build,
    // we'll throw an error only if it's not in a build-like environment,
    // or just ensure this function isn't called during static generation.
    // The safest bet is to check for existence and handle it in the calling action.
    // For now, to prevent build crash, we'll throw. The calling actions should be guarded.
    throw new Error("Supabase URL and Service Role Key are required for admin operations.");
  }

  // Create a server-side client with the service_role key to bypass RLS
  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
        get(name: string) { return undefined; },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
};
