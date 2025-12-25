import { createClient } from '@supabase/supabase-js';
import type { Request } from '@react-router/dev/routes';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Get the session from a request (for server-side use)
 * This extracts the access token from cookies and uses it to get the user
 */
export async function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      try {
        acc[key.trim()] = decodeURIComponent(value);
      } catch {
        acc[key.trim()] = value;
      }
    }
    return acc;
  }, {} as Record<string, string>);
  
  // Supabase stores the session in a cookie
  // Look for cookies that might contain the auth token
  let accessToken: string | null = null;
  let sessionData: any = null;
  
  for (const [key, value] of Object.entries(cookies)) {
    if (key.includes('auth-token') || key.includes('supabase')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed?.access_token) {
          accessToken = parsed.access_token;
          sessionData = parsed;
          break;
        }
      } catch {
        // Not JSON, continue
      }
    }
  }
  
  // If we found an access token, create a client with it
  if (accessToken) {
    const serverClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    const { data: { user } } = await serverClient.auth.getUser();
    if (user) {
      return { user, access_token: accessToken };
    }
  }
  
  // Fallback: try the regular client (might work if cookies are accessible)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return session;
    }
  } catch {
    // Ignore
  }
  
  return null;
}

