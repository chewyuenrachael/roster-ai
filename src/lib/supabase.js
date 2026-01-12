import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials not configured. Running in demo mode.\n' +
    'To enable database features, create a .env file with:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;

// ============ AUTH FUNCTIONS ============

export const auth = {
  // Sign up a new user
  signUp: async (email, password, metadata = {}) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata // { name, team, role }
      }
    });
    return { data, error };
  },

  // Sign in existing user
  signIn: async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getUser: async () => {
    if (!supabase) return { data: { user: null } };
    
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  // Get current session
  getSession: async () => {
    if (!supabase) return { data: { session: null } };
    
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    
    return supabase.auth.onAuthStateChange(callback);
  }
};

// ============ DATABASE FUNCTIONS ============

export const db = {
  // ---- DOCTORS ----
  doctors: {
    getAll: async () => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');
      return { data, error };
    },

    getById: async (id) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    create: async (doctor) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('doctors')
        .insert(doctor)
        .select()
        .single();
      return { data, error };
    },

    update: async (id, updates) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    delete: async (id) => {
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);
      return { error };
    }
  },

  // ---- REQUESTS (AL, CB, CR) ----
  requests: {
    getByMonth: async (year, month) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
      
      const { data, error } = await supabase
        .from('requests')
        .select('*, doctors(name, team)')
        .gte('date', startDate)
        .lte('date', endDate);
      return { data, error };
    },

    getByDoctor: async (doctorId) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('date');
      return { data, error };
    },

    create: async (request) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('requests')
        .insert(request)
        .select()
        .single();
      return { data, error };
    },

    update: async (id, updates) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    delete: async (id) => {
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id);
      return { error };
    },

    // Bulk upsert for a doctor's requests
    upsertForDoctor: async (doctorId, year, month, requests) => {
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      // Delete existing requests for this doctor/month
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
      
      await supabase
        .from('requests')
        .delete()
        .eq('doctor_id', doctorId)
        .gte('date', startDate)
        .lte('date', endDate);
      
      // Insert new requests
      if (requests.length > 0) {
        const { data, error } = await supabase
          .from('requests')
          .insert(requests)
          .select();
        return { data, error };
      }
      return { data: [], error: null };
    }
  },

  // ---- ROSTERS ----
  rosters: {
    getByMonth: async (year, month) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('rosters')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .single();
      return { data, error };
    },

    save: async (year, month, allocation, callPoints, status = 'draft') => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('rosters')
        .upsert({
          year,
          month,
          allocation,
          call_points: callPoints,
          status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'year,month'
        })
        .select()
        .single();
      return { data, error };
    },

    publish: async (year, month) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('rosters')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('year', year)
        .eq('month', month)
        .select()
        .single();
      return { data, error };
    },

    getPublished: async () => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('rosters')
        .select('*')
        .eq('status', 'published')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      return { data, error };
    }
  },

  // ---- HO TIER CONFIGURATION ----
  hoTiers: {
    getAll: async () => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('ho_tiers')
        .select('*')
        .order('tier_key');
      return { data, error };
    },

    update: async (tierKey, updates) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('ho_tiers')
        .update(updates)
        .eq('tier_key', tierKey)
        .select()
        .single();
      return { data, error };
    },

    // Save all tier configurations
    saveAll: async (tiers) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('ho_tiers')
        .upsert(tiers, { onConflict: 'tier_key' })
        .select();
      return { data, error };
    }
  },

  // ---- TEAMS ----
  teams: {
    getAll: async () => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      return { data, error };
    },

    update: async (teamKey, updates) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('team_key', teamKey)
        .select()
        .single();
      return { data, error };
    }
  },

  // ---- PUBLIC HOLIDAYS ----
  holidays: {
    getByYear: async (year) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('public_holidays')
        .select('*')
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)
        .order('date');
      return { data, error };
    },

    create: async (holiday) => {
      if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase
        .from('public_holidays')
        .insert(holiday)
        .select()
        .single();
      return { data, error };
    },

    delete: async (id) => {
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      const { error } = await supabase
        .from('public_holidays')
        .delete()
        .eq('id', id);
      return { error };
    }
  }
};

export default supabase;
