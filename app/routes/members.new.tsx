import { Form, Link, useNavigate, redirect, useLoaderData } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { getAdminUnions, isUnionAdmin } from '../utils/unions';
import type { Route } from './+types/members.new';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Add Member - Union Simple' },
    { name: 'description', content: 'Add a new union member' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
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

  const adminUnions = await getAdminUnions(session.user.id);
  
  if (adminUnions.length === 0) {
    return new Response(
      JSON.stringify({ 
        adminUnions: [],
        error: 'You are not an admin of any union. Please create or join a union first.' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ adminUnions }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export async function action({ request }: Route.ActionArgs) {
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

  const formData = await request.formData();
  const unionId = formData.get('union_id') as string;
  
  if (!unionId) {
    return new Response(
      JSON.stringify({ error: 'Union is required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Verify user is admin of this union
  const isAdmin = await isUnionAdmin(session.user.id, unionId);
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'You are not an admin of this union' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const memberData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    member_number: formData.get('member_number') as string || null,
    status: (formData.get('status') as string) || 'active',
    date_joined: formData.get('date_joined') as string || null,
    union_id: unionId,
  };

  const { error } = await supabase
    .from('members')
    .insert([memberData]);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create member', details: error.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return redirect('/members');
}

export default function NewMember() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const adminUnions = loaderData?.adminUnions || [];

  useEffect(() => {
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

  if (adminUnions.length === 0) {
    return (
      <div className="min-h-screen bg-warm-light">
        <nav className="bg-white border-b border-primary-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-6">
                <Link to="/dashboard" className="text-lg font-semibold text-primary-900">
                  Union Simple
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-primary-700">{user.email}</span>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-primary-700 hover:text-primary-900 transition text-sm rounded-md"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg border border-primary-200 p-12 text-center">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              No Union Access
            </h2>
            <p className="text-primary-700 mb-6">
              You need to be a union administrator to add members. Please create a union or ask to be added as an admin.
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-light">
      {/* Navigation */}
      <nav className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="text-lg font-semibold text-primary-900">
                Union Simple
              </Link>
              <Link 
                to="/members" 
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
                to="/dashboard"
                className="px-4 py-2 text-primary-700 hover:text-primary-900 transition text-sm rounded-md"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            to="/members"
            className="text-primary-600 hover:text-primary-900 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Members
          </Link>
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Add New Member
          </h1>
          <p className="text-primary-700">
            Enter the member's information below
          </p>
        </div>

        <div className="bg-white rounded-lg border border-primary-200 p-8">
          <Form method="post">
            <div className="space-y-6">
              {/* Union Selection */}
              {adminUnions.length > 1 ? (
                <div>
                  <label htmlFor="union_id" className="block text-sm font-medium text-primary-700 mb-2">
                    Union <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="union_id"
                    name="union_id"
                    required
                    className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a union</option>
                    {adminUnions.map((union) => (
                      <option key={union.id} value={union.id}>
                        {union.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input type="hidden" name="union_id" value={adminUnions[0]?.id || ''} />
              )}
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
                    defaultValue="active"
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
                  className="w-full px-4 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Link
                  to="/members"
                  className="px-6 py-2 border border-primary-300 text-primary-700 rounded-md hover:bg-primary-50 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
                >
                  Add Member
                </button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

