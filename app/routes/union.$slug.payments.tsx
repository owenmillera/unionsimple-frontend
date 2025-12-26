import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getUserUnions, type Union } from '../utils/unions';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { UserDropdown } from '../components/UserDropdown';
import { UnionDropdown } from '../components/UnionDropdown';
import { createClient as createServerClient } from '../utils/supabase/server';
import type { Route } from './+types/union.$slug.payments';

export function meta({ data }: Route.MetaArgs) {
  let unionName = 'Union';
  
  // Try to get union name from loader data
  if (data && typeof data === 'object' && data !== null) {
    try {
      const parsed = data as { unionName?: string };
      if (parsed.unionName && typeof parsed.unionName === 'string') {
        unionName = parsed.unionName;
      }
    } catch (e) {
      // Fallback
    }
  }
  
  return [
    { title: `${unionName} · Payments · Union Simple` },
    { name: 'description', content: `View ${unionName} payment history and dues` },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  // Fetch union name for meta
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
    JSON.stringify({ unionName }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export default function Payments() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
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
            navigate(`/union/${userUnions[0].slug}/payments`, { replace: true });
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
                      navigate(`/union/${union.slug}/payments`);
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

