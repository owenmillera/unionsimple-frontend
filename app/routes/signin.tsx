import { Form, Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { getFirstUnionSlug } from '../utils/unions';
import { supabase } from '../utils/supabase';
import type { Route } from './+types/signin';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sign In - Union Simple' },
    { name: 'description', content: 'Sign in to your Union Simple account' },
  ];
}

export default function SignIn() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const redirectToDashboard = async () => {
      if (user) {
        const slug = await getFirstUnionSlug(user.id);
        if (slug) {
          navigate(`/union/${slug}`);
        } else {
          navigate('/onboarding');
        }
      }
    };
    redirectToDashboard();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Get the user's first union slug
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser) {
        const slug = await getFirstUnionSlug(signedInUser.id);
        if (slug) {
          navigate(`/union/${slug}`);
        } else {
          navigate('/onboarding');
        }
      } else {
        navigate('/onboarding');
      }
    }
  };

  return (
    <div className="min-h-screen bg-warm-light flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg border border-primary-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              Welcome back
            </h1>
            <p className="text-primary-700">
              Sign in to your Union Simple account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-primary-900 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-primary-900 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-primary-700">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary-900 font-medium hover:text-primary-950"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-sm text-primary-600 hover:text-primary-900"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

