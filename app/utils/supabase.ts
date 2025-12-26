// Re-export for backward compatibility
// Use createClient from './supabase/client' for browser
// Use createClient from './supabase/server' for server-side
import { createClient as createBrowserClient } from './supabase/client';

// For client-side components that need a singleton instance
export const supabase = createBrowserClient();

