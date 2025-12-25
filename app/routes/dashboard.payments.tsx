import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getUserUnions, type Union } from '../utils/unions';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { UserDropdown } from '../components/UserDropdown';
import { UnionDropdown } from '../components/UnionDropdown';
import type { Route } from './+types/dashboard.payments';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Payments - Union Simple' },
    { name: 'description', content: 'View payment history and dues' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  return new Response(
    JSON.stringify({}),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export default function Payments() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [unions, setUnions] = useState<Union[]>([]);
  const [selectedUnionId, setSelectedUnionId] = useState<string | undefined>();

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
          if (userUnions.length > 0 && !selectedUnionId) {
            setSelectedUnionId(userUnions[0].id);
          }
        } catch (error) {
          console.error('Error fetching unions:', error);
        }
      }
    };
    fetchUnions();
  }, [user, loading]);

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
    <div className="min-h-screen bg-warm-light flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="bg-white border-b border-primary-200">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex-1"></div>
              <div className="flex items-center space-x-4">
                <UnionDropdown 
                  unions={unions} 
                  currentUnionId={selectedUnionId}
                  onUnionSelect={setSelectedUnionId}
                />
                {user && <UserDropdown user={user} />}
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 overflow-y-auto bg-warm-light">
          <div className="px-6 lg:px-8 py-8 md:py-8 pt-20 md:pt-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-primary-900 mb-2">
                Payments
              </h1>
              <p className="text-primary-700">
                View payment history and dues
              </p>
            </div>
            {/* Payments content will go here */}
          </div>
        </main>
      </div>
    </div>
  );
}

