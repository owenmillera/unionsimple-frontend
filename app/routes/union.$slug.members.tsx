import { Link, useLoaderData, useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { createClient as createServerClient, getResponseHeaders } from '../utils/supabase/server';
import { getAdminUnions, isUnionAdmin, getUserUnions, type Union } from '../utils/unions';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { UserDropdown } from '../components/UserDropdown';
import { UnionDropdown } from '../components/UnionDropdown';
import type { Route } from './+types/union.$slug.members';

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
    { title: `${unionName} · Members · Union Simple` },
    { name: 'description', content: `Manage ${unionName} members` },
  ];
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  member_number: string | null;
  status: 'active' | 'inactive' | 'pending';
  date_joined: string | null;
  union_id: string | null;
  created_at: string;
  updated_at: string;
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
        members: [],
        adminUnions: [],
        currentUnion: unionBySlug, // Always include union for meta tag
        error: 'You are not an admin of this union.' 
      }),
      { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
    );
  }

  // Fetch members for this specific union
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .eq('union_id', unionBySlug.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching members:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch members', details: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
      }
    );
  }

  return new Response(
    JSON.stringify({ members: members || [], adminUnions: [unionBySlug], currentUnion: unionBySlug }),
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

  // Verify user is admin using server client
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
  const intent = formData.get('intent') as string;
  const id = formData.get('id') as string | null;

  if (intent === 'create') {
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

    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to create member', details: error.message }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, member: data }),
      { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
    );
  }

  if (intent === 'update' && id) {
    const memberData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      member_number: formData.get('member_number') as string || null,
      status: formData.get('status') as string,
      date_joined: formData.get('date_joined') as string || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('members')
      .update(memberData)
      .eq('id', id)
      .eq('union_id', unionBySlug.id) // Ensure member belongs to this union
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to update member', details: error.message }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, member: data }),
      { headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Invalid action' }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json', ...Object.fromEntries(responseHeaders) }
    }
  );
}

export default function Members() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const loaderData = useLoaderData<typeof loader>();
  const members = loaderData?.members || [];
  const adminUnions = loaderData?.adminUnions || [];
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
          } else if (userUnions.length > 0) {
            // If slug doesn't match, redirect to first union
            navigate(`/union/${userUnions[0].slug}/members`, { replace: true });
          }
        } catch (error) {
          console.error('Error fetching unions:', error);
        }
      }
    };
    fetchUnions();
  }, [user, loading, slug, navigate]);

  // Update selected union when slug changes
  useEffect(() => {
    if (slug && unions.length > 0) {
      const unionBySlug = unions.find(u => u.slug === slug);
      if (unionBySlug) {
        setSelectedUnion(unionBySlug);
      }
    }
  }, [slug, unions]);

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

  // Show message if user is not an admin
  if (adminUnions.length === 0) {
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
                        navigate(`/union/${union.slug}/members`);
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
              <div className="bg-white rounded-lg border border-primary-200 p-12 text-center">
                <h2 className="text-2xl font-bold text-primary-900 mb-4">
                  No Union Access
                </h2>
                <p className="text-primary-700 mb-6">
                  You need to be a union administrator to manage members. Please create a union or ask to be added as an admin.
                </p>
                <Link
                  to="/onboarding"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
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
                      navigate(`/union/${union.slug}/members`);
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-primary-900 mb-2">
              Members
            </h1>
            <p className="text-primary-700">
              Manage your union members
            </p>
          </div>
          <Link
            to={`/union/${slug}/members/new`}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
          >
            Add Member
          </Link>
        </div>

        {/* Members Table */}
        {members.length === 0 ? (
          <div className="bg-white rounded-lg border border-primary-200 p-12 text-center">
            <p className="text-primary-700 mb-4">No members yet.</p>
            <Link
              to={`/union/${slug}/members/new`}
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
            >
              Add Your First Member
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-primary-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-primary-200">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                      Member #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                      Date Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-primary-200">
                  {members.map((member: Member) => (
                    <tr key={member.id} className="hover:bg-primary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-900">
                          {member.first_name} {member.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-700">
                          {member.email || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-700">
                          {member.phone || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-700">
                          {member.member_number || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : member.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-700">
                          {member.date_joined
                            ? new Date(member.date_joined).toLocaleDateString()
                            : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/union/${slug}/members/${member.id}/edit`}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
}

