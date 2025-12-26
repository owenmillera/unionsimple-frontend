import { Form, Link, useNavigate, redirect, useLoaderData, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { createClient as createServerClient, getResponseHeaders } from '../utils/supabase/server';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { UserDropdown } from '../components/UserDropdown';
import { UnionDropdown } from '../components/UnionDropdown';
import { getUserUnions, type Union } from '../utils/unions';
import { useState } from 'react';
import type { Route } from './+types/union.$slug.members.new';

export function meta({ data }: Route.MetaArgs) {
  let unionName = 'Union';
  
  // Try to get union name from loader data
  if (data && typeof data === 'object' && data !== null) {
    try {
      const parsed = data as { currentUnion?: { name?: string } };
      if (parsed.currentUnion?.name && typeof parsed.currentUnion.name === 'string') {
        unionName = parsed.currentUnion.name;
      }
    } catch (e) {
      // Fallback
    }
  }
  
  return [
    { title: `${unionName} · Add Member · Union Simple` },
    { name: 'description', content: `Add a new member to ${unionName}` },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = await createServerClient(request);
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

  // Verify user is admin of this union using server client
  const { data: unionCheck } = await supabase
    .from('unions')
    .select('created_by')
    .eq('id', unionBySlug.id)
    .single();
  
  const isAdmin = unionCheck?.created_by === user.id;
  
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ 
        currentUnion: unionBySlug, // Include union for meta tag
        error: 'You are not an admin of this union.' 
      }),
      { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
    );
  }

  return new Response(
    JSON.stringify({ currentUnion: unionBySlug }),
    { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
  );
}

export async function action({ request, params }: Route.ActionArgs) {
  const supabase = await createServerClient(request);
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

  // Verify user is admin of this union using server client
  const { data: unionCheck } = await supabase
    .from('unions')
    .select('created_by')
    .eq('id', unionBySlug.id)
    .single();
  
  const isAdmin = unionCheck?.created_by === user.id;
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'You are not an admin of this union' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  const formData = await request.formData();
  const memberData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    member_number: formData.get('member_number') as string || null,
    status: (formData.get('status') as string) || 'active',
    date_joined: formData.get('date_joined') as string || null,
    union_id: unionBySlug.id,
  };

  const { error } = await supabase
    .from('members')
    .insert([memberData]);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create member', details: error.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  return redirect(`/union/${params.slug}/members`);
}

export default function NewMember() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const loaderData = useLoaderData<typeof loader>();
  const currentUnion = loaderData?.currentUnion;
  const [unions, setUnions] = useState<Union[]>([]);
  const [selectedUnion, setSelectedUnion] = useState<Union | undefined>();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  // Fetch unions when user is available
  useEffect(() => {
    const fetchUnions = async () => {
      if (user && !loading) {
        try {
          const userUnions = await getUserUnions(user.id);
          setUnions(userUnions);
          
          // Find union by slug
          const unionBySlug = userUnions.find(u => u.slug === slug);
          if (unionBySlug) {
            setSelectedUnion(unionBySlug);
          }
        } catch (error) {
          console.error('Error fetching unions:', error);
        }
      }
    };
    fetchUnions();
  }, [user, loading, slug]);

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

  if (!currentUnion) {
    return (
      <div className="min-h-screen bg-warm-light flex">
        <DashboardSidebar unionSlug={slug} />
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
                        navigate(`/union/${union.slug}/members/new`);
                      }
                    }}
                  />
                  {user && <UserDropdown user={user} />}
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 overflow-y-auto bg-warm-light">
            <div className="px-4 sm:px-6 lg:px-8 py-8 md:py-8 pt-20 md:pt-8">
              <div className="bg-white rounded-lg border border-primary-200 p-6 sm:p-8 md:p-12 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4">
                  No Union Access
                </h2>
                <p className="text-sm sm:text-base text-primary-700 mb-6">
                  You need to be a union administrator to add members. Please create a union or ask to be added as an admin.
                </p>
                <Link
                  to="/onboarding"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium text-sm sm:text-base"
                >
                  Create Union
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-light flex">
      <DashboardSidebar unionSlug={slug} />
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
                      navigate(`/union/${union.slug}/members/new`);
                    }
                  }}
                />
                {user && <UserDropdown user={user} />}
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto bg-warm-light">
          <div className="px-4 sm:px-6 lg:px-8 py-8 md:py-8 pt-20 md:pt-8">
            <div className="mb-6 md:mb-8">
              <Link
                to={`/union/${slug}/members`}
                className="text-primary-600 hover:text-primary-900 text-sm font-medium mb-4 inline-block"
              >
                ← Back to Members
              </Link>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-900 mb-2">
                Add New Member
              </h1>
              <p className="text-sm sm:text-base text-primary-700">
                Enter the member's information below
              </p>
            </div>

            <div className="bg-white rounded-lg border border-primary-200 p-4 sm:p-6 md:p-8">
              <Form method="post">
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-primary-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        required
                        className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      />
                    </div>
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-primary-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        required
                        className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-primary-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="member_number" className="block text-sm font-medium text-primary-700 mb-2">
                        Member Number
                      </label>
                      <input
                        type="text"
                        id="member_number"
                        name="member_number"
                        className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-primary-700 mb-2">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        defaultValue="active"
                        className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="date_joined" className="block text-sm font-medium text-primary-700 mb-2">
                      Date Joined
                    </label>
                    <input
                      type="date"
                      id="date_joined"
                      name="date_joined"
                      className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                    <Link
                      to={`/union/${slug}/members`}
                      className="w-full sm:w-auto px-6 py-2 border border-primary-300 text-primary-700 rounded-md hover:bg-primary-50 transition text-center font-medium"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
                    >
                      Add Member
                    </button>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

