import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import type { Route } from './+types/settings';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Update User - Union Simple' },
    { name: 'description', content: 'Update your user information' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Don't require session in loader - let client-side handle it
  return new Response(
    JSON.stringify({}),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export default function Settings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  // Load user data when available
  useEffect(() => {
    if (user) {
      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    if (!firstName || !lastName || !email) {
      setError('First name, last name, and email are required');
      setSubmitting(false);
      return;
    }

    try {
      // Update user metadata and email using client-side Supabase
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
        email: email.trim(),
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update user information');
        setSubmitting(false);
        return;
      }

      if (data?.user) {
        setSuccess(true);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError('Failed to update user information');
        setSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setSubmitting(false);
    }
  };

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
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Settings Content */}
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg border border-primary-200 p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary-900 mb-2">
              Update User Information
            </h1>
            <p className="text-lg text-primary-700">
              Update your personal information and email address.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium text-green-800">
                User information updated successfully! Redirecting...
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
                htmlFor="first_name"
                className="block text-sm font-medium text-primary-900 mb-2"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                placeholder="John"
              />
            </div>

            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-primary-900 mb-2"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                placeholder="Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-primary-900 mb-2"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                placeholder="john.doe@example.com"
              />
              <p className="mt-2 text-sm text-primary-600">
                Note: Changing your email will require verification.
              </p>
            </div>

            <div className="pt-4 flex space-x-4">
              <button
                type="submit"
                disabled={submitting || success}
                className="flex-1 px-6 py-3 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : success ? 'Updated!' : 'Update Information'}
              </button>
              <Link
                to="/dashboard"
                className="px-6 py-3 border border-primary-300 text-primary-700 rounded-md hover:bg-primary-50 transition font-medium text-lg"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

