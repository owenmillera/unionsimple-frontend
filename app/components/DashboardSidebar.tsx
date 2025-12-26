import { Link, useLocation } from 'react-router';
import { useState } from 'react';

interface SidebarItem {
  name: string;
  getHref: (slug: string | undefined) => string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  unionSlug?: string;
}

const getNavigation = (slug: string | undefined): Array<{ name: string; href: string; icon: React.ReactNode }> => {
  const basePath = slug ? `/union/${slug}` : '/dashboard';
  return [
    {
      name: 'Home',
      href: basePath,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Members',
      href: slug ? `/union/${slug}/members` : '/members',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Grievances',
      href: `${basePath}/grievances`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Payments',
      href: `${basePath}/payments`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];
};

export function DashboardSidebar({ unionSlug }: DashboardSidebarProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigation = getNavigation(unionSlug);

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-primary-200 h-16 flex items-center px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-primary-700 hover:text-primary-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="ml-4 text-lg font-semibold text-primary-900">
          Union Simple
        </Link>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static top-0 bottom-0 left-0 h-screen md:h-auto z-40 md:z-auto md:flex md:flex-shrink-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col w-64 h-full">
          <div className="flex flex-col h-full bg-white border-r border-primary-200">
            {/* Header */}
            <div className="flex items-center flex-shrink-0 px-4 pt-5 pb-4">
              <Link to="/" className="text-xl font-semibold text-primary-900">
                Union Simple
              </Link>
            </div>
            
            {/* Scrollable Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 pt-2 space-y-1">
              {navigation.map((item) => {
                const basePath = unionSlug ? `/union/${unionSlug}` : '/dashboard';
                const isActive = location.pathname === item.href || 
                  (item.href === basePath && location.pathname.startsWith(basePath) && !location.pathname.includes('/grievances') && !location.pathname.includes('/payments'));
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-900'
                        : 'text-primary-700 hover:bg-primary-50 hover:text-primary-900'
                    }`}
                  >
                    <span className={`mr-3 ${isActive ? 'text-primary-600' : 'text-primary-400 group-hover:text-primary-500'}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            {/* Settings - Always at bottom */}
            <div className="flex-shrink-0 px-2 pb-4 pt-2 border-t border-primary-200">
              <Link
                to={unionSlug ? `/union/${unionSlug}/settings` : '/settings'}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                  location.pathname === (unionSlug ? `/union/${unionSlug}/settings` : '/settings')
                    ? 'bg-primary-50 text-primary-900'
                    : 'text-primary-700 hover:bg-primary-50 hover:text-primary-900'
                }`}
              >
                <span className={`mr-3 ${location.pathname === (unionSlug ? `/union/${unionSlug}/settings` : '/settings') ? 'text-primary-600' : 'text-primary-400 group-hover:text-primary-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

