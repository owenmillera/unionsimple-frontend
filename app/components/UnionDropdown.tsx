import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Union } from '../utils/unions';

interface UnionDropdownProps {
  unions: Union[];
  currentUnionId?: string;
  onUnionSelect?: (unionId: string) => void;
}

export function UnionDropdown({ unions, currentUnionId, onUnionSelect }: UnionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get current union name or default
  const currentUnion = unions.find(u => u.id === currentUnionId) || unions[0];
  const displayName = currentUnion?.name || (unions.length > 0 ? 'Select Union' : 'No Unions');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUnionSelect = (union: Union) => {
    if (onUnionSelect) {
      onUnionSelect(union.id);
    }
    // Navigate to the union's dashboard using slug
    navigate(`/union/${union.slug}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-primary-900 font-medium hover:text-primary-700 transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
      >
        <span>{displayName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-primary-200 z-50 max-h-96 overflow-y-auto">
          <div className="py-1">
            {unions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-primary-600">
                No unions yet
              </div>
            ) : (
              unions.map((union) => (
                <button
                  key={union.id}
                  onClick={() => handleUnionSelect(union)}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    union.id === currentUnionId
                      ? 'bg-primary-50 text-primary-900 font-medium'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{union.name}</span>
                    {union.id === currentUnionId && (
                      <span className="text-primary-600">✓</span>
                    )}
                  </div>
                </button>
              ))
            )}
            <div className="border-t border-primary-200 mt-1">
              <Link
                to="/onboarding"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 transition"
              >
                + Create New Union
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

