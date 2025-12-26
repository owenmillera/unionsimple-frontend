# Agents Documentation

This document provides guidance for AI agents working on this codebase, with a focus on authentication patterns and best practices.

## Authentication with Supabase SSR

This application uses **Supabase with Server-Side Rendering (SSR)** using the `@supabase/ssr` package. Sessions are stored in **cookies**, not localStorage, which allows both server and client code to access the authenticated user.

### Key Concepts

1. **Browser Client** - Used in React components (client-side)
2. **Server Client** - Used in loaders and actions (server-side)
3. **Cookie-based Sessions** - Sessions are automatically stored in cookies by `@supabase/ssr`

### Client-Side Authentication

For React components and client-side code, use the browser client:

```typescript
import { createClient } from '../utils/supabase/client';

// In a component or hook
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
```

**Or use the AuthContext hook:**

```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, session, loading, signIn, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}
```

### Server-Side Authentication (Loaders & Actions)

For server-side code (loaders and actions), use the server client:

```typescript
import { createClient, getResponseHeaders } from '../utils/supabase/server';
import type { Route } from './+types/my-route';

export async function loader({ request }: Route.LoaderArgs) {
  // Create server client from request (reads cookies)
  const supabase = await createClient(request);
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get response headers (for setting cookies)
  const responseHeaders = getResponseHeaders(supabase);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...Object.fromEntries(responseHeaders)
        }
      }
    );
  }
  
  // User is authenticated, proceed with data fetching
  const { data } = await supabase
    .from('some_table')
    .select('*')
    .eq('user_id', user.id);
  
  return new Response(
    JSON.stringify({ data }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        ...Object.fromEntries(responseHeaders)
      }
    }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const supabase = await createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  const responseHeaders = getResponseHeaders(supabase);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...Object.fromEntries(responseHeaders)
        }
      }
    );
  }
  
  const formData = await request.formData();
  const name = formData.get('name') as string;
  
  // Perform authenticated operation
  const { data, error } = await supabase
    .from('some_table')
    .insert({ name, user_id: user.id });
  
  return new Response(
    JSON.stringify({ data, success: true }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        ...Object.fromEntries(responseHeaders)
      }
    }
  );
}
```

### Complete Example: Protected Route

Here's a complete example from `app/routes/union.$slug.settings.tsx`:

```typescript
import { createClient, getResponseHeaders } from '../utils/supabase/server';
import { isUnionAdmin } from '../utils/unions';
import type { Route } from './+types/union.$slug.settings';

export async function loader({ request, params }: Route.LoaderArgs) {
  // 1. Create server client (reads cookies from request)
  const supabase = await createServerClient(request);
  
  // 2. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  const responseHeaders = getResponseHeaders(supabase);
  
  // 3. Check authentication
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...Object.fromEntries(responseHeaders)
        }
      }
    );
  }

  // 4. Fetch data with authentication
  const { data: unionBySlug } = await supabase
    .from('unions')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!unionBySlug) {
    return new Response(
      JSON.stringify({ error: 'Union not found' }),
      { 
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...Object.fromEntries(responseHeaders)
        }
      }
    );
  }

  // 5. Check authorization (user-specific permissions)
  const isAdmin = await isUnionAdmin(user.id, unionBySlug.id);
  
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'You are not authorized to edit this union.' }),
      { 
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          ...Object.fromEntries(responseHeaders)
        }
      }
    );
  }

  // 6. Return data with response headers (for cookie updates)
  return new Response(
    JSON.stringify({ union: unionBySlug }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        ...Object.fromEntries(responseHeaders)
      }
    }
  );
}
```

### Important Notes

1. **Always include response headers**: When returning a Response from a loader or action, include the response headers from `getResponseHeaders(supabase)`. This ensures cookies are properly set/updated.

2. **Use `getUser()` not `getSession()`**: In server code, always use `supabase.auth.getUser()` which validates the JWT. Never use `getSession()` in server code as it doesn't validate the token.

3. **Client-side forms**: When submitting forms from the client, include `credentials: 'include'` to send cookies:

```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  body: formData,
  credentials: 'include', // Important: sends cookies
});
```

4. **No manual token passing**: You don't need to pass access tokens in form data or headers. The `@supabase/ssr` package handles this automatically via cookies.

### File Structure

```
app/
  utils/
    supabase/
      client.ts      # Browser client (use in components)
      server.ts      # Server client (use in loaders/actions)
      supabase.ts    # Legacy export (for backward compatibility)
  context/
    AuthContext.tsx  # React context for client-side auth
  routes/
    union.$slug.settings.tsx  # Example of protected route
```

### Common Patterns

#### Pattern 1: Public Route (No Auth Required)
```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = await createServerClient(request);
  // No auth check needed
  const { data } = await supabase.from('public_table').select('*');
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### Pattern 2: Protected Route (Auth Required)
```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const supabase = await createServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  const responseHeaders = getResponseHeaders(supabase);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
    );
  }
  
  // Fetch user-specific data
  const { data } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', user.id);
  
  return new Response(
    JSON.stringify({ data }),
    { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
  );
}
```

#### Pattern 3: Role-Based Access Control
```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = await createServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  const responseHeaders = getResponseHeaders(supabase);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
    );
  }
  
  // Check if user has specific role/permission
  const isAdmin = await checkUserPermission(user.id, 'admin');
  
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
    );
  }
  
  // Admin-only data
  const { data } = await supabase.from('admin_table').select('*');
  
  return new Response(
    JSON.stringify({ data }),
    { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
  );
}
```

### Troubleshooting

**Problem**: Getting "Unauthorized" even when logged in
- **Solution**: Make sure you're using `createServerClient(request)` in loaders/actions, not the browser client
- **Solution**: Ensure response headers are included in the Response

**Problem**: Session not persisting
- **Solution**: User may need to sign out and sign back in once to migrate from localStorage to cookies
- **Solution**: Check that `credentials: 'include'` is set on fetch requests

**Problem**: Cookies not being set
- **Solution**: Verify `getResponseHeaders(supabase)` is called and headers are included in Response
- **Solution**: Check browser console for cookie-related errors

### References

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [React Router v7 Documentation](https://reactrouter.com/)
- [@supabase/ssr Package](https://github.com/supabase/ssr)

