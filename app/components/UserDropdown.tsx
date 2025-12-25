import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface UserDropdownProps {
  user: {
    email?: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Get user initials
  const getInitials = () => {
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    // Fallback to email initials
    if (user.email) {
      const emailParts = user.email.split('@')[0];
      const parts = emailParts.split('.');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return emailParts.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
    setIsOpen(false);
  };

  const handleUpdateUser = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  // Get display name (name if available, otherwise email)
  const getDisplayName = () => {
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return user.email || 'User';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="User menu"
      >
        {getInitials()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-primary-200 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-primary-700 border-b border-primary-200">
              <p className="font-medium truncate" title={getDisplayName()}>
                {getDisplayName()}
              </p>
              {user.email && (user.user_metadata?.first_name || user.user_metadata?.last_name) && (
                <p className="text-xs text-primary-500 truncate mt-1" title={user.email}>
                  {user.email}
                </p>
              )}
            </div>
            <button
              onClick={handleUpdateUser}
              className="w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 transition"
            >
              Update User
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

