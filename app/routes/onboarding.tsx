import { Form, Link, useNavigate, redirect, useActionData } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase, getSessionFromRequest } from '../utils/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Route } from './+types/onboarding';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Create Your Union - Union Simple' },
    { name: 'description', content: 'Create your union and get started' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Don't redirect here - let the client-side auth check handle it
  // This prevents the flash of redirect when session is in localStorage
  const session = await getSessionFromRequest(request);
  
  return new Response(
    JSON.stringify({ user: session?.user || null }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  
  // Try to get access token from form data first (sent from client)
  const accessTokenFromForm = formData.get('access_token') as string | null;
  
  let session: any = null;
  let userId: string | null = null;
  let accessToken: string | null = accessTokenFromForm;
  
  // If we have an access token from the form, use it
  if (accessTokenFromForm) {
    const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessTokenFromForm}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    const { data: { user }, error } = await serverSupabase.auth.getUser();
    if (user && !error) {
      session = { user, access_token: accessTokenFromForm };
      userId = user.id;
    }
  }
  
  // Fallback: try to get session from request cookies
  if (!session || !userId) {
    const sessionFromRequest = await getSessionFromRequest(request);
    if (sessionFromRequest?.user) {
      session = sessionFromRequest;
      userId = sessionFromRequest.user.id;
      accessToken = (sessionFromRequest as any).access_token || accessToken;
    }
  }
  
  if (!session || !userId) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized', 
        details: 'Please sign in to create a union. If you are signed in, try refreshing the page.' 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || null;

  if (!name || name.trim() === '') {
    return new Response(
      JSON.stringify({ error: 'Union name is required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Create a Supabase client with the access token
  const serverSupabase = accessToken 
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : supabase;

  // Create the union
  const { data: union, error: unionError } = await serverSupabase
    .from('unions')
    .insert([{
      name: name.trim(),
      description: description?.trim() || null,
      created_by: userId,
    }])
    .select()
    .single();

  if (unionError || !union) {
    console.error('Union creation error:', unionError);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create union', 
        details: unionError?.message || 'An unexpected error occurred' 
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return redirect('/dashboard');
}

export default function Onboarding() {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Only redirect after loading is complete and we're sure user is not logged in
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  // Get access token from session
  useEffect(() => {
    const getAccessToken = async () => {
      if (session?.access_token) {
        setAccessToken(session.access_token);
      } else if (user) {
        // Fallback: get session directly from Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.access_token) {
          setAccessToken(currentSession.access_token);
        }
      }
    };
    getAccessToken();
  }, [session, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-light flex items-center justify-center">
        <div className="text-primary-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-warm-light">
      {/* Navigation */}
      <nav className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-lg font-semibold text-primary-900">
              Union Simple
            </Link>
            <Link
              to="/dashboard"
              className="text-sm text-primary-700 hover:text-primary-900"
            >
              Skip for now
            </Link>
          </div>
        </div>
      </nav>

      {/* Onboarding Content */}
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg border border-primary-200 p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-900 mb-4">
              Create Your Union
            </h1>
            <p className="text-lg text-primary-700">
              Get started by creating your union. This is where you'll manage everything.
            </p>
          </div>

          {/* Error Message */}
          {actionData?.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium text-red-800">{actionData.error}</p>
              {actionData.details && (
                <p className="text-sm mt-1 text-red-700">{actionData.details}</p>
              )}
            </div>
          )}

          {/* Warning if access token not available */}
          {!accessToken && user && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Loading authentication... Please wait a moment before submitting.
              </p>
            </div>
          )}

          <Form method="post" className="space-y-6">
            {accessToken && (
              <input type="hidden" name="access_token" value={accessToken} />
            )}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-primary-900 mb-2"
              >
                Union Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                placeholder="e.g., Ironworkers Local 123"
                autoFocus
              />
              <p className="mt-2 text-sm text-primary-600">
                Choose a name that clearly identifies your union
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-primary-900 mb-2"
              >
                Description <span className="text-primary-600 text-sm">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full px-4 py-3 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tell us about your union..."
              />
              <p className="mt-2 text-sm text-primary-600">
                Add a brief description to help others understand your union
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={!accessToken}
                className="w-full px-6 py-3 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Union
              </button>
            </div>
          </Form>

          <div className="mt-8 pt-6 border-t border-primary-200">
            <p className="text-sm text-center text-primary-600">
              You can always create more unions later from your dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

