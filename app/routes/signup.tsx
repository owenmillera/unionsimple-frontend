import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { getFirstUnionSlug } from '../utils/unions';
import { supabase } from '../utils/supabase';
import type { Route } from './+types/signup';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sign Up - Union Simple' },
    { name: 'description', content: 'Create your Union Simple account' },
  ];
}

export default function SignUp() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const redirectToDashboard = async () => {
      // Only redirect if user is confirmed (has email_confirmed_at)
      if (user && user.email_confirmed_at) {
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
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const result = await signUp(email, password);

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else {
      setLoading(false);
      
      // Check if user was automatically signed in (email confirmation disabled)
      // or if email confirmation is required
      if (result.data?.session) {
        // User is automatically signed in (email confirmation disabled)
        setSuccess(true);
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(async () => {
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
        }, 1500);
      } else {
        // No session means email confirmation is required
        // Show message to check email
        setSuccess(true);
        setSuccessMessage('Account created! Please check your email to confirm your account before signing in.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-warm-light flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg border border-primary-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              Create an account
            </h1>
            <p className="text-primary-700">
              Get started with Union Simple today
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">
                {successMessage}
              </p>
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
                minLength={6}
                className="w-full px-4 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-primary-600">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-primary-900 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-primary-700">
              Already have an account?{' '}
              <Link
                to="/signin"
                className="text-primary-900 font-medium hover:text-primary-950"
              >
                Sign in
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

