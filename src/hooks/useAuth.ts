import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { auth } from '../lib/auth';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};