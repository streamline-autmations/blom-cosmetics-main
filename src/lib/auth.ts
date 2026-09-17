// Authentication utilities for BLOM Cosmetics
import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: any;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

class AuthService {
  private static instance: AuthService;
  private state: AuthState = {
    user: null,
    loading: true,
    error: null
  };
  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth() {
    console.log('AuthService: Initializing auth...');
    try {
      // Check if Supabase is properly configured
      if (!supabase || supabase.supabaseUrl === 'https://placeholder.supabase.co') {
        console.warn('Supabase not properly configured, authentication disabled');
        this.setState({ user: null, loading: false, error: 'Authentication service not configured' });
        return;
      }

      console.log('AuthService: Supabase configured, getting session...');
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        this.setState({ user: null, loading: false, error: error.message });
        return;
      }

      console.log('AuthService: Session retrieved:', session ? 'User found' : 'No user');
      this.setState({
        user: session?.user || null,
        loading: false,
        error: null
      });

      // Listen for auth changes including email confirmation redirects
      supabase.auth.onAuthStateChange((_event: string, session: any) => {
        console.log('AuthService: Auth state changed:', session ? 'User found' : 'No user');
        this.setState({
          user: session?.user || null,
          loading: false,
          error: null
        });
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.setState({ user: null, loading: false, error: 'Failed to initialize authentication' });
    }
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.state);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): AuthState {
    return { ...this.state };
  }

  async signInWithEmail(email: string, password: string, options?: { remember?: boolean }): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available' };
    }

    this.setState({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.setState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      // Store remember preference in localStorage
      if (options?.remember) {
        localStorage.setItem('blom_remember_user', 'true');
      } else {
        localStorage.removeItem('blom_remember_user');
      }

      this.setState({ user: data.user, loading: false, error: null });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      this.setState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available' };
    }

    this.setState({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`
        }
      });

      if (error) {
        this.setState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        this.setState({ loading: false, error: null });
        return { success: true, needsVerification: true };
      }

      this.setState({ user: data.user, loading: false, error: null });
      return { success: true, needsVerification: false };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      this.setState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      // Clear local state even if supabase is not available
      this.setState({ user: null, loading: false, error: null });
      localStorage.removeItem('blom_remember_user');
      return { success: true };
    }

    this.setState({ loading: true });

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        this.setState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      localStorage.removeItem('blom_remember_user');
      this.setState({ user: null, loading: false, error: null });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      this.setState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }

  requireAuth(): boolean {
    const { user, loading } = this.state;
    
    if (loading) {
      return false; // Still loading, don't redirect yet
    }
    
    if (!user) {
      // Redirect to login page
      window.location.href = '/login';
      return false;
    }
    
    return true;
  }

  formatMemberSince(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch (error) {
      return 'Unknown';
    }
  }
}

// Create global instance
export const authService = AuthService.getInstance();

// Make it available globally for compatibility
declare global {
  interface Window {
    supabaseAuth: AuthService;
  }
}

if (typeof window !== 'undefined') {
  window.supabaseAuth = authService;
}