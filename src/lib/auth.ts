// Simple Authentication System
import { localDB, User } from './localStorage';

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
    
    // Call immediately with current state
    callback(localDB.getCurrentUser());
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
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

      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (existingUsers.find((u: any) => u.email === email)) {
        return { error: 'Bu e-posta adresi zaten kayıtlı' };
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        email,
        language: 'tr',
        theme: 'light',
        created_at: new Date().toISOString()
      };

      // Save user to users list
      existingUsers.push({ ...newUser, password });
      localStorage.setItem('users', JSON.stringify(existingUsers));

      // Set as current user
      localDB.setCurrentUser(newUser);
      this.notifyListeners(newUser);

      return { user: newUser };
    } catch (error) {
      return { error: 'Kayıt işlemi başarısız oldu' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      // Validate input
      if (!email || !password) {
        return { error: 'Email ve şifre gereklidir' };
      }

      // Find user
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = existingUsers.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        return { error: 'E-posta veya şifre hatalı' };
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;
      
      // Set as current user
      localDB.setCurrentUser(userWithoutPassword);
      this.notifyListeners(userWithoutPassword);

      return { user: userWithoutPassword };
    } catch (error) {
      return { error: 'Giriş işlemi başarısız oldu' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    try {
      localDB.signOut();
      this.notifyListeners(null);
      return {};
    } catch (error) {
      return { error: 'Çıkış işlemi başarısız oldu' };
    }
  }

  getCurrentUser(): User | null {
    return localDB.getCurrentUser();
  }

  async updateUser(updates: Partial<User>): Promise<AuthResult> {
    try {
      const currentUser = localDB.getCurrentUser();
      if (!currentUser) {
        return { error: 'Kullanıcı oturumu bulunamadı' };
      }

      const updatedUser = { ...currentUser, ...updates };
      
      // Update in users list
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === currentUser.id);
      
      if (userIndex > -1) {
        existingUsers[userIndex] = { ...existingUsers[userIndex], ...updates };
        localStorage.setItem('users', JSON.stringify(existingUsers));
      }

      // Update current user
      localDB.setCurrentUser(updatedUser);
      this.notifyListeners(updatedUser);

      return { user: updatedUser };
    } catch (error) {
      return { error: 'Profil güncelleme başarısız oldu' };
    }
  }
}

export const auth = AuthManager.getInstance();

// Export functions for compatibility
export const signUp = (email: string, password: string) => auth.signUp(email, password);
export const signIn = (email: string, password: string) => auth.signIn(email, password);
export const signOut = () => auth.signOut();