import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import type { Request } from '@react-router/dev/routes';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export async function createClient(request: Request) {
  const headers = new Headers();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options));
        });
      },
    },
  });

  // Store headers on the supabase client for later retrieval
  (supabase as any).__headers = headers;
  
  return supabase;
}

export function getResponseHeaders(supabase: any): Headers {
  return (supabase as any).__headers || new Headers();
}

