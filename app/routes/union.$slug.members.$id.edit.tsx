import { Form, Link, useLoaderData, useNavigate, useActionData, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { isUnionAdmin } from '../utils/unions';
import type { Route } from './+types/union.$slug.members.$id.edit';
import type { Member } from './union.$slug.members';

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
    { title: `${unionName} · Edit Member · Union Simple` },
    { name: 'description', content: `Edit member information for ${unionName}` },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const { id, slug } = params;

  // Get union by slug first
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
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .eq('union_id', unionBySlug.id)
    .single();

  if (error || !member) {
    return new Response(
      JSON.stringify({ error: 'Member not found', details: error?.message }),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Check if user is admin of this member's union
  const isAdmin = await isUnionAdmin(session.user.id, unionBySlug.id);
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'You are not authorized to edit this member' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({ member, currentUnion: unionBySlug }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export async function action({ request, params }: Route.ActionArgs) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const { id, slug } = params;

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
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // First, get the member to verify it belongs to this union
  const { data: existingMember } = await supabase
    .from('members')
    .select('union_id')
    .eq('id', id)
    .eq('union_id', unionBySlug.id)
    .single();

  if (!existingMember) {
    return new Response(
      JSON.stringify({ error: 'Member not found' }),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Verify user is admin of this union
  const isAdmin = await isUnionAdmin(session.user.id, unionBySlug.id);
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'You are not authorized to edit this member' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
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
    status: formData.get('status') as string,
    date_joined: formData.get('date_joined') as string || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('members')
    .update(memberData)
    .eq('id', id)
    .eq('union_id', unionBySlug.id)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update member', details: error.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, member: data }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export default function EditMember() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const member = loaderData?.member as Member | undefined;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  // Handle successful form submission
  useEffect(() => {
    if (actionData?.success) {
      navigate(`/union/${slug}/members`);
    }
  }, [actionData, navigate, slug]);

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

  if (!member) {
    return (
      <div className="min-h-screen bg-warm-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-900 mb-2">Member not found</h1>
          <Link to={`/union/${slug}/members`} className="text-primary-600 hover:text-primary-900">
            ← Back to Members
          </Link>
        </div>
      </div>
    );
  }

  // Format date for input field (YYYY-MM-DD)
  const dateJoined = member.date_joined
    ? new Date(member.date_joined).toISOString().split('T')[0]
    : '';

  return (
    <div className="min-h-screen bg-warm-light">
      {/* Navigation */}
      <nav className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-lg font-semibold text-primary-900">
                Union Simple
              </Link>
              <Link 
                to={`/union/${slug}/members`} 
                className="text-sm font-medium text-primary-600 hover:text-primary-900"
              >
                Members
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-primary-700">
                {user.email}
              </span>
              <Link
                to={`/union/${slug}/members`}
                className="px-4 py-2 text-primary-700 hover:text-primary-900 transition text-sm rounded-md"
              >
                Members
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            to={`/union/${slug}/members`}
            className="text-primary-600 hover:text-primary-900 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Members
          </Link>
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Edit Member
          </h1>
          <p className="text-primary-700">
            Update member information
          </p>
        </div>

        {/* Error Message */}
        {actionData?.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {actionData.error}
            {actionData.details && (
              <p className="text-sm mt-1">{actionData.details}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg border border-primary-200 p-8">
          <Form method="post">
            <input type="hidden" name="intent" value="update" />
            <input type="hidden" name="id" value={member.id} />
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-primary-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    required
                    defaultValue={member.first_name}
                    className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    defaultValue={member.last_name}
                    className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={member.email || ''}
                    className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    defaultValue={member.phone || ''}
                    className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="member_number" className="block text-sm font-medium text-primary-700 mb-2">
                    Member Number
                  </label>
                  <input
                    type="text"
                    id="member_number"
                    name="member_number"
                    defaultValue={member.member_number || ''}
                    className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-primary-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={member.status}
                    className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  defaultValue={dateJoined}
                  className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Link
                  to={`/union/${slug}/members`}
                  className="px-6 py-2 border border-primary-300 text-primary-700 rounded-md hover:bg-primary-50 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

