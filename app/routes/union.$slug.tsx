import { Link, useNavigate, useLocation, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getUserUnions, type Union } from '../utils/unions';
import { UserDropdown } from '../components/UserDropdown';
import { UnionDropdown } from '../components/UnionDropdown';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { createClient as createServerClient } from '../utils/supabase/server';
import type { Route } from './+types/union.$slug';

export function meta({ data }: Route.MetaArgs) {
  let unionName = 'Union';
  
  // Try to get union name from loader data
  // In React Router v7, loader data should be automatically parsed from JSON responses
  if (data && typeof data === 'object' && data !== null) {
    try {
      // If data is a parsed object
      const parsed = data as { unionName?: string | null };
      if (parsed.unionName && typeof parsed.unionName === 'string') {
        unionName = parsed.unionName; // Use exact casing from database
      }
    } catch (e) {
      // Fallback to default
    }
  }
  
  return [
    { title: `${unionName} · Home · Union Simple` },
    { name: 'description', content: `${unionName} dashboard - Union Simple` },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  // Don't require session in loader - let client-side handle it
  // This prevents issues when session is in localStorage
  // But we can still fetch union data for SEO
  let unionName: string | null = null;
  
  try {
    const supabase = await createServerClient(request);
    const { data: union } = await supabase
      .from('unions')
      .select('name')
      .eq('slug', params.slug)
      .single();
    
    if (union?.name) {
      unionName = union.name; // Preserve exact casing from database
    }
  } catch (error) {
    // Silently fail - union name is optional for meta
  }
  
  return new Response(
    JSON.stringify({ slug: params.slug, unionName }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}


export default function UnionDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [unions, setUnions] = useState<Union[]>([]);
  const [unionsLoading, setUnionsLoading] = useState(true);
  const [selectedUnion, setSelectedUnion] = useState<Union | undefined>();
  const [currentUnionSlug, setCurrentUnionSlug] = useState<string | undefined>(slug);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  // Fetch unions when user is available
  useEffect(() => {
    const fetchUnions = async () => {
      if (user && !loading) {
        setUnionsLoading(true);
        try {
          const userUnions = await getUserUnions(user.id);
          setUnions(userUnions);
          
          // Find union by slug
          const unionBySlug = userUnions.find(u => u.slug === slug);
          if (unionBySlug) {
            setSelectedUnion(unionBySlug);
            setCurrentUnionSlug(unionBySlug.slug);
          } else if (userUnions.length > 0) {
            // If slug doesn't match, redirect to first union
            navigate(`/union/${userUnions[0].slug}`, { replace: true });
          }
        } catch (error) {
          console.error('Error fetching unions:', error);
        } finally {
          setUnionsLoading(false);
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
        setCurrentUnionSlug(unionBySlug.slug);
      }
    }
  }, [slug, unions]);

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

  const location = useLocation();
  const isHome = location.pathname === `/union/${currentUnionSlug}` || 
    (location.pathname.startsWith(`/union/${currentUnionSlug}`) && !location.pathname.includes('/grievances') && !location.pathname.includes('/payments'));

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
            {isHome ? (
              <div>
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-primary-900 mb-2">
                    Home
                  </h1>
                  <p className="text-primary-700">
                    Welcome to your union dashboard.
                  </p>
                </div>
                {/* Home content will go here */}
              </div>
            ) : (
              <div>
                {/* Other sections will render here based on route */}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

