import { Link, useLoaderData, useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { createClient as createServerClient, getResponseHeaders } from '../utils/supabase/server';
import { isUnionAdmin, getUserUnions, type Union } from '../utils/unions';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { UserDropdown } from '../components/UserDropdown';
import { UnionDropdown } from '../components/UnionDropdown';
import type { Route } from './+types/union.$slug.settings';

export function meta({ data }: Route.MetaArgs) {
  let unionName = 'Union';
  
  // Try to get union name from loader data
  if (data && typeof data === 'object' && data !== null) {
    try {
      const parsed = data as { union?: { name?: string } };
      if (parsed.union?.name && typeof parsed.union.name === 'string') {
        unionName = parsed.union.name;
      }
    } catch (e) {
      // Fallback
    }
  }
  
  return [
    { title: `${unionName} · Settings · Union Simple` },
    { name: 'description', content: `Manage your ${unionName} settings` },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = await createServerClient(request);
  
  // Get the user session from cookies (proper SSR way)
  const { data: { user } } = await supabase.auth.getUser();
  
  const responseHeaders = getResponseHeaders(supabase);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  // Get union by slug
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
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  // Verify user is admin of this union
  const isAdmin = await isUnionAdmin(user.id, unionBySlug.id);
  
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ 
        error: 'You are not authorized to edit this union.' 
      }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  return new Response(
    JSON.stringify({ union: unionBySlug }),
    { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
  );
}

export async function action({ request, params }: Route.ActionArgs) {
  const supabase = await createServerClient(request);
  
  // Get the user session from cookies (proper SSR way)
  const { data: { user } } = await supabase.auth.getUser();
  
  const responseHeaders = getResponseHeaders(supabase);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  const { slug } = params;

  // Get union by slug
  const { data: unionBySlug } = await supabase
    .from('unions')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!unionBySlug) {
    return new Response(
      JSON.stringify({ error: 'Union not found' }),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  // Verify user is admin of this union
  const isAdmin = await isUnionAdmin(user.id, unionBySlug.id);
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'You are not authorized to edit this union' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  const formData = await request.formData();
  const name = formData.get('name') as string;

  if (!name || name.trim() === '') {
    return new Response(
      JSON.stringify({ error: 'Union name is required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  // Update the union name
  const { data, error } = await supabase
    .from('unions')
    .update({
      name: name.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', unionBySlug.id)
    .select()
    .single();

  if (error || !data) {
    console.error('Union update error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update union', 
        details: error?.message || 'An unexpected error occurred' 
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  return new Response(
    JSON.stringify({ union: data, success: true }),
    { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
  );
}

export default function UnionSettings() {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const loaderData = useLoaderData() as { union?: Union; unionName?: string; slug?: string };
  const [unions, setUnions] = useState<Union[]>([]);
  const [unionsLoading, setUnionsLoading] = useState(true);
  const [selectedUnion, setSelectedUnion] = useState<Union | undefined>();
  const [currentUnionSlug, setCurrentUnionSlug] = useState<string | undefined>(slug);
  const [unionName, setUnionName] = useState('');
  const [currentUnion, setCurrentUnion] = useState<Union | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  // Fetch unions and verify admin access when user is available
  useEffect(() => {
    const fetchUnionsAndVerify = async () => {
      if (user && !loading) {
        setUnionsLoading(true);
        setAuthError(null);
        try {
          const userUnions = await getUserUnions(user.id);
          setUnions(userUnions);
          
          // Find union by slug
          const unionBySlug = userUnions.find(u => u.slug === slug);
          if (unionBySlug) {
            setSelectedUnion(unionBySlug);
            setCurrentUnionSlug(unionBySlug.slug);
            
            // Verify user is admin of this union
            const isAdmin = await isUnionAdmin(user.id, unionBySlug.id);
            if (!isAdmin) {
              setAuthError('You are not authorized to edit this union.');
              setUnionsLoading(false);
              return;
            }
            
            // Set the current union and its name
            setCurrentUnion(unionBySlug);
            setUnionName(unionBySlug.name);
          } else if (userUnions.length > 0) {
            // If slug doesn't match, redirect to first union
            navigate(`/union/${userUnions[0].slug}`, { replace: true });
          } else {
            setAuthError('Union not found or you do not have access to it.');
          }
        } catch (error) {
          console.error('Error fetching unions:', error);
          setAuthError('Failed to load union data.');
        } finally {
          setUnionsLoading(false);
        }
      }
    };

    fetchUnionsAndVerify();
  }, [user, loading, slug, navigate]);

  // Update selected union when slug changes
  useEffect(() => {
    if (slug && unions.length > 0) {
      const unionBySlug = unions.find(u => u.slug === slug);
      if (unionBySlug) {
        setSelectedUnion(unionBySlug);
        setCurrentUnionSlug(unionBySlug.slug);
      }
    }
  }, [slug, unions]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    if (!unionName || unionName.trim() === '') {
      setError('Union name is required');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', unionName.trim());

      const response = await fetch(`/union/${slug}/settings`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Important: include cookies
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update union name');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      // Refresh the page data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setSubmitting(false);
    }
  };

  if (loading || unionsLoading) {
    return (
      <div className="min-h-screen bg-warm-light flex items-center justify-center">
        <div className="text-primary-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show auth error if user is not authorized
  if (authError) {
    return (
      <div className="min-h-screen bg-warm-light flex">
        <DashboardSidebar unionSlug={currentUnionSlug} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <nav className="bg-white border-b border-primary-200">
            <div className="px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex-1"></div>
                <div className="flex items-center space-x-4">
                  <UnionDropdown 
                    unions={unions} 
                    currentUnionId={selectedUnion?.id}
                    onUnionSelect={(unionId) => {
                      const union = unions.find(u => u.id === unionId);
                      if (union) {
                        navigate(`/union/${union.slug}`);
                      }
                    }}
                  />
                  {user && <UserDropdown user={user} />}
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 overflow-y-auto bg-warm-light">
            <div className="px-6 lg:px-8 py-8 md:py-8 pt-20 md:pt-8">
              <div className="bg-white rounded-lg shadow-lg border border-primary-200 p-8">
                <div className="text-red-600">{authError}</div>
                <Link
                  to={`/union/${slug}`}
                  className="mt-4 inline-block text-primary-700 hover:text-primary-900"
                >
                  ← Back to Union
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  // Don't render form until we have the union data
  if (!currentUnion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-warm-light flex">
      {/* Sidebar */}
      <DashboardSidebar unionSlug={currentUnionSlug} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <nav className="bg-white border-b border-primary-200">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex-1"></div>
              <div className="flex items-center space-x-4">
                <UnionDropdown 
                  unions={unions} 
                  currentUnionId={selectedUnion?.id}
                  onUnionSelect={(unionId) => {
                    const union = unions.find(u => u.id === unionId);
                    if (union) {
                      navigate(`/union/${union.slug}`);
                    }
                  }}
                />
                {user && <UserDropdown user={user} />}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-warm-light">
          <div className="px-6 lg:px-8 py-8 md:py-8 pt-20 md:pt-8">
            <div className="bg-white rounded-lg shadow-lg border border-primary-200 p-8 md:p-12">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-primary-900 mb-2">
                  Union Settings
                </h1>
                <p className="text-lg text-primary-700">
                  Manage your union information and preferences.
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-medium text-green-800">
                    Union name updated successfully! Refreshing...
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="font-medium text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                    value={unionName}
                    onChange={(e) => setUnionName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                    placeholder="My Union"
                  />
                </div>

                <div className="pt-4 flex space-x-4">
                  <button
                    type="submit"
                    disabled={submitting || success}
                    className="flex-1 px-6 py-3 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Updating...' : success ? 'Updated!' : 'Update Union Name'}
                  </button>
                  <Link
                    to={`/union/${slug}`}
                    className="px-6 py-3 border border-primary-300 text-primary-700 rounded-md hover:bg-primary-50 transition font-medium text-lg"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

