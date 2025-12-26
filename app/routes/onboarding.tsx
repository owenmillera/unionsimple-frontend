import { Form, Link, useNavigate, redirect, useActionData } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { createClient, getResponseHeaders } from '../utils/supabase/server';
import { generateUniqueSlug } from '../utils/unions';
import type { Route } from './+types/onboarding';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Create Your Union - Union Simple' },
    { name: 'description', content: 'Create your union and get started' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Don't redirect here - let the client-side auth check handle it
  // This prevents the flash of redirect when session is in localStorage
  const supabaseClient = await createClient(request);
  const { data: { user } } = await supabaseClient.auth.getUser();
  const responseHeaders = getResponseHeaders(supabaseClient);
  
  return new Response(
    JSON.stringify({ user: user || null }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        ...Object.fromEntries(responseHeaders)
      } 
    }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const supabaseClient = await createClient(request);
  const { data: { user } } = await supabaseClient.auth.getUser();
  const responseHeaders = getResponseHeaders(supabaseClient);
  
  if (!user) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized', 
        details: 'Please sign in to create a union. If you are signed in, try refreshing the page.' 
      }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...Object.fromEntries(responseHeaders)
        }
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
        headers: { 
          'Content-Type': 'application/json',
          ...Object.fromEntries(responseHeaders)
        }
      }
    );
  }

  // Generate unique slug from union name
  const slug = await generateUniqueSlug(name.trim(), supabaseClient);

  // Create the union
  const { data: union, error: unionError } = await supabaseClient
    .from('unions')
    .insert([{
      name: name.trim(),
      slug: slug,
      description: description?.trim() || null,
      created_by: user.id,
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
        headers: { 
          'Content-Type': 'application/json',
          ...Object.fromEntries(responseHeaders)
        }
      }
    );
  }

  return redirect(`/union/${union.slug}`);
}

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    // Only redirect after loading is complete and we're sure user is not logged in
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

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
              to="/"
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

          <Form method="post" className="space-y-6">
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
                className="w-full px-6 py-3 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition font-medium text-lg"
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

