import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

interface AuthResult {
  user?: User;
  error?: string;
}

class AuthManager {
  private static instance: AuthManager;
  private listeners: ((user: User | null) => void)[] = [];

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    
    // Get current session and call immediately
    this.getCurrentUser().then(user => callback(user));
    
    // Subscribe to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      this.notifyListeners(user);
    });
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
      subscription.unsubscribe();
    };
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach(callback => callback(user));
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      // Validate input
      if (!email || !password) {
        return { error: 'Email ve şifre gereklidir' };
      }

      if (password.length < 6) {
        return { error: 'Şifre en az 6 karakter olmalıdır' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Create user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            language: 'tr',
            theme: 'light'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return { user: data.user };
    } catch (error: any) {
      return { error: error.message || 'Kayıt işlemi başarısız oldu' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      // Validate input
      if (!email || !password) {
        return { error: 'Email ve şifre gereklidir' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { user: data.user };
    } catch (error: any) {
      return { error: error.message || 'Giriş işlemi başarısız oldu' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (error: any) {
      return { error: error.message || 'Çıkış işlemi başarısız oldu' };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateUser(updates: Partial<User>): Promise<AuthResult> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { error: 'Kullanıcı oturumu bulunamadı' };
      }

      // Update auth user if email is being changed
      if (updates.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: updates.email
        });
        
        if (authError) {
          return { error: authError.message };
        }
      }

      // Update user profile in users table
      const profileUpdates: any = {};
      if (updates.user_metadata?.full_name !== undefined) {
        profileUpdates.full_name = updates.user_metadata.full_name;
      }
      if (updates.user_metadata?.language !== undefined) {
        profileUpdates.language = updates.user_metadata.language;
      }
      if (updates.user_metadata?.theme !== undefined) {
        profileUpdates.theme = updates.user_metadata.theme;
      }
      if (updates.user_metadata?.avatar_url !== undefined) {
        profileUpdates.avatar_url = updates.user_metadata.avatar_url;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('users')
          .update(profileUpdates)
          .eq('id', currentUser.id);

        if (profileError) {
          return { error: profileError.message };
        }
      }

      // Get updated user
      const updatedUser = await this.getCurrentUser();
      return { user: updatedUser };
    } catch (error: any) {
      return { error: error.message || 'Profil güncelleme başarısız oldu' };
    }
  }
}

export const auth = AuthManager.getInstance();

// Export functions for compatibility
export const signUp = (email: string, password: string) => auth.signUp(email, password);
export const signIn = (email: string, password: string) => auth.signIn(email, password);
export const signOut = () => auth.signOut();