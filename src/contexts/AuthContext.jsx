import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }

        const { data } = await auth.getSession();
        const currentUser = data.session?.user ?? null;
        setUser(currentUser);

        // Fetch doctor profile if user exists
        if (currentUser) {
          await fetchDoctorProfile(currentUser.email);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchDoctorProfile(currentUser.email);
        } else {
          setDoctorProfile(null);
        }
      });

      return () => subscription?.unsubscribe();
    }
  }, []);

  // Fetch doctor profile from database
  const fetchDoctorProfile = async (email) => {
    if (!isSupabaseConfigured() || !email) return;

    try {
      const { data: doctors } = await db.doctors.getAll();
      const profile = doctors?.find(d => d.email === email);
      setDoctorProfile(profile || null);
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
    }
  };

  // Sign in
  const signIn = async (email, password) => {
    setError(null);
    const { data, error } = await auth.signIn(email, password);
    if (error) {
      setError(error.message);
      return { error };
    }
    return { data };
  };

  // Sign up
  const signUp = async (email, password, metadata = {}) => {
    setError(null);
    const { data, error } = await auth.signUp(email, password, metadata);
    if (error) {
      setError(error.message);
      return { error };
    }
    return { data };
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    const { error } = await auth.signOut();
    if (error) {
      setError(error.message);
    }
    setUser(null);
    setDoctorProfile(null);
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!doctorProfile) return false;
    if (role === 'doctor') return true; // Everyone is at least a doctor
    return doctorProfile.role === role || doctorProfile.role === 'admin';
  };

  const value = {
    user,
    doctorProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAuthenticated: !!user,
    isAdmin: hasRole('admin'),
    isRosterAdmin: hasRole('roster_admin'),
    isConfigured: isSupabaseConfigured()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
