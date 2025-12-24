import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import type { Route } from './+types/dashboard';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dashboard - Union Simple' },
    { name: 'description', content: 'Your Union Simple dashboard' },
  ];
}

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
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
            <div className="flex items-center">
              <Link to="/" className="text-lg font-semibold text-primary-900">
                Union Simple
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-primary-700">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-primary-700 hover:text-primary-900 transition text-sm rounded-md"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Dashboard
          </h1>
          <p className="text-primary-700">
            Welcome back! You're successfully signed in.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-primary-200 p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-2">
              Members
            </h2>
            <p className="text-primary-700 text-sm">
              Manage your union members
            </p>
          </div>
          <div className="bg-white rounded-lg border border-primary-200 p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-2">
              Grievances
            </h2>
            <p className="text-primary-700 text-sm">
              Track and manage grievances
            </p>
          </div>
          <div className="bg-white rounded-lg border border-primary-200 p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-2">
              Payments
            </h2>
            <p className="text-primary-700 text-sm">
              View payment history and dues
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

