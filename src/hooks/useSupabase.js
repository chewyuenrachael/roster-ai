import { useState, useEffect, useCallback } from 'react';
import { supabase, auth, db, isSupabaseConfigured } from '../lib/supabase';

// ============ AUTH HOOK ============

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data } = await auth.getSession();
        setUser(data.session?.user ?? null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    const { data, error } = await auth.signIn(email, password);
    if (error) setError(error.message);
    setLoading(false);
    return { data, error };
  }, []);

  const signUp = useCallback(async (email, password, metadata = {}) => {
    setLoading(true);
    setError(null);
    const { data, error } = await auth.signUp(email, password, metadata);
    if (error) setError(error.message);
    setLoading(false);
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await auth.signOut();
    if (error) setError(error.message);
    setUser(null);
    setLoading(false);
  }, []);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    isConfigured: isSupabaseConfigured()
  };
}

// ============ DOCTORS HOOK ============

export function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await db.doctors.getAll();
    if (error) {
      setError(error.message);
    } else {
      setDoctors(data || []);
    }
    setLoading(false);
    return { data, error };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchDoctors();
    } else {
      setLoading(false);
    }
  }, [fetchDoctors]);

  const addDoctor = useCallback(async (doctor) => {
    const { data, error } = await db.doctors.create(doctor);
    if (!error && data) {
      setDoctors(prev => [...prev, data]);
    }
    return { data, error };
  }, []);

  const updateDoctor = useCallback(async (id, updates) => {
    const { data, error } = await db.doctors.update(id, updates);
    if (!error && data) {
      setDoctors(prev => prev.map(d => d.id === id ? data : d));
    }
    return { data, error };
  }, []);

  const removeDoctor = useCallback(async (id) => {
    const { error } = await db.doctors.delete(id);
    if (!error) {
      setDoctors(prev => prev.filter(d => d.id !== id));
    }
    return { error };
  }, []);

  return {
    doctors,
    loading,
    error,
    fetchDoctors,
    addDoctor,
    updateDoctor,
    removeDoctor,
    isConfigured: isSupabaseConfigured()
  };
}

// ============ REQUESTS HOOK ============

export function useRequests(year, month) {
  const [requests, setRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return { data: null, error: null };
    }
    
    setLoading(true);
    setError(null);
    const { data, error } = await db.requests.getByMonth(year, month);
    
    if (error) {
      setError(error.message);
    } else if (data) {
      // Transform array to { doctorId: { day: requestType } } format
      const grouped = {};
      data.forEach(req => {
        if (!grouped[req.doctor_id]) grouped[req.doctor_id] = {};
        const day = new Date(req.date).getDate();
        grouped[req.doctor_id][day] = req.request_type;
      });
      setRequests(grouped);
    }
    
    setLoading(false);
    return { data, error };
  }, [year, month]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const addRequest = useCallback(async (doctorId, date, requestType, notes = '') => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const { data, error } = await db.requests.create({
      doctor_id: doctorId,
      date: dateStr,
      request_type: requestType,
      notes
    });
    if (!error) {
      fetchRequests(); // Refresh
    }
    return { data, error };
  }, [fetchRequests]);

  const updateRequest = useCallback(async (id, updates) => {
    const { data, error } = await db.requests.update(id, updates);
    if (!error) {
      fetchRequests(); // Refresh
    }
    return { data, error };
  }, [fetchRequests]);

  const removeRequest = useCallback(async (id) => {
    const { error } = await db.requests.delete(id);
    if (!error) {
      fetchRequests(); // Refresh
    }
    return { error };
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    fetchRequests,
    addRequest,
    updateRequest,
    removeRequest,
    isConfigured: isSupabaseConfigured()
  };
}

// ============ ROSTERS HOOK ============

export function useRoster(year, month) {
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoster = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return { data: null, error: null };
    }
    
    setLoading(true);
    setError(null);
    const { data, error } = await db.rosters.getByMonth(year, month);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      setError(error.message);
    } else {
      setRoster(data);
    }
    
    setLoading(false);
    return { data, error };
  }, [year, month]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const saveRoster = useCallback(async (allocation, callPoints, status = 'draft') => {
    const { data, error } = await db.rosters.save(year, month, allocation, callPoints, status);
    if (!error && data) {
      setRoster(data);
    }
    return { data, error };
  }, [year, month]);

  const publishRoster = useCallback(async () => {
    const { data, error } = await db.rosters.publish(year, month);
    if (!error && data) {
      setRoster(data);
    }
    return { data, error };
  }, [year, month]);

  return {
    roster,
    loading,
    error,
    fetchRoster,
    saveRoster,
    publishRoster,
    isPublished: roster?.status === 'published',
    isConfigured: isSupabaseConfigured()
  };
}

// ============ HO TIERS HOOK ============

export function useHOTiers() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTiers = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return { data: null, error: null };
    }
    
    setLoading(true);
    setError(null);
    const { data, error } = await db.hoTiers.getAll();
    
    if (error) {
      setError(error.message);
    } else {
      setTiers(data || []);
    }
    
    setLoading(false);
    return { data, error };
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const updateTier = useCallback(async (tierKey, updates) => {
    const { data, error } = await db.hoTiers.update(tierKey, updates);
    if (!error && data) {
      setTiers(prev => prev.map(t => t.tier_key === tierKey ? data : t));
    }
    return { data, error };
  }, []);

  const saveTiers = useCallback(async (tiersConfig) => {
    const { data, error } = await db.hoTiers.saveAll(tiersConfig);
    if (!error && data) {
      setTiers(data);
    }
    return { data, error };
  }, []);

  // Convert to config object format for compatibility
  const tiersConfig = tiers.reduce((acc, tier) => {
    acc[tier.tier_key] = {
      enabled: tier.enabled,
      label: tier.label,
      description: tier.description,
      postCall: tier.post_call,
      color: tier.color,
      emoji: tier.emoji
    };
    return acc;
  }, {});

  return {
    tiers,
    tiersConfig,
    loading,
    error,
    fetchTiers,
    updateTier,
    saveTiers,
    isConfigured: isSupabaseConfigured()
  };
}

// ============ TEAMS HOOK ============

export function useTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeams = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return { data: null, error: null };
    }
    
    setLoading(true);
    setError(null);
    const { data, error } = await db.teams.getAll();
    
    if (error) {
      setError(error.message);
    } else {
      setTeams(data || []);
    }
    
    setLoading(false);
    return { data, error };
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const updateTeam = useCallback(async (teamKey, updates) => {
    const { data, error } = await db.teams.update(teamKey, updates);
    if (!error && data) {
      setTeams(prev => prev.map(t => t.team_key === teamKey ? data : t));
    }
    return { data, error };
  }, []);

  // Convert to minimum staffing object format
  const minStaffing = teams.reduce((acc, team) => {
    acc[team.team_key] = team.min_staffing;
    return acc;
  }, {});

  return {
    teams,
    minStaffing,
    loading,
    error,
    fetchTeams,
    updateTeam,
    isConfigured: isSupabaseConfigured()
  };
}

// ============ PUBLIC HOLIDAYS HOOK ============

export function useHolidays(year) {
  const [holidays, setHolidays] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHolidays = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return { data: null, error: null };
    }
    
    setLoading(true);
    setError(null);
    const { data, error } = await db.holidays.getByYear(year);
    
    if (error) {
      setError(error.message);
    } else if (data) {
      // Convert to { 'YYYY-MM-DD': 'Holiday Name' } format
      const holidayMap = {};
      data.forEach(h => {
        holidayMap[h.date] = h.name;
      });
      setHolidays(holidayMap);
    }
    
    setLoading(false);
    return { data, error };
  }, [year]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const addHoliday = useCallback(async (date, name) => {
    const { data, error } = await db.holidays.create({ date, name });
    if (!error) {
      fetchHolidays();
    }
    return { data, error };
  }, [fetchHolidays]);

  const removeHoliday = useCallback(async (id) => {
    const { error } = await db.holidays.delete(id);
    if (!error) {
      fetchHolidays();
    }
    return { error };
  }, [fetchHolidays]);

  return {
    holidays,
    loading,
    error,
    fetchHolidays,
    addHoliday,
    removeHoliday,
    isConfigured: isSupabaseConfigured()
  };
}

// ============ COMBINED DATA HOOK ============

export function useRosterData(year, month) {
  const doctors = useDoctors();
  const requests = useRequests(year, month);
  const roster = useRoster(year, month);
  const hoTiers = useHOTiers();
  const teams = useTeams();
  const holidays = useHolidays(year);

  const isLoading = 
    doctors.loading || 
    requests.loading || 
    roster.loading || 
    hoTiers.loading || 
    teams.loading || 
    holidays.loading;

  const isConfigured = isSupabaseConfigured();

  return {
    doctors,
    requests,
    roster,
    hoTiers,
    teams,
    holidays,
    isLoading,
    isConfigured
  };
}

export default {
  useAuth,
  useDoctors,
  useRequests,
  useRoster,
  useHOTiers,
  useTeams,
  useHolidays,
  useRosterData
};
