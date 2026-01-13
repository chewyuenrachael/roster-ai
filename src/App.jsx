import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Users, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Sparkles, Eye, TrendingUp, Award, Shield, Zap, Info, Filter, BarChart3, Lightbulb, Search, Copy, ArrowDown, Clock, UserCheck, Coffee, Pill, Building2, CalendarDays, User, LogIn, LogOut, Settings, Database } from 'lucide-react';
import { useAuthContext } from './contexts/AuthContext';
import { db, isSupabaseConfigured } from './lib/supabase';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';

// ============ CONFIGURATION ============

// Configurable HO Tiers (1-11) - Medical palette colors
const HO_TIERS_CONFIG = {
  'HO1': { enabled: true, label: 'HO1', description: 'Active On-Call', postCall: true, color: '#C46A6A', emoji: '🔴' },
  'HO2': { enabled: true, label: 'HO2', description: 'Passive On-Call', postCall: true, color: '#B8866B', emoji: '🟠' },
  'HO3': { enabled: true, label: 'HO3', description: 'Handover HO', postCall: false, color: '#D6B656', emoji: '🟡' },
  'HO4': { enabled: true, label: 'HO4', description: 'Additional Coverage', postCall: false, color: '#7FAE9A', emoji: '🟢' },
  'HO5': { enabled: false, label: 'HO5', description: 'Custom Role 5', postCall: false, color: '#8AA1B4', emoji: '🔵' },
  'HO6': { enabled: false, label: 'HO6', description: 'Custom Role 6', postCall: false, color: '#9A8ABF', emoji: '🟣' },
  'HO7': { enabled: false, label: 'HO7', description: 'Custom Role 7', postCall: false, color: '#C48A9A', emoji: '💗' },
  'HO8': { enabled: false, label: 'HO8', description: 'Custom Role 8', postCall: false, color: '#6B9A8A', emoji: '💚' },
  'HO9': { enabled: false, label: 'HO9', description: 'Custom Role 9', postCall: false, color: '#B07A7A', emoji: '❤️' },
  'HO10': { enabled: false, label: 'HO10', description: 'Custom Role 10', postCall: false, color: '#7A7AAE', emoji: '💜' },
  'HO11': { enabled: false, label: 'HO11', description: 'Custom Role 11', postCall: false, color: '#5A8A9A', emoji: '💙' },
};

// Get enabled HO tiers
const getEnabledHOTiers = () => Object.entries(HO_TIERS_CONFIG).filter(([_, config]) => config.enabled).map(([key]) => key);

// Call Point System
const CALL_POINTS = {};
Object.keys(HO_TIERS_CONFIG).forEach(tier => {
  const config = HO_TIERS_CONFIG[tier];
  if (config.enabled) {
    CALL_POINTS[tier] = config.postCall 
      ? { monThu: 1.0, friday: 1.5, saturday: 2.5, sunday: 2.0 }
      : { monThu: 0.5, friday: 0.75, saturday: 1.25, sunday: 1.0 };
  }
});

// Shift types and colors - Medical palette
const SHIFT_TYPES = {
  ...Object.fromEntries(
    Object.entries(HO_TIERS_CONFIG).map(([key, config]) => [
      key, 
      { label: config.label, color: config.color, textColor: '#fff', description: config.description, category: 'call' }
    ])
  ),
  'PC': { label: 'PC', color: '#6B9A8A', textColor: '#fff', description: 'Post-Call', category: 'rest' },
  'AL': { label: 'AL', color: '#7FAE9A', textColor: '#fff', description: 'Annual Leave', category: 'leave' },
  'CB': { label: 'CB', color: '#8AA1B4', textColor: '#fff', description: 'Call Block', category: 'request' },
  'CR': { label: 'CR', color: '#D6B656', textColor: '#1F2933', description: 'Call Request', category: 'request' },
  // Teams - Muted medical tones
  'NES': { label: 'NES', color: '#3A5A7A', textColor: '#fff', description: 'Neurosurgery', category: 'team' },
  'VAS': { label: 'VAS', color: '#5A8A9A', textColor: '#fff', description: 'Vascular', category: 'team' },
  'CLR': { label: 'CLR', color: '#7FAE9A', textColor: '#fff', description: 'Colorectal', category: 'team' },
  'ESU': { label: 'ESU', color: '#8A7A9A', textColor: '#fff', description: 'Emergency Surgical Unit', category: 'team' },
  'PRAS': { label: 'PRAS', color: '#C48A9A', textColor: '#fff', description: 'Plastic Surgery', category: 'team' },
  'HPB': { label: 'HPB', color: '#6A8A9A', textColor: '#fff', description: 'Hepatobiliary', category: 'team' },
  'UGI': { label: 'UGI', color: '#9AAE7A', textColor: '#1F2933', description: 'Upper GI', category: 'team' },
  'BES': { label: 'BES', color: '#D6B656', textColor: '#1F2933', description: 'Breast/Endocrine', category: 'team' },
  'URO': { label: 'URO', color: '#B08A9A', textColor: '#fff', description: 'Urology', category: 'team' },
};

const MINIMUM_STAFFING = {
  'NES': 2, 'VAS': 2, 'CLR': 2, 'ESU': 3, 'PRAS': 1,
  'HPB': 1, 'UGI': 2, 'BES': 1, 'URO': 2,
};

const INITIAL_DOCTORS = [
  { id: 1, name: 'Sarah Chen', team: 'ESU', cumulativePoints: 17.5 },
  { id: 2, name: 'Marcus Wong', team: 'ESU', cumulativePoints: 16.0 },
  { id: 3, name: 'Emily Tan', team: 'CLR', cumulativePoints: 15.0 },
  { id: 4, name: 'Raj Sharma', team: 'CLR', cumulativePoints: 17.0 },
  { id: 5, name: 'Jessica Lim', team: 'VAS', cumulativePoints: 15.5 },
];

const PUBLIC_HOLIDAYS = {
  '2025-08-09': 'National Day',
  '2025-12-25': 'Christmas',
  '2026-01-01': 'New Year',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============ UTILITY FUNCTIONS ============

const generateMonthDays = (year, month) => {
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = date.getDay();
    days.push({
      date: d,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isMonThu: dayOfWeek >= 1 && dayOfWeek <= 4,
      isFriday: dayOfWeek === 5,
      isSaturday: dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
      isPublicHoliday: !!PUBLIC_HOLIDAYS[dateStr],
      holidayName: PUBLIC_HOLIDAYS[dateStr],
      fullDate: date,
      dateStr,
    });
  }
  return days;
};

const formatDate = (date) => {
  return `${DAYS_FULL[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateShort = (date) => {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`;
};

const getCallPoints = (callType, day) => {
  const points = CALL_POINTS[callType];
  if (!points) return 0;
  if (day.isPublicHoliday || day.isSaturday) return points.saturday;
  if (day.isSunday) return points.sunday;
  if (day.isFriday) return points.friday;
  return points.monThu;
};

// ============ AI ALLOCATION ALGORITHM ============

const generateAIAllocation = (doctors, requests, month, year) => {
  const days = generateMonthDays(year, month);
  const allocation = {};
  const callPoints = {};
  const enabledTiers = getEnabledHOTiers();
  const callCounts = {};
  enabledTiers.forEach(tier => { callCounts[tier] = {}; });
  
  doctors.forEach(doc => {
    allocation[doc.id] = {};
    callPoints[doc.id] = 0;
    enabledTiers.forEach(tier => { callCounts[tier][doc.id] = 0; });
  });
  
  // First pass: Apply leaves and blocks
  doctors.forEach(doc => {
    const docRequests = requests[doc.id] || {};
    days.forEach(day => {
      if (docRequests[day.date]) {
        const req = docRequests[day.date];
        if (['AL', 'CB'].includes(req)) {
          allocation[doc.id][day.date] = req;
        }
      }
    });
  });
  
  // Second pass: Allocate calls
  days.forEach(day => {
    enabledTiers.forEach(callType => {
      const available = doctors.filter(doc => {
        const currentAlloc = allocation[doc.id][day.date];
        if (currentAlloc) return false;
        const yesterday = day.date - 1;
        if (yesterday > 0) {
          const yesterdayAlloc = allocation[doc.id][yesterday];
          const yesterdayTier = HO_TIERS_CONFIG[yesterdayAlloc];
          if (yesterdayTier?.postCall) return false;
        }
        return true;
      });
      
      if (available.length === 0) return;
      
      const requesters = available.filter(doc => {
        const docRequests = requests[doc.id] || {};
        return docRequests[day.date] === 'CR';
      });
      
      let candidates = requesters.length > 0 ? requesters : available;
      candidates.sort((a, b) => (a.cumulativePoints + callPoints[a.id]) - (b.cumulativePoints + callPoints[b.id]));
      
      if (callType === 'HO1') {
        const esuDocs = candidates.filter(d => d.team === 'ESU');
        if (esuDocs.length > 0) candidates = [...esuDocs, ...candidates.filter(d => d.team !== 'ESU')];
      }
      
      if (candidates.length > 0) {
        const assigned = candidates[0];
        allocation[assigned.id][day.date] = callType;
        callPoints[assigned.id] += getCallPoints(callType, day);
        callCounts[callType][assigned.id]++;
      }
    });
  });
  
  // Third pass: Add post-call
  doctors.forEach(doc => {
    days.forEach((day, idx) => {
      if (idx === 0) return;
      const yesterday = days[idx - 1];
      const yesterdayAlloc = allocation[doc.id][yesterday.date];
      const yesterdayTier = HO_TIERS_CONFIG[yesterdayAlloc];
      if (yesterdayTier?.postCall && !allocation[doc.id][day.date]) {
        allocation[doc.id][day.date] = 'PC';
      }
    });
  });
  
  return { allocation, callPoints, callCounts };
};

// ============ COMPONENTS ============

const ShiftBadge = ({ shift, small = false }) => {
  const shiftInfo = SHIFT_TYPES[shift] || { label: shift, color: '#6b7280', textColor: '#fff' };
  return (
    <span
      className={`shift-badge ${small ? 'small' : ''}`}
      style={{ backgroundColor: shiftInfo.color, color: shiftInfo.textColor }}
    >
      {shiftInfo.label}
    </span>
  );
};

// ============ HANDOVER VIEW COMPONENT ============

const HandoverView = ({ doctors, allocation, month, year, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToday, setCopiedToday] = useState(false);
  const [copiedTomorrow, setCopiedTomorrow] = useState(false);
  
  const days = generateMonthDays(year, month);
  const enabledTiers = getEnabledHOTiers();
  
  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const getDayData = (date) => {
    const dayNum = date.getDate();
    const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year;
    
    if (!isCurrentMonth) return null;
    
    const onCall = {};
    const postCall = [];
    const onLeave = [];
    
    enabledTiers.forEach(tier => { onCall[tier] = null; });
    
    doctors.forEach(doc => {
      const shift = allocation[doc.id]?.[dayNum];
      if (enabledTiers.includes(shift)) {
        onCall[shift] = doc;
      } else if (shift === 'PC') {
        postCall.push(doc);
      } else if (shift === 'AL') {
        onLeave.push(doc);
      }
    });
    
    return { onCall, postCall, onLeave, dayNum };
  };
  
  const todayData = getDayData(selectedDate);
  const tomorrowData = getDayData(tomorrow);
  
  const generateHandoverText = (date, data) => {
    if (!data) return 'No data available';
    
    let text = `📅 ${formatDate(date)}\n\n`;
    text += `🏥 ON-CALL TEAM:\n`;
    
    enabledTiers.forEach(tier => {
      const config = HO_TIERS_CONFIG[tier];
      const doc = data.onCall[tier];
      text += `${config.emoji} ${tier} (${config.description}): ${doc ? doc.name : 'Not assigned'}\n`;
    });
    
    if (data.postCall.length > 0) {
      text += `\n😴 POST-CALL:\n`;
      data.postCall.forEach(doc => { text += `• ${doc.name}\n`; });
    }
    
    if (data.onLeave.length > 0) {
      text += `\n🏖️ ON LEAVE:\n`;
      data.onLeave.forEach(doc => { text += `• ${doc.name}\n`; });
    }
    
    return text;
  };
  
  const copyToClipboard = async (isToday) => {
    const date = isToday ? selectedDate : tomorrow;
    const data = isToday ? todayData : tomorrowData;
    const text = generateHandoverText(date, data);
    
    try {
      await navigator.clipboard.writeText(text);
      if (isToday) {
        setCopiedToday(true);
        setTimeout(() => setCopiedToday(false), 2000);
      } else {
        setCopiedTomorrow(true);
        setTimeout(() => setCopiedTomorrow(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const matchedDoctors = doctors.filter(doc => 
      doc.name.toLowerCase().includes(query)
    );
    
    return matchedDoctors.map(doc => {
      const calls = [];
      days.forEach(day => {
        const shift = allocation[doc.id]?.[day.date];
        if (enabledTiers.includes(shift)) {
          calls.push({
            date: new Date(year, month, day.date),
            shift,
            dayNum: day.date
          });
        }
      });
      return { doctor: doc, calls };
    });
  }, [searchQuery, doctors, allocation, days, month, year]);
  
  const DayCard = ({ date, data, label, isTomorrow = false }) => {
    if (!data) {
      return (
        <div className="handover-card empty">
          <div className="card-header">
            <span className="card-label">{label}</span>
            <span className="card-date">{formatDateShort(date)}</span>
          </div>
          <div className="card-empty">Outside current month</div>
        </div>
      );
    }
    
    return (
      <div className={`handover-card ${isTomorrow ? 'tomorrow' : 'today'}`}>
        <div className="card-header">
          <span className="card-label">{label}</span>
          <span className="card-date">{formatDate(date)}</span>
        </div>
        
        <div className="oncall-list">
          {enabledTiers.map(tier => {
            const config = HO_TIERS_CONFIG[tier];
            const doc = data.onCall[tier];
            return (
              <div key={tier} className="oncall-row">
                <div className="tier-info">
                  <span className="tier-emoji">{config.emoji}</span>
                  <div className="tier-details">
                    <span className="tier-name">{tier}</span>
                    <span className="tier-desc">{config.description}</span>
                  </div>
                </div>
                <div className="doctor-info">
                  {doc ? (
                    <>
                      <span className="doctor-name">{doc.name}</span>
                      <ShiftBadge shift={doc.team} small />
                    </>
                  ) : (
                    <span className="not-assigned">Not assigned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {data.postCall.length > 0 && (
          <div className="status-section">
            <div className="status-header">
              <Coffee size={16} />
              <span>Post-Call</span>
            </div>
            <div className="status-list">
              {data.postCall.map(doc => (
                <span key={doc.id} className="status-pill postcall">{doc.name}</span>
              ))}
            </div>
          </div>
        )}
        
        {data.onLeave.length > 0 && (
          <div className="status-section">
            <div className="status-header">
              <Calendar size={16} />
              <span>On Leave</span>
            </div>
            <div className="status-list">
              {data.onLeave.map(doc => (
                <span key={doc.id} className="status-pill leave">{doc.name}</span>
              ))}
            </div>
          </div>
        )}
        
        <button 
          className={`copy-btn ${(isTomorrow ? copiedTomorrow : copiedToday) ? 'copied' : ''}`}
          onClick={() => copyToClipboard(!isTomorrow)}
        >
          <Copy size={16} />
          <span>{(isTomorrow ? copiedTomorrow : copiedToday) ? 'Copied!' : 'Copy to Clipboard'}</span>
        </button>
      </div>
    );
  };
  
  return (
    <div className="handover-view">
      <div className="handover-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-title">
          <Clock size={24} />
          <h2>Handover View</h2>
        </div>
      </div>
      
      <div className="date-navigator">
        <button className="date-nav-btn" onClick={() => {
          const prev = new Date(selectedDate);
          prev.setDate(prev.getDate() - 1);
          setSelectedDate(prev);
        }}>
          <svg className="nav-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="current-selection">
          <span className="nav-label">Viewing from</span>
          <span className="nav-date">{formatDateShort(selectedDate)}</span>
        </div>
        <button className="date-nav-btn" onClick={() => {
          const next = new Date(selectedDate);
          next.setDate(next.getDate() + 1);
          setSelectedDate(next);
        }}>
          <svg className="nav-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button 
          className="today-btn"
          onClick={() => setSelectedDate(new Date())}
        >
          Today
        </button>
      </div>
      
      <div className="handover-cards">
        <DayCard date={selectedDate} data={todayData} label="TODAY" />
        
        <div className="handover-arrow">
          <ArrowDown size={24} />
          <span>Handover to</span>
        </div>
        
        <DayCard date={tomorrow} data={tomorrowData} label="TOMORROW" isTomorrow />
      </div>
      
      <div className="search-section">
        <div className="search-header">
          <Search size={20} />
          <h3>Search Doctor's Calls</h3>
        </div>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Type a doctor's name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(({ doctor, calls }) => (
              <div key={doctor.id} className="search-result-card">
                <div className="result-header">
                  <span className="result-name">{doctor.name}</span>
                  <ShiftBadge shift={doctor.team} small />
                </div>
                {calls.length > 0 ? (
                  <div className="result-calls">
                    <span className="calls-label">Upcoming calls this month:</span>
                    <div className="calls-list">
                      {calls.map((call, idx) => (
                        <div key={idx} className="call-item">
                          <span className="call-date">{formatDateShort(call.date)}</span>
                          <ShiftBadge shift={call.shift} small />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-calls">No calls scheduled this month</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {searchQuery && searchResults.length === 0 && (
          <div className="no-results">No doctors found matching "{searchQuery}"</div>
        )}
      </div>
    </div>
  );
};

// ============ MY CALLS VIEW COMPONENT ============

const MyCallsView = ({ doctors, allocation, month, year, onBack }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  
  const days = generateMonthDays(year, month);
  const enabledTiers = getEnabledHOTiers();
  
  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    return doctors.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, doctors]);
  
  const selectedDoctor = selectedDoctorId ? doctors.find(d => d.id === selectedDoctorId) : null;
  
  const doctorCalls = useMemo(() => {
    if (!selectedDoctor) return [];
    
    const calls = [];
    days.forEach(day => {
      const shift = allocation[selectedDoctor.id]?.[day.date];
      if (enabledTiers.includes(shift)) {
        const config = HO_TIERS_CONFIG[shift];
        calls.push({
          date: new Date(year, month, day.date),
          dayNum: day.date,
          shift,
          config,
          day,
          points: getCallPoints(shift, day)
        });
      }
    });
    return calls;
  }, [selectedDoctor, allocation, days, month, year]);
  
  const totalPoints = doctorCalls.reduce((sum, call) => sum + call.points, 0);
  
  // Group calls by week
  const callsByWeek = useMemo(() => {
    const weeks = {};
    doctorCalls.forEach(call => {
      const weekNum = Math.ceil(call.dayNum / 7);
      if (!weeks[weekNum]) weeks[weekNum] = [];
      weeks[weekNum].push(call);
    });
    return weeks;
  }, [doctorCalls]);
  
  return (
    <div className="mycalls-view">
      <div className="mycalls-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-title">
          <CalendarDays size={24} />
          <h2>My Calls</h2>
        </div>
      </div>
      
      <div className="mycalls-month">
        <span className="month-label">{MONTHS[month]} {year}</span>
      </div>
      
      {!selectedDoctor ? (
        <div className="doctor-selector">
          <div className="selector-header">
            <User size={20} />
            <h3>Select Your Name</h3>
          </div>
          
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
          
          <div className="doctor-list">
            {filteredDoctors.map(doc => (
              <button
                key={doc.id}
                className="doctor-select-btn"
                onClick={() => setSelectedDoctorId(doc.id)}
              >
                <div className="doc-avatar" style={{ background: `linear-gradient(135deg, ${SHIFT_TYPES[doc.team]?.color || '#6366f1'}, ${SHIFT_TYPES[doc.team]?.color || '#6366f1'}dd)` }}>
                  {doc.name.charAt(0)}
                </div>
                <div className="doc-info">
                  <span className="doc-name">{doc.name}</span>
                  <ShiftBadge shift={doc.team} small />
                </div>
                <ChevronRight size={18} className="doc-arrow" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="calls-display">
          <div className="selected-doctor-card">
            <div className="doc-avatar large" style={{ background: `linear-gradient(135deg, ${SHIFT_TYPES[selectedDoctor.team]?.color || '#6366f1'}, ${SHIFT_TYPES[selectedDoctor.team]?.color || '#6366f1'}dd)` }}>
              {selectedDoctor.name.charAt(0)}
            </div>
            <div className="doc-details">
              <h3>{selectedDoctor.name}</h3>
              <div className="doc-meta">
                <ShiftBadge shift={selectedDoctor.team} small />
                <span className="cumulative">{selectedDoctor.cumulativePoints} pts cumulative</span>
              </div>
            </div>
            <button className="change-btn" onClick={() => setSelectedDoctorId(null)}>
              Change
            </button>
          </div>
          
          <div className="calls-summary">
            <div className="summary-stat">
              <span className="stat-value">{doctorCalls.length}</span>
              <span className="stat-label">Calls</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{totalPoints.toFixed(1)}</span>
              <span className="stat-label">Points</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{doctorCalls.filter(c => c.day.isWeekend).length}</span>
              <span className="stat-label">Weekend</span>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar size={16} />
              <span>Calendar</span>
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <BarChart3 size={16} />
              <span>List</span>
            </button>
          </div>
          
          {/* Calendar View */}
          {viewMode === 'calendar' && (
          <div className="mycalls-calendar-section">
            <h4>📆 Calendar View</h4>
            <div className="mycalls-calendar">
              <div className="mycalls-cal-header">
                {DAYS.map(d => <div key={d} className="mycalls-cal-day-header">{d}</div>)}
              </div>
              <div className="mycalls-cal-body">
                {[...Array(new Date(year, month, 1).getDay())].map((_, i) => (
                  <div key={`empty-${i}`} className="mycalls-cal-cell empty" />
                ))}
                {days.map(day => {
                  const shift = allocation[selectedDoctor.id]?.[day.date];
                  const isCall = enabledTiers.includes(shift);
                  const isPostCall = shift === 'PC';
                  const isLeave = shift === 'AL';
                  const shiftInfo = SHIFT_TYPES[shift];
                  const tierConfig = HO_TIERS_CONFIG[shift];
                  
                  return (
                    <div
                      key={day.date}
                      className={`mycalls-cal-cell ${day.isWeekend ? 'weekend' : ''} ${isCall ? 'has-call' : ''} ${isPostCall ? 'post-call' : ''} ${isLeave ? 'on-leave' : ''}`}
                      style={isCall ? { backgroundColor: shiftInfo?.color + '20', borderColor: shiftInfo?.color } : {}}
                    >
                      <span className={`mycalls-cal-date ${isCall ? 'call-date' : ''}`}>{day.date}</span>
                      {isCall && (
                        <div className="mycalls-cal-shift">
                          <span className="cal-shift-badge" style={{ backgroundColor: shiftInfo?.color, color: shiftInfo?.textColor }}>
                            {shift}
                          </span>
                        </div>
                      )}
                      {isPostCall && <span className="cal-status-badge pc">PC</span>}
                      {isLeave && <span className="cal-status-badge al">AL</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mycalls-cal-legend">
              {enabledTiers.slice(0, 4).map(tier => {
                const config = HO_TIERS_CONFIG[tier];
                return (
                  <div key={tier} className="cal-legend-item">
                    <span className="cal-legend-color" style={{ backgroundColor: config.color }}></span>
                    <span className="cal-legend-text">{tier} - {config.description}</span>
                  </div>
                );
              })}
              <div className="cal-legend-item">
                <span className="cal-legend-color" style={{ backgroundColor: '#6B9A8A' }}></span>
                <span className="cal-legend-text">PC - Post-Call</span>
              </div>
            </div>
          </div>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (doctorCalls.length > 0 ? (
            <div className="calls-list-section">
              <h4>📋 Call Details</h4>
              <div className="calls-timeline">
                {doctorCalls.map((call, idx) => (
                  <div key={idx} className={`call-entry ${call.day.isWeekend ? 'weekend' : ''}`}>
                    <div className="call-date-col">
                      <span className="call-day-name">{DAYS[call.date.getDay()]}</span>
                      <span className="call-day-num">{call.dayNum}</span>
                      <span className="call-month-name">{MONTHS[month].slice(0, 3)}</span>
                    </div>
                    <div className="call-info-col">
                      <div className="call-type-row">
                        <span className="call-emoji">{call.config.emoji}</span>
                        <ShiftBadge shift={call.shift} />
                        <span className="call-desc">{call.config.description}</span>
                      </div>
                      <div className="call-meta-row">
                        <span className="call-points">+{call.points.toFixed(1)} pts</span>
                        {call.day.isWeekend && <span className="weekend-tag">Weekend</span>}
                        {call.day.isPublicHoliday && <span className="holiday-tag">🎉 {call.day.holidayName}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-calls-message">
              <Calendar size={48} />
              <h4>No calls scheduled</h4>
              <p>You don't have any calls allocated for {MONTHS[month]} {year} yet.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============ WARD COVERAGE VIEW COMPONENT ============

const WardCoverageView = ({ onBack }) => {
  const enabledTiers = getEnabledHOTiers();
  
  // Ward coverage configuration - customize this based on hospital setup
  const WARD_COVERAGE = {
    'HO1': {
      title: 'Active On-Call',
      description: 'Reviews new cases with on-call team',
      wards: [
        { name: 'ED Admissions', icon: '🚨', notes: 'All new surgical admissions from ED' },
        { name: 'Ward 45', icon: '🏥', notes: 'General Surgery acute' },
        { name: 'Ward 46', icon: '🏥', notes: 'General Surgery acute' },
        { name: 'ICU/HD Consults', icon: '⚠️', notes: 'Surgical consults for ICU patients' },
      ],
      responsibilities: [
        'Review all new ED admissions',
        'Attend to urgent consults',
        'Update on-call consultant',
        'Handover to HO2 for non-urgent ward issues'
      ]
    },
    'HO2': {
      title: 'Passive On-Call',
      description: 'First line for ward nurse escalations',
      wards: [
        { name: 'Ward 51', icon: '🏥', notes: 'Elective post-op' },
        { name: 'Ward 52', icon: '🏥', notes: 'Elective post-op' },
        { name: 'Ward 53', icon: '🏥', notes: 'Mixed surgical' },
        { name: 'Ward 54', icon: '🏥', notes: 'Step-down care' },
      ],
      responsibilities: [
        'Attend to nurse escalations',
        'Manage ward issues (pain, vitals, drains)',
        'Update discharge summaries',
        'Escalate to HO1 if needed'
      ]
    },
    'HO3': {
      title: 'Handover HO',
      description: 'Reviews handovers, leaves at 10pm',
      wards: [
        { name: 'All Wards', icon: '📋', notes: 'Handover coverage' },
      ],
      responsibilities: [
        'Collect and consolidate handovers',
        'Clear pending jobs before 10pm',
        'Document handover notes',
        'Leave at 10pm (no overnight)'
      ]
    },
    'HO4': {
      title: 'Additional Coverage',
      description: 'Supports team during busy periods',
      wards: [
        { name: 'Flexible', icon: '🔄', notes: 'As assigned by HO1/HO2' },
      ],
      responsibilities: [
        'Assist HO1 or HO2 as needed',
        'Cover overflow cases',
        'Support during peak hours'
      ]
    }
  };
  
  return (
    <div className="coverage-view">
      <div className="coverage-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-title">
          <Building2 size={24} />
          <h2>Ward Coverage</h2>
        </div>
      </div>
      
      <div className="coverage-subtitle">
        <p>Which wards each on-call tier covers</p>
      </div>
      
      <div className="coverage-cards">
        {enabledTiers.map(tier => {
          const config = HO_TIERS_CONFIG[tier];
          const coverage = WARD_COVERAGE[tier] || {
            title: config.description,
            description: 'Custom role',
            wards: [{ name: 'As assigned', icon: '📋', notes: 'Check with roster in-charge' }],
            responsibilities: ['As assigned']
          };
          
          return (
            <div key={tier} className="coverage-card" style={{ borderColor: config.color + '50' }}>
              <div className="coverage-card-header" style={{ background: `linear-gradient(135deg, ${config.color}20, ${config.color}10)` }}>
                <span className="tier-emoji">{config.emoji}</span>
                <div className="tier-info">
                  <h3>{tier} - {coverage.title}</h3>
                  <p>{coverage.description}</p>
                </div>
              </div>
              
              <div className="coverage-card-body">
                <div className="wards-section">
                  <h4>🏥 Wards Covered</h4>
                  <div className="wards-list">
                    {coverage.wards.map((ward, idx) => (
                      <div key={idx} className="ward-item">
                        <span className="ward-icon">{ward.icon}</span>
                        <div className="ward-details">
                          <span className="ward-name">{ward.name}</span>
                          <span className="ward-notes">{ward.notes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="responsibilities-section">
                  <h4>📋 Key Responsibilities</h4>
                  <ul className="responsibilities-list">
                    {coverage.responsibilities.map((resp, idx) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="coverage-footer">
        <Info size={16} />
        <span>Ward assignments may vary. Check with your roster in-charge for any changes.</span>
      </div>
    </div>
  );
};

// ============ ANTIBIOTIC GUIDELINES VIEW COMPONENT ============

const AntibioticGuidelinesView = ({ onBack }) => {
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Antibiotic guidelines by system - customize based on hospital guidelines
  const ABX_GUIDELINES = {
    'respiratory': {
      icon: '🫁',
      name: 'Respiratory',
      color: '#06b6d4',
      conditions: [
        {
          name: 'Community-Acquired Pneumonia (CAP)',
          severity: 'Mild',
          firstLine: 'Amoxicillin 1g TDS PO',
          alternative: 'Doxycycline 100mg BD PO',
          duration: '5 days',
          notes: 'Review at 48-72h'
        },
        {
          name: 'CAP - Moderate/Severe',
          severity: 'Severe',
          firstLine: 'Co-amoxiclav 1.2g TDS IV + Azithromycin 500mg OD',
          alternative: 'Ceftriaxone 2g OD IV + Azithromycin 500mg OD',
          duration: '5-7 days',
          notes: 'Consider ICU if needed'
        },
        {
          name: 'Aspiration Pneumonia',
          severity: 'Moderate',
          firstLine: 'Co-amoxiclav 1.2g TDS IV',
          alternative: 'Ceftriaxone 2g OD + Metronidazole 500mg TDS',
          duration: '5-7 days',
          notes: 'Add anaerobic cover'
        }
      ]
    },
    'urinary': {
      icon: '💧',
      name: 'Urinary',
      color: '#f59e0b',
      conditions: [
        {
          name: 'Simple UTI (Cystitis)',
          severity: 'Mild',
          firstLine: 'Nitrofurantoin 100mg BD PO',
          alternative: 'Trimethoprim 200mg BD PO',
          duration: '3 days (women), 7 days (men)',
          notes: 'Check local resistance'
        },
        {
          name: 'Pyelonephritis',
          severity: 'Moderate',
          firstLine: 'Ciprofloxacin 500mg BD PO',
          alternative: 'Co-amoxiclav 625mg TDS PO',
          duration: '7-14 days',
          notes: 'IV if unable to tolerate PO'
        },
        {
          name: 'Catheter-Associated UTI',
          severity: 'Moderate',
          firstLine: 'Ciprofloxacin 400mg BD IV',
          alternative: 'Gentamicin + Amoxicillin',
          duration: '7 days',
          notes: 'Consider catheter change'
        }
      ]
    },
    'skin': {
      icon: '🩹',
      name: 'Skin & Soft Tissue',
      color: '#ef4444',
      conditions: [
        {
          name: 'Cellulitis - Simple',
          severity: 'Mild',
          firstLine: 'Flucloxacillin 500mg QDS PO',
          alternative: 'Clarithromycin 500mg BD PO',
          duration: '5-7 days',
          notes: 'Mark edges, elevate limb'
        },
        {
          name: 'Cellulitis - Severe',
          severity: 'Severe',
          firstLine: 'Flucloxacillin 2g QDS IV',
          alternative: 'Vancomycin if MRSA suspected',
          duration: '7-14 days',
          notes: 'Consider surgical debridement'
        },
        {
          name: 'Diabetic Foot Infection',
          severity: 'Severe',
          firstLine: 'Co-amoxiclav 1.2g TDS IV + Metronidazole 500mg TDS',
          alternative: 'Piperacillin-Tazobactam 4.5g TDS',
          duration: '2-4 weeks',
          notes: 'Vascular & surgical review'
        }
      ]
    },
    'abdominal': {
      icon: '🩺',
      name: 'Abdominal / Surgical',
      color: '#8b5cf6',
      conditions: [
        {
          name: 'Intra-abdominal Infection',
          severity: 'Moderate',
          firstLine: 'Co-amoxiclav 1.2g TDS IV',
          alternative: 'Ciprofloxacin + Metronidazole',
          duration: '4-7 days post source control',
          notes: 'Source control essential'
        },
        {
          name: 'Biliary Sepsis',
          severity: 'Severe',
          firstLine: 'Piperacillin-Tazobactam 4.5g TDS IV',
          alternative: 'Meropenem 1g TDS IV',
          duration: '4-7 days',
          notes: 'ERCP/drainage if needed'
        },
        {
          name: 'Surgical Site Infection',
          severity: 'Moderate',
          firstLine: 'Flucloxacillin 1g QDS IV',
          alternative: 'Co-amoxiclav 1.2g TDS IV',
          duration: '5-7 days',
          notes: 'Open wound, send cultures'
        }
      ]
    },
    'sepsis': {
      icon: '🚨',
      name: 'Sepsis',
      color: '#dc2626',
      conditions: [
        {
          name: 'Sepsis - Unknown Source',
          severity: 'Severe',
          firstLine: 'Piperacillin-Tazobactam 4.5g TDS IV',
          alternative: 'Meropenem 1g TDS IV if recent abx',
          duration: 'Review daily',
          notes: 'Blood cultures x2, sepsis 6'
        },
        {
          name: 'Neutropenic Sepsis',
          severity: 'Severe',
          firstLine: 'Piperacillin-Tazobactam 4.5g TDS IV',
          alternative: 'Meropenem + Vancomycin if line infection',
          duration: 'Until neutrophil recovery',
          notes: 'Oncology/Haem review'
        }
      ]
    },
    'prophylaxis': {
      icon: '💊',
      name: 'Surgical Prophylaxis',
      color: '#10b981',
      conditions: [
        {
          name: 'Clean Surgery (hernia, thyroid)',
          severity: 'Prophylaxis',
          firstLine: 'Cefazolin 2g IV at induction',
          alternative: 'Vancomycin if penicillin allergy',
          duration: 'Single dose',
          notes: 'Repeat if surgery >4h'
        },
        {
          name: 'Clean-Contaminated (biliary, colorectal)',
          severity: 'Prophylaxis',
          firstLine: 'Cefazolin 2g + Metronidazole 500mg IV',
          alternative: 'Gentamicin + Metronidazole',
          duration: 'Single dose',
          notes: '24h max for colorectal'
        },
        {
          name: 'Contaminated/Dirty',
          severity: 'Treatment',
          firstLine: 'Treat as infection, not prophylaxis',
          alternative: '-',
          duration: 'As per infection',
          notes: 'Full treatment course'
        }
      ]
    }
  };
  
  const filteredSystems = useMemo(() => {
    if (!searchQuery.trim()) return Object.entries(ABX_GUIDELINES);
    const query = searchQuery.toLowerCase();
    return Object.entries(ABX_GUIDELINES).filter(([key, system]) => {
      if (system.name.toLowerCase().includes(query)) return true;
      return system.conditions.some(c => 
        c.name.toLowerCase().includes(query) ||
        c.firstLine.toLowerCase().includes(query) ||
        c.alternative.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);
  
  const selectedSystemData = selectedSystem ? ABX_GUIDELINES[selectedSystem] : null;
  
  return (
    <div className="abx-view">
      <div className="abx-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-title">
          <Pill size={24} />
          <h2>Antibiotic Guidelines</h2>
        </div>
      </div>
      
      <div className="abx-disclaimer">
        <AlertCircle size={16} />
        <span>Always check local guidelines and patient allergies. Consult Microbiology for complex cases.</span>
      </div>
      
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search condition or antibiotic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>
      
      {!selectedSystem ? (
        <div className="system-grid">
          {filteredSystems.map(([key, system]) => (
            <button
              key={key}
              className="system-card"
              onClick={() => setSelectedSystem(key)}
              style={{ borderColor: system.color + '40' }}
            >
              <div className="system-icon" style={{ background: system.color + '20', color: system.color }}>
                {system.icon}
              </div>
              <span className="system-name">{system.name}</span>
              <span className="system-count">{system.conditions.length} conditions</span>
              <ChevronRight size={18} className="system-arrow" />
            </button>
          ))}
        </div>
      ) : (
        <div className="condition-list">
          <button className="back-to-systems" onClick={() => setSelectedSystem(null)}>
            <ChevronLeft size={16} />
            <span>All Systems</span>
          </button>
          
          <div className="system-header" style={{ background: `linear-gradient(135deg, ${selectedSystemData.color}20, ${selectedSystemData.color}10)` }}>
            <span className="system-icon-lg">{selectedSystemData.icon}</span>
            <h3>{selectedSystemData.name}</h3>
          </div>
          
          <div className="conditions">
            {selectedSystemData.conditions.map((condition, idx) => (
              <div key={idx} className="condition-card">
                <div className="condition-header">
                  <h4>{condition.name}</h4>
                  <span className={`severity-badge ${condition.severity.toLowerCase()}`}>
                    {condition.severity}
                  </span>
                </div>
                
                <div className="treatment-section">
                  <div className="treatment-row first-line">
                    <span className="treatment-label">1st Line:</span>
                    <span className="treatment-value">{condition.firstLine}</span>
                  </div>
                  {condition.alternative !== '-' && (
                    <div className="treatment-row alternative">
                      <span className="treatment-label">Alternative:</span>
                      <span className="treatment-value">{condition.alternative}</span>
                    </div>
                  )}
                  <div className="treatment-row duration">
                    <span className="treatment-label">Duration:</span>
                    <span className="treatment-value">{condition.duration}</span>
                  </div>
                </div>
                
                {condition.notes && (
                  <div className="condition-notes">
                    <Info size={14} />
                    <span>{condition.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ MONTHLY ROSTER VIEW COMPONENT ============

const MonthlyRosterView = ({ doctors, allocation, callPoints, month, year, onBack }) => {
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [currentWeek, setCurrentWeek] = useState(0);
  
  const days = generateMonthDays(year, month);
  const enabledTiers = getEnabledHOTiers();
  
  // Group days into weeks
  const weeks = useMemo(() => {
    const result = [];
    let currentWeekDays = [];
    const firstDayOffset = new Date(year, month, 1).getDay();
    
    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDayOffset; i++) {
      currentWeekDays.push(null);
    }
    
    days.forEach(day => {
      currentWeekDays.push(day);
      if (currentWeekDays.length === 7) {
        result.push(currentWeekDays);
        currentWeekDays = [];
      }
    });
    
    // Add remaining days as last week
    if (currentWeekDays.length > 0) {
      while (currentWeekDays.length < 7) {
        currentWeekDays.push(null);
      }
      result.push(currentWeekDays);
    }
    
    return result;
  }, [days, year, month]);
  
  const currentWeekDays = weeks[currentWeek] || [];
  
  // Get daily summary for each day
  const getDailySummary = (dayNum) => {
    const summary = {};
    enabledTiers.forEach(tier => { summary[tier] = null; });
    summary.PC = [];
    summary.AL = [];
    
    doctors.forEach(doc => {
      const shift = allocation[doc.id]?.[dayNum];
      if (enabledTiers.includes(shift)) {
        summary[shift] = doc;
      } else if (shift === 'PC') {
        summary.PC.push(doc);
      } else if (shift === 'AL') {
        summary.AL.push(doc);
      }
    });
    
    return summary;
  };
  
  // Calculate totals for each doctor
  const doctorStats = useMemo(() => {
    return doctors.map(doc => {
      const stats = { calls: 0, weekendCalls: 0, points: callPoints[doc.id] || 0 };
      enabledTiers.forEach(tier => { stats[tier] = 0; });
      
      days.forEach(day => {
        const shift = allocation[doc.id]?.[day.date];
        if (enabledTiers.includes(shift)) {
          stats.calls++;
          stats[shift]++;
          if (day.isWeekend) stats.weekendCalls++;
        }
      });
      
      return { ...doc, ...stats };
    });
  }, [doctors, allocation, days, callPoints]);
  
  return (
    <div className="roster-view">
      <div className="roster-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-title">
          <Calendar size={24} />
          <h2>Monthly Roster</h2>
        </div>
      </div>
      
      <div className="roster-month-label">
        <h3>{MONTHS[month]} {year}</h3>
      </div>
      
      {/* View Toggle */}
      <div className="roster-view-toggle">
        <button 
          className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => setViewMode('month')}
        >
          <Calendar size={16} />
          <span>Month</span>
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          <CalendarDays size={16} />
          <span>Week</span>
        </button>
      </div>
      
      {/* Legend */}
      <div className="roster-legend">
        {enabledTiers.map(tier => {
          const config = HO_TIERS_CONFIG[tier];
          return (
            <div key={tier} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: config.color }}></span>
              <span className="legend-label">{tier}</span>
            </div>
          );
        })}
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
          <span className="legend-label">PC</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#6366f1' }}></span>
          <span className="legend-label">AL</span>
        </div>
      </div>
      
      {/* Monthly Roster Grid */}
      {viewMode === 'month' && (
        <div className="roster-grid-container">
          <div className="roster-grid">
            {/* Header Row - Days */}
            <div className="grid-header-row">
              <div className="grid-cell doctor-header">Doctor</div>
              {days.map(day => (
                <div 
                  key={day.date} 
                  className={`grid-cell day-header ${day.isWeekend ? 'weekend' : ''} ${day.isPublicHoliday ? 'holiday' : ''}`}
                >
                  <span className="day-name">{DAYS[day.dayOfWeek]}</span>
                  <span className="day-num">{day.date}</span>
                </div>
              ))}
              <div className="grid-cell stats-header">Calls</div>
              <div className="grid-cell stats-header">Pts</div>
            </div>
            
            {/* Doctor Rows */}
            {doctorStats.map(doc => (
              <div key={doc.id} className="grid-row">
                <div className="grid-cell doctor-cell">
                  <span className="doctor-name-grid">{doc.name.split(' ')[0]}</span>
                  <ShiftBadge shift={doc.team} small />
                </div>
                {days.map(day => {
                  const shift = allocation[doc.id]?.[day.date];
                  const shiftInfo = SHIFT_TYPES[shift];
                  return (
                    <div 
                      key={day.date} 
                      className={`grid-cell shift-cell ${day.isWeekend ? 'weekend' : ''} ${shift ? 'has-shift' : ''}`}
                      style={shift ? { backgroundColor: shiftInfo?.color + '30' } : {}}
                    >
                      {shift && (
                        <span 
                          className="shift-mini"
                          style={{ backgroundColor: shiftInfo?.color, color: shiftInfo?.textColor }}
                        >
                          {shift}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="grid-cell stats-cell">{doc.calls}</div>
                <div className="grid-cell stats-cell points">{doc.points.toFixed(1)}</div>
              </div>
            ))}
            
            {/* Daily Summary Row */}
            <div className="grid-row summary-row">
              <div className="grid-cell doctor-cell summary-label">On-Call</div>
              {days.map(day => {
                const summary = getDailySummary(day.date);
                return (
                  <div 
                    key={day.date} 
                    className={`grid-cell summary-cell ${day.isWeekend ? 'weekend' : ''}`}
                  >
                    <div className="summary-stack">
                      {enabledTiers.slice(0, 2).map(tier => {
                        const doc = summary[tier];
                        const config = HO_TIERS_CONFIG[tier];
                        return doc ? (
                          <span 
                            key={tier} 
                            className="summary-mini"
                            style={{ backgroundColor: config.color }}
                            title={`${tier}: ${doc.name}`}
                          >
                            {doc.name.charAt(0)}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Weekly Roster View */}
      {viewMode === 'week' && (
        <div className="weekly-roster-container">
          {/* Week Navigation */}
          <div className="week-navigator">
            <button 
              className="week-nav-btn"
              onClick={() => setCurrentWeek(w => Math.max(0, w - 1))}
              disabled={currentWeek === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div className="week-label">
              <span className="week-title">Week {currentWeek + 1} of {weeks.length}</span>
              <span className="week-dates">
                {currentWeekDays.find(d => d)?.date} - {currentWeekDays.filter(d => d).slice(-1)[0]?.date} {MONTHS[month].slice(0, 3)}
              </span>
            </div>
            <button 
              className="week-nav-btn"
              onClick={() => setCurrentWeek(w => Math.min(weeks.length - 1, w + 1))}
              disabled={currentWeek === weeks.length - 1}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          
          {/* Weekly Grid */}
          <div className="weekly-grid">
            {/* Day Headers */}
            <div className="weekly-header-row">
              <div className="weekly-cell doctor-col">Doctor</div>
              {DAYS.map((dayName, idx) => {
                const day = currentWeekDays[idx];
                return (
                  <div 
                    key={idx} 
                    className={`weekly-cell day-col ${day?.isWeekend ? 'weekend' : ''} ${day?.isPublicHoliday ? 'holiday' : ''} ${!day ? 'empty' : ''}`}
                  >
                    <span className="weekly-day-name">{dayName}</span>
                    {day && <span className="weekly-day-num">{day.date}</span>}
                  </div>
                );
              })}
            </div>
            
            {/* Doctor Rows */}
            {doctorStats.map(doc => (
              <div key={doc.id} className="weekly-row">
                <div className="weekly-cell doctor-col">
                  <div className="weekly-doc-avatar" style={{ background: SHIFT_TYPES[doc.team]?.color }}>
                    {doc.name.charAt(0)}
                  </div>
                  <div className="weekly-doc-info">
                    <span className="weekly-doc-name">{doc.name}</span>
                    <ShiftBadge shift={doc.team} small />
                  </div>
                </div>
                {currentWeekDays.map((day, idx) => {
                  if (!day) {
                    return <div key={idx} className="weekly-cell shift-col empty"></div>;
                  }
                  const shift = allocation[doc.id]?.[day.date];
                  const shiftInfo = SHIFT_TYPES[shift];
                  const tierConfig = HO_TIERS_CONFIG[shift];
                  return (
                    <div 
                      key={idx} 
                      className={`weekly-cell shift-col ${day.isWeekend ? 'weekend' : ''} ${shift ? 'has-shift' : ''}`}
                      style={shift ? { backgroundColor: shiftInfo?.color + '15' } : {}}
                    >
                      {shift && (
                        <div className="weekly-shift-content">
                          <span 
                            className="weekly-shift-badge"
                            style={{ backgroundColor: shiftInfo?.color, color: shiftInfo?.textColor }}
                          >
                            {shift}
                          </span>
                          {tierConfig && (
                            <span className="weekly-shift-desc">{tierConfig.description}</span>
                          )}
                          {shift === 'PC' && <span className="weekly-shift-desc">Post-Call</span>}
                          {shift === 'AL' && <span className="weekly-shift-desc">Leave</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* On-Call Summary Row */}
            <div className="weekly-row summary-row">
              <div className="weekly-cell doctor-col">
                <span className="weekly-summary-label">On-Call Team</span>
              </div>
              {currentWeekDays.map((day, idx) => {
                if (!day) {
                  return <div key={idx} className="weekly-cell shift-col empty"></div>;
                }
                const summary = getDailySummary(day.date);
                return (
                  <div key={idx} className={`weekly-cell shift-col summary ${day.isWeekend ? 'weekend' : ''}`}>
                    <div className="weekly-oncall-list">
                      {enabledTiers.map(tier => {
                        const doc = summary[tier];
                        const config = HO_TIERS_CONFIG[tier];
                        return (
                          <div key={tier} className="weekly-oncall-item">
                            <span className="oncall-tier" style={{ color: config.color }}>{tier}:</span>
                            <span className="oncall-name">{doc ? doc.name.split(' ')[0] : '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Summary */}
      <div className="roster-stats-section">
        <h4>📊 Call Distribution</h4>
        <div className="stats-table">
          <div className="stats-header-row">
            <div className="stats-col name">Doctor</div>
            <div className="stats-col">Total</div>
            {enabledTiers.map(tier => (
              <div key={tier} className="stats-col">{tier}</div>
            ))}
            <div className="stats-col">Wknd</div>
            <div className="stats-col highlight">Points</div>
          </div>
          {doctorStats.map(doc => (
            <div key={doc.id} className="stats-row">
              <div className="stats-col name">
                <span>{doc.name}</span>
                <ShiftBadge shift={doc.team} small />
              </div>
              <div className="stats-col">{doc.calls}</div>
              {enabledTiers.map(tier => (
                <div key={tier} className="stats-col">{doc[tier]}</div>
              ))}
              <div className="stats-col">{doc.weekendCalls}</div>
              <div className="stats-col highlight">{doc.points.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ OTHER COMPONENTS (Abbreviated for space) ============

const DoctorAvailabilityView = ({ doctor, month, year, requests, setRequests, onBack }) => {
  const days = generateMonthDays(year, month);
  const [selectedType, setSelectedType] = useState('AL');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' or 'error'
  
  const docRequests = requests[doctor.id] || {};
  const cbCount = Object.values(docRequests).filter(r => r === 'CB').length;
  const crCount = Object.values(docRequests).filter(r => r === 'CR').length;
  const alCount = Object.values(docRequests).filter(r => r === 'AL').length;
  
  // Save request to Supabase
  const saveRequestToDb = async (dayNum, requestType, isRemoving) => {
    if (!isSupabaseConfigured()) return;
    
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      
      if (isRemoving) {
        // Delete the request - we need to find it first by doctor_id and date
        const { data: existingReqs } = await db.requests.getByMonth(year, month);
        const existingReq = existingReqs?.find(r => 
          r.doctor_id === doctor.id && r.date === dateStr
        );
        if (existingReq) {
          await db.requests.delete(existingReq.id);
        }
      } else {
        // Create or update the request
        // First check if there's an existing request for this date
        const { data: existingReqs } = await db.requests.getByMonth(year, month);
        const existingReq = existingReqs?.find(r => 
          r.doctor_id === doctor.id && r.date === dateStr
        );
        
        if (existingReq) {
          await db.requests.update(existingReq.id, { request_type: requestType });
        } else {
          await db.requests.create({
            doctor_id: doctor.id,
            date: dateStr,
            request_type: requestType,
            status: 'pending'
          });
        }
      }
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Error saving request:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };
  
  const toggleDay = (dayNum) => {
    const docReq = requests[doctor.id] || {};
    const current = docReq[dayNum];
    const isRemoving = current === selectedType;
    
    // Update local state immediately for responsive UI
    setRequests(prev => {
      const docReq = prev[doctor.id] || {};
      if (isRemoving) {
        const newDocReq = { ...docReq };
        delete newDocReq[dayNum];
        return { ...prev, [doctor.id]: newDocReq };
      }
      return { ...prev, [doctor.id]: { ...docReq, [dayNum]: selectedType } };
    });
    
    // Save to database in background
    saveRequestToDb(dayNum, selectedType, isRemoving);
  };
  
  const firstDayOffset = new Date(year, month, 1).getDay();
  const requestTypes = [
    { type: 'AL', label: 'Annual Leave', icon: '🏖️' },
    { type: 'CB', label: 'Call Block', icon: '🚫' },
    { type: 'CR', label: 'Call Request', icon: '✋' },
  ];
  
  return (
    <div className="availability-view">
      <div className="availability-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-info">
          <h2>{doctor.name}</h2>
          <div className="doctor-meta">
            <ShiftBadge shift={doctor.team} small />
            <span className="cumulative-points">
              <TrendingUp size={14} />
              {doctor.cumulativePoints} pts
            </span>
          </div>
        </div>
      </div>
      
      <div className="availability-controls">
        <div className="type-selector">
          <span className="control-label">Mark days as:</span>
          <div className="type-buttons">
            {requestTypes.map(({ type, label, icon }) => (
              <button
                key={type}
                className={`type-btn ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
                style={{
                  backgroundColor: selectedType === type ? SHIFT_TYPES[type].color : 'transparent',
                  color: selectedType === type ? SHIFT_TYPES[type].textColor : SHIFT_TYPES[type].color,
                  borderColor: SHIFT_TYPES[type].color,
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="request-summary">
          <div className="summary-item"><span>AL:</span><strong>{alCount}</strong></div>
          <div className="summary-item"><span>CB:</span><strong>{cbCount}</strong></div>
          <div className="summary-item"><span>CR:</span><strong>{crCount}</strong></div>
        </div>
        {isSupabaseConfigured() && (
          <div className={`save-status ${saving ? 'saving' : ''} ${saveStatus || ''}`}>
            {saving && <><span className="save-spinner"></span> Saving...</>}
            {saveStatus === 'saved' && <><CheckCircle size={14} /> Saved</>}
            {saveStatus === 'error' && <><AlertCircle size={14} /> Error saving</>}
          </div>
        )}
      </div>
      
      <div className="calendar-grid">
        <div className="calendar-header">
          {DAYS.map(d => <div key={d} className="day-header">{d}</div>)}
        </div>
        <div className="calendar-body">
          {[...Array(firstDayOffset)].map((_, i) => (
            <div key={`empty-${i}`} className="day-cell empty" />
          ))}
          {days.map(day => {
            const status = docRequests[day.date];
            const statusInfo = status ? SHIFT_TYPES[status] : null;
            return (
              <div
                key={day.date}
                className={`day-cell ${day.isWeekend ? 'weekend' : ''} ${status ? 'marked' : ''}`}
                onClick={() => toggleDay(day.date)}
                style={status ? { backgroundColor: statusInfo?.color + '25', borderColor: statusInfo?.color } : {}}
              >
                <span className="day-number">{day.date}</span>
                {status && <ShiftBadge shift={status} small />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DoctorCard = ({ doctor, hasSubmitted, requestSummary, onClick }) => (
  <div className={`doctor-card ${hasSubmitted ? 'submitted' : ''}`} onClick={onClick}>
    <div className="card-avatar" style={{ background: `linear-gradient(135deg, ${SHIFT_TYPES[doctor.team]?.color || '#6366f1'}, ${SHIFT_TYPES[doctor.team]?.color || '#6366f1'}dd)` }}>
      {doctor.name.charAt(0)}
    </div>
    <div className="card-info">
      <h3>{doctor.name}</h3>
      <div className="card-meta">
        <ShiftBadge shift={doctor.team} small />
        <span className="points">{doctor.cumulativePoints} pts</span>
      </div>
      {hasSubmitted && requestSummary && (
        <div className="request-badges">
          {requestSummary.al > 0 && <span className="req-badge al">{requestSummary.al} AL</span>}
          {requestSummary.cb > 0 && <span className="req-badge cb">{requestSummary.cb} CB</span>}
          {requestSummary.cr > 0 && <span className="req-badge cr">{requestSummary.cr} CR</span>}
        </div>
      )}
    </div>
    <div className="card-status">
      {hasSubmitted ? <CheckCircle size={20} className="status-icon done" /> : <AlertCircle size={20} className="status-icon pending" />}
    </div>
  </div>
);

// ============ MAIN APP ============

export default function RosterApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2025);
  const [doctors, setDoctors] = useState(INITIAL_DOCTORS);
  const [requests, setRequests] = useState({});
  const [allocation, setAllocation] = useState({});
  const [callPoints, setCallPoints] = useState({});
  const [callCounts, setCallCounts] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Auth context
  const { user, doctorProfile, signIn, signUp, signOut, isAuthenticated, isRosterAdmin, isConfigured } = useAuthContext();
  
  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      if (!isSupabaseConfigured()) {
        setDataLoaded(true);
        return;
      }
      
      try {
        // Load doctors
        const { data: doctorsData } = await db.doctors.getAll();
        if (doctorsData && doctorsData.length > 0) {
          // Transform Supabase data to match app format
          const transformedDoctors = doctorsData.map(d => ({
            id: d.id,
            name: d.name,
            team: d.team_key,
            cumulativePoints: d.cumulative_points || 0,
            email: d.email
          }));
          setDoctors(transformedDoctors);
        }
        
        // Load existing roster for current month
        const { data: rosterData } = await db.rosters.getByMonth(year, month);
        if (rosterData) {
          setAllocation(rosterData.allocation || {});
          setCallPoints(rosterData.call_points || {});
          setHasGenerated(true);
        }
        
        // Load requests for current month
        const { data: requestsData } = await db.requests.getByMonth(year, month);
        if (requestsData) {
          // Transform to { doctorId: { day: requestType } }
          const grouped = {};
          requestsData.forEach(req => {
            if (!grouped[req.doctor_id]) grouped[req.doctor_id] = {};
            const day = new Date(req.date).getDate();
            grouped[req.doctor_id][day] = req.request_type;
          });
          setRequests(grouped);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setDataLoaded(true);
      }
    };
    
    loadData();
  }, [year, month]);
  
  // Handle authentication
  const handleAuth = async (mode, credentials) => {
    if (mode === 'login') {
      return await signIn(credentials.email, credentials.password);
    } else {
      return await signUp(credentials.email, credentials.password, { name: credentials.name });
    }
  };
  
  const getRequestSummary = (docId) => {
    const docReqs = requests[docId] || {};
    return {
      al: Object.values(docReqs).filter(r => r === 'AL').length,
      cb: Object.values(docReqs).filter(r => r === 'CB').length,
      cr: Object.values(docReqs).filter(r => r === 'CR').length,
    };
  };
  
  const submittedCount = Object.keys(requests).filter(id => requests[id] && Object.keys(requests[id]).length > 0).length;
  
  const handleGenerateRoster = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = generateAIAllocation(doctors, requests, month, year);
    setAllocation(result.allocation);
    setCallPoints(result.callPoints);
    setCallCounts(result.callCounts);
    setHasGenerated(true);
    setIsGenerating(false);
    
    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await db.rosters.save(year, month, result.allocation, result.callPoints, 'draft');
        console.log('✅ Roster saved to database');
      } catch (error) {
        console.error('Error saving roster:', error);
      }
    }
  };
  
  const handlePublishRoster = async () => {
    if (!isSupabaseConfigured()) {
      alert('Database not configured. Cannot publish roster.');
      return;
    }
    
    setIsSaving(true);
    try {
      await db.rosters.publish(year, month);
      alert('✅ Roster published successfully!');
    } catch (error) {
      console.error('Error publishing roster:', error);
      alert('Failed to publish roster');
    } finally {
      setIsSaving(false);
    }
  };
  
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (month === 0) { setMonth(11); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else {
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
    setHasGenerated(false);
    setAllocation({});
  };
  
  // View routing
  if (currentView === 'admin') {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <AdminPanel
          onBack={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }
  
  if (currentView === 'availability' && selectedDoctor) {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <DoctorAvailabilityView
          doctor={selectedDoctor}
          month={month}
          year={year}
          requests={requests}
          setRequests={setRequests}
          onBack={() => { setCurrentView('dashboard'); setSelectedDoctor(null); }}
        />
      </div>
    );
  }
  
  if (currentView === 'handover') {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <HandoverView
          doctors={doctors}
          allocation={allocation}
          month={month}
          year={year}
          onBack={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }
  
  if (currentView === 'roster') {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <MonthlyRosterView
          doctors={doctors}
          allocation={allocation}
          callPoints={callPoints}
          month={month}
          year={year}
          onBack={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }
  
  if (currentView === 'mycalls') {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <MyCallsView
          doctors={doctors}
          allocation={allocation}
          month={month}
          year={year}
          onBack={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }
  
  if (currentView === 'coverage') {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <WardCoverageView
          onBack={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }
  
  if (currentView === 'abx') {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <AntibioticGuidelinesView
          onBack={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }
  
  // Group doctors by team
  const doctorsByTeam = {};
  doctors.forEach(doc => {
    if (!doctorsByTeam[doc.team]) doctorsByTeam[doc.team] = [];
    doctorsByTeam[doc.team].push(doc);
  });
  
  return (
    <div className="app-container">
      <style>{styles}</style>
      
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon"><Zap size={24} /></div>
            <div className="logo-text">
              <h1>RosterAI Pro</h1>
              <span>Smart Shift Allocation</span>
            </div>
          </div>
          <nav className="header-nav">
            <button className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
              <Users size={18} /><span>Dashboard</span>
            </button>
            {hasGenerated && (
              <>
                <button className={`nav-btn roster-nav ${currentView === 'roster' ? 'active' : ''}`} onClick={() => setCurrentView('roster')}>
                  <Calendar size={18} /><span>Roster</span>
                </button>
                <button className={`nav-btn handover-nav ${currentView === 'handover' ? 'active' : ''}`} onClick={() => setCurrentView('handover')}>
                  <Clock size={18} /><span>Handover</span>
                </button>
                <button className={`nav-btn mycalls-nav ${currentView === 'mycalls' ? 'active' : ''}`} onClick={() => setCurrentView('mycalls')}>
                  <CalendarDays size={18} /><span>My Calls</span>
                </button>
              </>
            )}
            <button className={`nav-btn coverage-nav ${currentView === 'coverage' ? 'active' : ''}`} onClick={() => setCurrentView('coverage')}>
              <Building2 size={18} /><span>Coverage</span>
            </button>
            <button className={`nav-btn abx-nav ${currentView === 'abx' ? 'active' : ''}`} onClick={() => setCurrentView('abx')}>
              <Pill size={18} /><span>Antibiotics</span>
            </button>
            {(doctorProfile?.role === 'admin' || doctorProfile?.role === 'roster_admin') && (
              <button className={`nav-btn admin-nav ${currentView === 'admin' ? 'active' : ''}`} onClick={() => setCurrentView('admin')}>
                <Settings size={18} /><span>Admin</span>
              </button>
            )}
          </nav>
          
          {/* User Menu */}
          <div className="user-menu">
            {!isConfigured && (
              <div className="db-status offline" title="Database not connected - Running in demo mode">
                <Database size={16} />
                <span>Demo Mode</span>
              </div>
            )}
            {isConfigured && !isAuthenticated && (
              <button className="login-btn" onClick={() => setShowAuthModal(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                <span>Sign In</span>
              </button>
            )}
            {isAuthenticated && (
              <div className="user-profile">
                <div className="user-avatar">
                  {doctorProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div className="user-info">
                  <span className="user-name">{doctorProfile?.name || user?.email}</span>
                  {doctorProfile?.role && (
                    <span className="user-role">{doctorProfile.role}</span>
                  )}
                </div>
                <button className="logout-btn" onClick={signOut} title="Sign out">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
      />
      
      <main className="main-content">
        <div className="dashboard">
          <div className="month-selector">
            <button className="month-nav" onClick={() => navigateMonth('prev')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2 className="current-month">{MONTHS[month]} {year}</h2>
            <button className="month-nav" onClick={() => navigateMonth('next')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          
          <div className="status-bar">
            <div className="status-info">
              <div className="status-circle">
                <svg viewBox="0 0 36 36" className="progress-ring">
                  <path className="progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="progress-fill" strokeDasharray={`${(submittedCount / doctors.length) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="progress-text">{submittedCount}/{doctors.length}</span>
              </div>
              <div className="status-text">
                <h3>Submissions</h3>
                <p>{doctors.length - submittedCount} doctors remaining</p>
              </div>
            </div>
            
            <button className={`generate-btn ${isGenerating ? 'loading' : ''}`} onClick={handleGenerateRoster} disabled={isGenerating}>
              {isGenerating ? (<><div className="spinner" /><span>Generating...</span></>) : (<><Calendar size={18} /><span>Generate Roster</span></>)}
            </button>
          </div>
          
          {hasGenerated && (
            <div className="generated-ctas">
              <div className="roster-cta">
                <div className="cta-content">
                  <Calendar size={24} />
                  <div>
                    <h3>View Full Roster</h3>
                    <p>See the complete monthly schedule for all doctors</p>
                  </div>
                </div>
                <button className="cta-btn roster" onClick={() => setCurrentView('roster')}>
                  Open Roster
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="handover-cta">
                <div className="cta-content">
                  <Clock size={24} />
                  <div>
                    <h3>Quick Handover View</h3>
                    <p>See today's and tomorrow's on-call team</p>
                  </div>
                </div>
                <button className="cta-btn" onClick={() => setCurrentView('handover')}>
                  Open Handover
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
          
          <div className="teams-section">
            {Object.entries(doctorsByTeam).map(([team, members]) => (
              <div key={team} className="team-group">
                <div className="team-title-row">
                  <ShiftBadge shift={team} />
                  <span className="team-label">{SHIFT_TYPES[team]?.description || team}</span>
                  <span className="min-staff">Min: {MINIMUM_STAFFING[team]}/day</span>
                </div>
                <div className="team-doctors">
                  {members.map(doctor => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      hasSubmitted={requests[doctor.id] && Object.keys(requests[doctor.id]).length > 0}
                      requestSummary={getRequestSummary(doctor.id)}
                      onClick={() => { setSelectedDoctor(doctor); setCurrentView('availability'); }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  .app-container {
    min-height: 100vh;
    background: #F8F9FA;
    font-family: 'Inter', sans-serif;
    color: #1E293B;
  }
  
  .app-header {
    background: #FFFFFF;
    border-bottom: 1px solid #E2E8F0;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .header-content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 16px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
  }
  
  .logo { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
  
  .logo-icon {
    width: 44px; height: 44px;
    background: #0F766E;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: white;
  }
  
  .logo-text h1 {
    font-size: 20px; font-weight: 600;
    color: #1E293B;
  }
  
  .logo-text span { font-size: 12px; color: #64748B; }
  
  .header-nav { display: flex; gap: 6px; flex-wrap: wrap; }
  
  /* User Menu Styles */
  .user-menu {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  
  .db-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .db-status.offline {
    background: #FEF3C7;
    color: #92400E;
    border: 1px solid #FCD34D;
  }
  
  .db-status.online {
    background: #D1FAE5;
    color: #065F46;
    border: 1px solid #6EE7B7;
  }
  
  .login-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%);
    border: none;
    border-radius: 8px;
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  
  .login-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px 6px 6px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-weight: 600;
    font-size: 14px;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
  }
  
  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: #1E293B;
  }
  
  .user-role {
    font-size: 11px;
    color: #64748B;
    text-transform: capitalize;
  }
  
  .logout-btn {
    width: 32px;
    height: 32px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    color: #64748B;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-left: 4px;
    padding: 0;
  }
  
  .logout-btn svg {
    width: 16px;
    height: 16px;
    display: block;
  }
  
  .logout-btn:hover {
    background: #FEE2E2;
    border-color: #FECACA;
  }
  
  .logout-btn:hover svg {
    stroke: #DC2626;
  }
  
  .nav-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    color: #64748B;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
  }
  
  .nav-btn:hover {
    background: #F1F5F9;
    border-color: #CBD5E1;
    color: #475569;
  }
  
  .nav-btn.active {
    background: #0F766E;
    border-color: #0F766E;
    color: #FFFFFF;
  }
  
  .nav-btn.handover-nav {
    background: #FFFFFF;
    border-color: #E2E8F0;
    color: #64748B;
  }
  
  .nav-btn.handover-nav:hover {
    background: #F1F5F9;
    border-color: #CBD5E1;
    color: #475569;
  }
  
  .nav-btn.handover-nav.active {
    background: #0F766E;
    border-color: #0F766E;
    color: #FFFFFF;
  }
  
  .main-content { max-width: 1600px; margin: 0 auto; padding: 32px 24px; }
  
  .dashboard { display: flex; flex-direction: column; gap: 28px; }
  
  .month-selector { display: flex; align-items: center; justify-content: center; gap: 28px; }
  
  .month-nav {
    width: 48px; height: 48px;
    border-radius: 10px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    color: #374151;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    padding: 0;
  }
  
  .month-nav svg {
    width: 24px;
    height: 24px;
    display: block;
  }
  
  .month-nav:hover { 
    background: #EDF1F5; 
    border-color: #3A5A7A;
  }
  
  .current-month {
    font-size: 26px; font-weight: 600;
    min-width: 240px; text-align: center;
    color: #1E293B;
  }
  
  .status-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 20px 28px;
    background: #FFFFFF;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
  }
  
  .status-info { display: flex; align-items: center; gap: 20px; }
  
  .status-circle { position: relative; width: 72px; height: 72px; }
  
  .progress-ring { transform: rotate(-90deg); }
  
  .progress-bg { fill: none; stroke: #E2E8F0; stroke-width: 3; }
  
  .progress-fill {
    fill: none; stroke: #0F766E; stroke-width: 3;
    stroke-linecap: round; transition: stroke-dasharray 0.5s ease;
  }
  
  .progress-text {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 15px; font-weight: 600;
    font-family: 'Inter', sans-serif;
    color: #0F766E;
  }
  
  .status-text h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; color: #1E293B; }
  .status-text p { font-size: 13px; color: #64748B; }
  
  .generate-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 28px;
    background: #0F766E;
    border: none; border-radius: 8px;
    color: white; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
    font-family: inherit;
  }
  
  .generate-btn:hover:not(:disabled) {
    background: #0D6D65;
    transform: translateY(-1px);
  }
  
  .generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  
  .spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin { to { transform: rotate(360deg); } }
  
  /* Generated CTAs */
  .generated-ctas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
  }
  
  .roster-cta, .handover-cta {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px;
    border-radius: 10px;
    flex-wrap: wrap;
    gap: 12px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
  }
  
  .roster-cta .cta-content,
  .handover-cta .cta-content { color: #0F766E; }
  
  .cta-content { display: flex; align-items: center; gap: 12px; }
  .cta-content h3 { font-size: 14px; font-weight: 600; margin-bottom: 2px; color: #1E293B; }
  .cta-content p { font-size: 12px; color: #64748B; }
  
  .cta-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer; transition: all 0.15s;
    font-family: inherit;
    font-size: 13px;
    white-space: nowrap;
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
    color: #475569;
  }
  
  .cta-btn:hover {
    background: #E2E8F0;
    color: #1E293B;
  }
  
  .cta-btn.roster,
  .handover-cta .cta-btn {
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
    color: #475569;
  }
  
  .cta-btn.roster:hover,
  .handover-cta .cta-btn:hover {
    background: #E2E8F0;
    color: #1E293B;
  }
  
  /* Teams */
  .teams-section { display: flex; flex-direction: column; gap: 20px; }
  
  .team-group {
    background: #FFFFFF;
    border-radius: 10px; padding: 20px;
    border: 1px solid #E2E8F0;
  }
  
  .team-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .team-label { font-size: 14px; font-weight: 600; color: #1E293B; }
  .min-staff {
    margin-left: auto; font-size: 11px; color: #64748B;
    background: #F8FAFC;
    padding: 4px 10px; border-radius: 4px;
    border: 1px solid #E2E8F0;
  }
  
  .team-doctors { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
  
  .doctor-card {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    background: #F8FAFC;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
    cursor: pointer; transition: all 0.15s;
  }
  
  .doctor-card:hover {
    background: #FFFFFF;
    border-color: #0F766E;
  }
  
  .doctor-card.submitted { border-color: #059669; background: #FFFFFF; }
  
  .card-avatar {
    width: 40px; height: 40px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 600;
    color: white;
  }
  
  .card-info { flex: 1; min-width: 0; }
  .card-info h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #1E293B; }
  .card-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .points { font-size: 12px; color: #64748B; font-family: 'Inter', sans-serif; }
  
  .request-badges { display: flex; gap: 4px; }
  .req-badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 500; }
  .req-badge.al { background: #ECFDF5; color: #059669; }
  .req-badge.cb { background: #F1F5F9; color: #475569; }
  .req-badge.cr { background: #FEF3C7; color: #92400E; }
  
  .status-icon.done { color: #059669; }
  .status-icon.pending { color: #64748B; }
  
  .shift-badge {
    padding: 4px 8px; border-radius: 4px;
    font-size: 10px; font-weight: 600;
    letter-spacing: 0.3px; text-transform: uppercase;
    font-family: 'Inter', sans-serif;
    display: inline-block;
  }
  
  .shift-badge.small { padding: 2px 6px; font-size: 9px; }
  
  /* Availability View */
  .availability-view { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
  
  .availability-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 32px; }
  .header-info h2 { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #1F2933; }
  .doctor-meta { display: flex; align-items: center; gap: 16px; }
  .cumulative-points { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #3A5A7A; }
  
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    color: #64748B; cursor: pointer;
    font-family: inherit; font-size: 13px; font-weight: 500;
    transition: all 0.15s;
  }
  
  .back-btn:hover { background: #F1F5F9; color: #1E293B; border-color: #CBD5E1; }
  
  .availability-controls {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px; flex-wrap: wrap; gap: 16px;
  }
  
  .type-selector { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .control-label { font-size: 14px; color: #6B7280; font-weight: 500; }
  .type-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
  
  .type-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 20px; border-radius: 8px;
    font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit; border: 2px solid;
  }
  
  .type-btn:hover { transform: translateY(-2px); }
  
  .request-summary { display: flex; gap: 16px; padding: 12px 20px; background: #FFFFFF; border-radius: 10px; border: 1px solid #E5E7EB; }
  .summary-item { display: flex; align-items: center; gap: 6px; }
  .summary-item span { font-size: 12px; color: #6B7280; }
  .summary-item strong { font-size: 16px; font-family: 'Inter', sans-serif; color: #3A5A7A; }
  
  .save-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.3s;
    opacity: 0;
  }
  
  .save-status.saving {
    opacity: 1;
    background: #EFF6FF;
    color: #2563EB;
  }
  
  .save-status.saved {
    opacity: 1;
    background: #D1FAE5;
    color: #065F46;
  }
  
  .save-status.error {
    opacity: 1;
    background: #FEE2E2;
    color: #DC2626;
  }
  
  .save-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(37, 99, 235, 0.2);
    border-top-color: #2563EB;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  .calendar-grid {
    background: #FFFFFF;
    border-radius: 12px; padding: 24px;
    border: 1px solid #E5E7EB;
  }
  
  .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px; }
  .day-header { text-align: center; font-size: 12px; font-weight: 600; color: #6B7280; padding: 10px; text-transform: uppercase; }
  .calendar-body { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  
  .day-cell {
    aspect-ratio: 1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 4px;
    background: #F8F9FA;
    border-radius: 10px; border: 2px solid transparent;
    cursor: pointer; transition: all 0.2s;
    min-height: 80px;
  }
  
  .day-cell:hover:not(.empty) {
    background: #EDF1F5;
    border-color: #3A5A7A;
  }
  
  .day-cell.weekend { background: #FBF6E6; }
  .day-cell.marked { border-width: 2px; }
  .day-cell.empty { background: transparent; cursor: default; }
  .day-number { font-size: 18px; font-weight: 700; color: #1F2933; }
  
  /* Handover View */
  .handover-view { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
  
  .handover-header { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
  .header-title { display: flex; align-items: center; gap: 10px; color: #0F766E; }
  .header-title h2 { font-size: 24px; font-weight: 600; color: #1E293B; }
  
  .date-navigator {
    display: flex; align-items: center; justify-content: center; gap: 16px;
    margin-bottom: 32px;
  }
  
  .date-navigator button {
    width: 40px; height: 40px;
    border-radius: 8px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    color: #6B7280; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    padding: 0;
  }
  
  .date-nav-btn {
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    background: #FFFFFF !important;
    border: 1px solid #E5E7EB !important;
  }
  
  .date-nav-btn:hover {
    background: #F8F9FA !important;
    border-color: #3A5A7A !important;
  }
  
  .nav-arrow {
    width: 20px !important;
    height: 20px !important;
    display: block !important;
    stroke: #374151 !important;
    fill: none !important;
  }
  
  .date-navigator button:hover { background: #F8F9FA; color: #1F2933; border-color: #3A5A7A; }
  
  .current-selection { text-align: center; }
  .nav-label { display: block; font-size: 12px; color: #6B7280; margin-bottom: 4px; }
  .nav-date { font-size: 18px; font-weight: 700; color: #1F2933; }
  
  .today-btn {
    padding: 8px 16px !important;
    width: auto !important;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
  }
  
  .handover-cards { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
  
  .handover-arrow {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    color: #6B7280; padding: 8px 0;
  }
  
  .handover-arrow span { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  
  .handover-card {
    background: #FFFFFF;
    border-radius: 12px; padding: 24px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .handover-card.today { border-left: 4px solid #7FAE9A; }
  .handover-card.tomorrow { border-left: 4px solid #3A5A7A; }
  .handover-card.empty { opacity: 0.6; }
  
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px; padding-bottom: 16px;
    border-bottom: 1px solid #E5E7EB;
  }
  
  .card-label {
    font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px;
    color: #6B7280;
  }
  
  .card-date { font-size: 14px; font-weight: 600; color: #1F2933; }
  .card-empty { text-align: center; color: #6B7280; padding: 40px; }
  
  .oncall-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
  
  .oncall-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px;
    background: #F8F9FA;
    border-radius: 8px;
  }
  
  .tier-info { display: flex; align-items: center; gap: 12px; }
  .tier-emoji { font-size: 20px; }
  .tier-details { display: flex; flex-direction: column; }
  .tier-name { font-size: 14px; font-weight: 700; color: #1F2933; }
  .tier-desc { font-size: 11px; color: #6B7280; }
  
  .doctor-info { display: flex; align-items: center; gap: 10px; }
  .doctor-name { font-size: 14px; font-weight: 600; color: #1F2933; }
  .not-assigned { font-size: 13px; color: #6B7280; font-style: italic; }
  
  .status-section { margin-bottom: 16px; }
  .status-header { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6B7280; margin-bottom: 8px; }
  .status-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .status-pill { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .status-pill.postcall { background: #EAF3EF; color: #355E52; }
  .status-pill.leave { background: #EDF1F5; color: #3A5A7A; }
  
  .copy-btn {
    width: 100%; padding: 12px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: #F8F9FA;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    color: #6B7280; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit;
  }
  
  .copy-btn:hover { background: #EDF1F5; color: #1F2933; }
  .copy-btn.copied { background: #EAF3EF; border-color: #7FAE9A; color: #355E52; }
  
  /* Search */
  .search-section {
    background: #FFFFFF;
    border-radius: 12px; padding: 24px;
    border: 1px solid #E5E7EB;
  }
  
  .search-header { display: flex; align-items: center; gap: 10px; color: #3A5A7A; margin-bottom: 16px; }
  .search-header h3 { font-size: 16px; font-weight: 600; color: #1F2933; }
  
  .search-input-wrapper { position: relative; margin-bottom: 16px; }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #6B7280; }
  
  .search-input {
    width: 100%; padding: 14px 14px 14px 46px;
    background: #F8F9FA;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    color: #1F2933; font-size: 15px;
    font-family: inherit;
    transition: all 0.2s;
  }
  
  .search-input:focus { outline: none; border-color: #3A5A7A; background: #FFFFFF; }
  .search-input::placeholder { color: #6B7280; }
  
  .clear-search {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    width: 24px; height: 24px;
    background: #E5E7EB;
    border: none; border-radius: 50%;
    color: #6B7280; font-size: 16px;
    cursor: pointer; transition: all 0.2s;
  }
  
  .clear-search:hover { background: #D1D5DB; color: #1F2933; }
  
  .search-results { display: flex; flex-direction: column; gap: 12px; }
  
  .search-result-card {
    background: #F8F9FA;
    border-radius: 10px; padding: 16px;
    border: 1px solid #E5E7EB;
  }
  
  .result-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .result-name { font-size: 16px; font-weight: 600; color: #1F2933; }
  
  .result-calls { }
  .calls-label { display: block; font-size: 12px; color: #6B7280; margin-bottom: 8px; }
  .calls-list { display: flex; flex-wrap: wrap; gap: 8px; }
  
  .call-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    background: #FFFFFF;
    border-radius: 6px;
    border: 1px solid #E5E7EB;
  }
  
  .call-date { font-size: 12px; color: #6B7280; font-family: 'Inter', sans-serif; }
  .no-calls { font-size: 13px; color: #6B7280; font-style: italic; }
  .no-results { text-align: center; color: #6B7280; padding: 20px; }
  
  /* Nav button variants - unified styling */
  .nav-btn.roster-nav,
  .nav-btn.mycalls-nav,
  .nav-btn.coverage-nav,
  .nav-btn.abx-nav {
    background: #FFFFFF;
    border-color: #E2E8F0;
    color: #64748B;
  }
  
  .nav-btn.roster-nav:hover,
  .nav-btn.mycalls-nav:hover,
  .nav-btn.coverage-nav:hover,
  .nav-btn.abx-nav:hover {
    background: #F1F5F9;
    border-color: #CBD5E1;
    color: #475569;
  }
  
  .nav-btn.roster-nav.active,
  .nav-btn.mycalls-nav.active,
  .nav-btn.coverage-nav.active,
  .nav-btn.abx-nav.active {
    background: #0F766E;
    border-color: #0F766E;
    color: #FFFFFF;
  }
  
  .nav-btn.admin-nav {
    background: #FEF3C7;
    border-color: #FCD34D;
    color: #92400E;
  }
  
  .nav-btn.admin-nav:hover {
    background: #FDE68A;
    border-color: #F59E0B;
    color: #78350F;
  }
  
  .nav-btn.admin-nav.active {
    background: #F59E0B;
    border-color: #F59E0B;
    color: #FFFFFF;
  }
  
  /* ============ MY CALLS VIEW STYLES ============ */
  
  .mycalls-view { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
  
  .mycalls-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
  .mycalls-header .header-title { display: flex; align-items: center; gap: 10px; color: #0F766E; }
  .mycalls-header .header-title h2 { font-size: 24px; font-weight: 600; color: #1E293B; }
  
  .mycalls-month {
    text-align: center; margin-bottom: 24px;
  }
  
  .month-label {
    font-size: 18px; font-weight: 600; color: #3A5A7A;
    background: #EDF1F5;
    padding: 8px 24px; border-radius: 20px;
  }
  
  .doctor-selector {
    background: #FFFFFF;
    border-radius: 12px; padding: 24px;
    border: 1px solid #E5E7EB;
  }
  
  .selector-header { display: flex; align-items: center; gap: 10px; color: #3A5A7A; margin-bottom: 20px; }
  .selector-header h3 { font-size: 18px; font-weight: 600; color: #1F2933; }
  
  .doctor-list { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; max-height: 400px; overflow-y: auto; }
  
  .doctor-select-btn {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px;
    background: #F8F9FA;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    cursor: pointer; transition: all 0.2s;
    width: 100%; text-align: left;
    font-family: inherit;
    color: #1F2933;
  }
  
  .doctor-select-btn:hover {
    background: #FFFFFF;
    border-color: #3A5A7A;
    transform: translateX(4px);
  }
  
  .doc-avatar {
    width: 42px; height: 42px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700;
    color: white;
  }
  
  .doc-avatar.large { width: 56px; height: 56px; font-size: 22px; border-radius: 10px; }
  
  .doc-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .doc-name { font-size: 15px; font-weight: 600; color: #1F2933; }
  .doc-arrow { color: #6B7280; }
  
  .calls-display { }
  
  .selected-doctor-card {
    display: flex; align-items: center; gap: 16px;
    padding: 20px 24px;
    background: #FFFFFF;
    border-radius: 12px;
    border: 1px solid #E5E7EB;
    margin-bottom: 20px;
  }
  
  .doc-details h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #1F2933; }
  .doc-details .doc-meta { display: flex; align-items: center; gap: 12px; }
  .cumulative { font-size: 13px; color: #6B7280; }
  
  .change-btn {
    padding: 8px 16px;
    background: #F8F9FA;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    color: #6B7280; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit;
  }
  
  .change-btn:hover { background: #EDF1F5; color: #1F2933; border-color: #3A5A7A; }
  
  .calls-summary {
    display: flex; justify-content: center; gap: 24px;
    padding: 20px;
    background: #FFFFFF;
    border-radius: 12px;
    border: 1px solid #E5E7EB;
    margin-bottom: 16px;
  }
  
  .view-toggle {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #F8F9FA;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    color: #6B7280;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  
  .toggle-btn:hover {
    background: #EDF1F5;
    color: #3A5A7A;
  }
  
  .toggle-btn.active {
    background: #3A5A7A;
    border-color: #3A5A7A;
    color: #FFFFFF;
  }
  
  .summary-stat { text-align: center; }
  .stat-value { display: block; font-size: 28px; font-weight: 700; color: #3A5A7A; font-family: 'Inter', sans-serif; }
  .stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; }
  
  .calls-list-section {
    background: #FFFFFF;
    border-radius: 12px; padding: 24px;
    border: 1px solid #E5E7EB;
  }
  
  .calls-list-section h4 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1F2933; }
  
  .calls-timeline { display: flex; flex-direction: column; gap: 10px; }
  
  .call-entry {
    display: flex; align-items: stretch; gap: 16px;
    padding: 16px;
    background: #F8F9FA;
    border-radius: 10px;
    border: 1px solid #E5E7EB;
    transition: all 0.2s;
  }
  
  .call-entry:hover { background: #FFFFFF; border-color: #3A5A7A; }
  .call-entry.weekend { background: #FBF6E6; border-color: #D6B656; }
  
  .call-date-col {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-width: 60px;
    padding: 8px 12px;
    background: #EDF1F5;
    border-radius: 8px;
  }
  
  .call-day-name { font-size: 11px; color: #6B7280; text-transform: uppercase; }
  .call-day-num { font-size: 24px; font-weight: 700; color: #1F2933; }
  .call-month-name { font-size: 11px; color: #6B7280; }
  
  .call-info-col { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
  
  .call-type-row { display: flex; align-items: center; gap: 10px; }
  .call-emoji { font-size: 18px; }
  .call-desc { font-size: 14px; color: #6B7280; }
  
  .call-meta-row { display: flex; align-items: center; gap: 10px; }
  .call-points { font-size: 13px; color: #355E52; font-weight: 600; font-family: 'Inter', sans-serif; }
  .weekend-tag { font-size: 11px; padding: 2px 8px; background: #FBF6E6; color: #7A5A1F; border-radius: 4px; }
  .holiday-tag { font-size: 11px; padding: 2px 8px; background: #F6EAEA; color: #7A2E2E; border-radius: 4px; }
  
  .no-calls-message {
    text-align: center; padding: 60px 20px;
    color: #6B7280;
  }
  
  .no-calls-message svg { margin-bottom: 16px; opacity: 0.5; }
  .no-calls-message h4 { font-size: 18px; font-weight: 600; color: #1F2933; margin-bottom: 8px; }
  .no-calls-message p { font-size: 14px; }
  
  /* My Calls Calendar View */
  .mycalls-calendar-section {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #E5E7EB;
    margin-bottom: 20px;
  }
  
  .mycalls-calendar-section h4 {
    font-size: 16px;
    font-weight: 600;
    color: #1F2933;
    margin-bottom: 16px;
  }
  
  .mycalls-calendar {
    background: #F8F9FA;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .mycalls-cal-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }
  
  .mycalls-cal-day-header {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    padding: 8px 4px;
    text-transform: uppercase;
  }
  
  .mycalls-cal-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  
  .mycalls-cal-cell {
    aspect-ratio: 1;
    min-height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: #FFFFFF;
    border-radius: 8px;
    border: 2px solid transparent;
    transition: all 0.2s;
    position: relative;
  }
  
  .mycalls-cal-cell.empty {
    background: transparent;
  }
  
  .mycalls-cal-cell.weekend {
    background: #FBF6E6;
  }
  
  .mycalls-cal-cell.has-call {
    border-width: 2px;
  }
  
  .mycalls-cal-cell.post-call {
    background: #EAF3EF;
  }
  
  .mycalls-cal-cell.on-leave {
    background: #EDF1F5;
  }
  
  .mycalls-cal-date {
    font-size: 14px;
    font-weight: 600;
    color: #1F2933;
  }
  
  .mycalls-cal-date.call-date {
    font-weight: 700;
  }
  
  .mycalls-cal-shift {
    display: flex;
    justify-content: center;
  }
  
  .cal-shift-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }
  
  .cal-status-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
  }
  
  .cal-status-badge.pc {
    background: #6B9A8A;
    color: white;
  }
  
  .cal-status-badge.al {
    background: #8AA1B4;
    color: white;
  }
  
  .mycalls-cal-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid #E5E7EB;
  }
  
  .cal-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .cal-legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  
  .cal-legend-text {
    font-size: 11px;
    color: #6B7280;
  }
  
  /* ============ WARD COVERAGE VIEW STYLES ============ */
  
  .coverage-view { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
  
  .coverage-header { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
  .coverage-header .header-title { display: flex; align-items: center; gap: 10px; color: #0F766E; }
  .coverage-header .header-title h2 { font-size: 24px; font-weight: 600; color: #1E293B; }
  
  .coverage-subtitle { text-align: center; margin-bottom: 28px; }
  .coverage-subtitle p { font-size: 15px; color: #6B7280; }
  
  .coverage-cards { display: flex; flex-direction: column; gap: 20px; }
  
  .coverage-card {
    background: #FFFFFF;
    border-radius: 12px;
    border: 1px solid #E5E7EB;
    overflow: hidden;
  }
  
  .coverage-card-header {
    display: flex; align-items: center; gap: 16px;
    padding: 20px 24px;
    background: #F8F9FA;
    border-bottom: 1px solid #E5E7EB;
  }
  
  .coverage-card-header .tier-emoji { font-size: 32px; }
  .coverage-card-header .tier-info h3 { font-size: 18px; font-weight: 700; margin-bottom: 4px; color: #1F2933; }
  .coverage-card-header .tier-info p { font-size: 13px; color: #6B7280; }
  
  .coverage-card-body { padding: 24px; }
  
  .wards-section, .responsibilities-section { margin-bottom: 20px; }
  .wards-section h4, .responsibilities-section h4 { font-size: 14px; font-weight: 600; color: #3A5A7A; margin-bottom: 12px; }
  
  .wards-list { display: flex; flex-direction: column; gap: 8px; }
  
  .ward-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    background: #F8F9FA;
    border-radius: 8px;
  }
  
  .ward-icon { font-size: 20px; }
  .ward-details { display: flex; flex-direction: column; }
  .ward-name { font-size: 14px; font-weight: 600; color: #1F2933; }
  .ward-notes { font-size: 12px; color: #6B7280; }
  
  .responsibilities-list {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 6px;
  }
  
  .responsibilities-list li {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: #1F2933;
    padding: 8px 12px;
    background: #F8F9FA;
    border-radius: 6px;
  }
  
  .responsibilities-list li::before {
    content: '•';
    color: #3A5A7A;
    font-weight: bold;
  }
  
  .coverage-footer {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 24px;
    padding: 16px;
    background: #F8F9FA;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
    color: #6B7280;
    font-size: 13px;
  }
  
  /* ============ ANTIBIOTIC GUIDELINES VIEW STYLES ============ */
  
  .abx-view { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
  
  .abx-header { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
  .abx-header .header-title { display: flex; align-items: center; gap: 10px; color: #0F766E; }
  .abx-header .header-title h2 { font-size: 24px; font-weight: 600; color: #1E293B; }
  
  .abx-disclaimer {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 18px;
    background: #F6EAEA;
    border: 1px solid #C46A6A;
    border-radius: 8px;
    color: #7A2E2E;
    font-size: 13px;
    margin-bottom: 24px;
  }
  
  .abx-view .search-input-wrapper { margin-bottom: 24px; }
  
  .system-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
  
  .system-card {
    display: flex; align-items: center; gap: 14px;
    padding: 18px 20px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    font-family: inherit;
    color: #1F2933;
  }
  
  .system-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #3A5A7A;
  }
  
  .system-icon {
    width: 48px; height: 48px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    background: #F8F9FA;
  }
  
  .system-name { flex: 1; font-size: 16px; font-weight: 600; }
  .system-count { font-size: 12px; color: #6B7280; }
  .system-arrow { color: #6B7280; }
  
  .condition-list { }
  
  .back-to-systems {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    background: #F8F9FA;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    color: #6B7280; font-size: 13px; font-weight: 500;
    cursor: pointer; margin-bottom: 20px;
    font-family: inherit;
    transition: all 0.2s;
  }
  
  .back-to-systems:hover { background: #EDF1F5; color: #1F2933; border-color: #3A5A7A; }
  
  .system-header {
    display: flex; align-items: center; gap: 16px;
    padding: 20px 24px;
    border-radius: 10px;
    margin-bottom: 20px;
    background: #F8F9FA;
  }
  
  .system-icon-lg { font-size: 36px; }
  .system-header h3 { font-size: 24px; font-weight: 700; color: #1F2933; }
  
  .conditions { display: flex; flex-direction: column; gap: 16px; }
  
  .condition-card {
    background: #FFFFFF;
    border-radius: 10px;
    padding: 20px;
    border: 1px solid #E5E7EB;
  }
  
  .condition-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #E5E7EB;
  }
  
  .condition-header h4 { font-size: 16px; font-weight: 600; color: #1F2933; }
  
  .severity-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .severity-badge.mild { background: #EAF3EF; color: #355E52; }
  .severity-badge.moderate { background: #FBF6E6; color: #7A5A1F; }
  .severity-badge.severe { background: #F6EAEA; color: #7A2E2E; }
  .severity-badge.prophylaxis { background: #EDF1F5; color: #3A5A7A; }
  .severity-badge.treatment { background: #EDF1F5; color: #3A5A7A; }
  
  .treatment-section { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
  
  .treatment-row {
    display: flex; gap: 12px;
    padding: 10px 14px;
    background: #F8F9FA;
    border-radius: 8px;
  }
  
  .treatment-label {
    min-width: 80px;
    font-size: 12px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
  }
  
  .treatment-value {
    font-size: 14px;
    color: #1F2933;
    font-family: 'Inter', sans-serif;
  }
  
  .treatment-row.first-line { border-left: 3px solid #7FAE9A; }
  .treatment-row.alternative { border-left: 3px solid #D6B656; }
  .treatment-row.duration { border-left: 3px solid #3A5A7A; }
  
  .condition-notes {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px;
    background: #F8F9FA;
    border-radius: 6px;
    color: #6B7280;
    font-size: 13px;
  }
  
  /* ============ MONTHLY ROSTER VIEW STYLES ============ */
  
  .roster-view { max-width: 100%; margin: 0 auto; padding: 32px 24px; overflow-x: auto; }
  
  .roster-header { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
  .roster-header .header-title { display: flex; align-items: center; gap: 10px; color: #0F766E; }
  .roster-header .header-title h2 { font-size: 24px; font-weight: 600; color: #1E293B; }
  
  .roster-month-label { text-align: center; margin-bottom: 20px; }
  .roster-month-label h3 {
    font-size: 22px; font-weight: 700;
    color: #3A5A7A;
    display: inline-block;
    padding: 8px 24px;
    background: #EDF1F5;
    border-radius: 20px;
  }
  
  .roster-legend {
    display: flex; justify-content: center; flex-wrap: wrap; gap: 16px;
    margin-bottom: 24px;
    padding: 14px 20px;
    background: #FFFFFF;
    border-radius: 10px;
    border: 1px solid #E5E7EB;
  }
  
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .legend-color { width: 16px; height: 16px; border-radius: 4px; }
  .legend-label { font-size: 12px; color: #6B7280; font-weight: 600; }
  
  .roster-grid-container {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #E5E7EB;
    overflow-x: auto;
    margin-bottom: 24px;
  }
  
  .roster-grid { display: table; width: 100%; min-width: max-content; border-collapse: collapse; }
  
  .grid-header-row, .grid-row { display: table-row; }
  
  .grid-cell {
    display: table-cell;
    padding: 8px 4px;
    text-align: center;
    vertical-align: middle;
    border-bottom: 1px solid #E5E7EB;
  }
  
  .doctor-header {
    text-align: left;
    padding-left: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6B7280;
    min-width: 120px;
    position: sticky;
    left: 0;
    background: #FFFFFF;
    z-index: 10;
  }
  
  .day-header {
    min-width: 42px;
    padding: 8px 2px;
  }
  
  .day-header .day-name { display: block; font-size: 10px; color: #6B7280; text-transform: uppercase; }
  .day-header .day-num { display: block; font-size: 14px; font-weight: 700; color: #1F2933; }
  .day-header.weekend { background: #FBF6E6; }
  .day-header.weekend .day-num { color: #7A5A1F; }
  .day-header.holiday { background: #F6EAEA; }
  .day-header.holiday .day-num { color: #7A2E2E; }
  
  .stats-header {
    min-width: 50px;
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
  }
  
  .doctor-cell {
    text-align: left;
    padding-left: 12px;
    min-width: 120px;
    position: sticky;
    left: 0;
    background: #F8F9FA;
    z-index: 10;
  }
  
  .doctor-name-grid {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #1F2933;
    margin-bottom: 2px;
  }
  
  .shift-cell {
    min-width: 42px;
    transition: all 0.15s;
  }
  
  .shift-cell.weekend { background: #FFFBEB; }
  
  .shift-mini {
    display: inline-block;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
  }
  
  .stats-cell {
    min-width: 50px;
    font-size: 13px;
    font-weight: 600;
    color: #6B7280;
    font-family: 'Inter', sans-serif;
  }
  
  .stats-cell.points { color: #355E52; }
  
  .summary-row { background: #EDF1F5; }
  .summary-row .doctor-cell { background: #E5E7EB; }
  
  .summary-label {
    font-size: 11px;
    font-weight: 600;
    color: #3A5A7A;
    text-transform: uppercase;
  }
  
  .summary-cell { padding: 6px 2px; }
  
  .summary-stack { display: flex; justify-content: center; gap: 2px; }
  
  .summary-mini {
    width: 18px; height: 18px;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700;
    color: white;
  }
  
  /* Stats Section */
  .roster-stats-section {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #E5E7EB;
  }
  
  .roster-stats-section h4 {
    font-size: 16px; font-weight: 600;
    color: #1F2933;
    margin-bottom: 16px;
  }
  
  .stats-table { overflow-x: auto; }
  
  .stats-header-row, .stats-row { display: flex; align-items: center; }
  
  .stats-header-row {
    padding: 10px 0;
    border-bottom: 1px solid #E5E7EB;
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
  }
  
  .stats-row {
    padding: 12px 0;
    border-bottom: 1px solid #F8F9FA;
    transition: background 0.15s;
  }
  
  .stats-row:hover { background: #F8F9FA; }
  
  .stats-col {
    flex: 1;
    min-width: 50px;
    text-align: center;
    font-size: 13px;
    color: #6B7280;
    font-family: 'Inter', sans-serif;
  }
  
  .stats-col.name {
    flex: 2;
    min-width: 150px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    color: #1F2933;
  }
  
  .stats-col.highlight { color: #355E52; font-weight: 600; }
  
  /* Roster View Toggle */
  .roster-view-toggle {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  /* Weekly Roster View */
  .weekly-roster-container {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #E5E7EB;
    margin-bottom: 24px;
  }
  
  .week-navigator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 24px;
  }
  
  .week-nav-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 0;
  }
  
  .week-nav-btn svg {
    width: 20px;
    height: 20px;
    display: block;
  }
  
  .week-nav-btn:hover:not(:disabled) {
    background: #EDF1F5;
    border-color: #3A5A7A;
  }
  
  .week-nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .week-label {
    text-align: center;
    min-width: 160px;
  }
  
  .week-title {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #1F2933;
    margin-bottom: 2px;
  }
  
  .week-dates {
    display: block;
    font-size: 13px;
    color: #6B7280;
  }
  
  .weekly-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .weekly-header-row, .weekly-row {
    display: flex;
    gap: 2px;
  }
  
  .weekly-cell {
    padding: 12px 8px;
    text-align: center;
  }
  
  .weekly-cell.doctor-col {
    flex: 0 0 180px;
    min-width: 180px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #F8F9FA;
    border-radius: 6px;
  }
  
  .weekly-cell.day-col, .weekly-cell.shift-col {
    flex: 1;
    min-width: 100px;
    border-radius: 6px;
  }
  
  .weekly-header-row .weekly-cell {
    background: #F8F9FA;
    font-weight: 600;
  }
  
  .weekly-header-row .day-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .weekly-day-name {
    font-size: 12px;
    color: #6B7280;
    text-transform: uppercase;
  }
  
  .weekly-day-num {
    font-size: 18px;
    font-weight: 700;
    color: #1F2933;
  }
  
  .weekly-header-row .day-col.weekend {
    background: #FBF6E6;
  }
  
  .weekly-header-row .day-col.weekend .weekly-day-num {
    color: #7A5A1F;
  }
  
  .weekly-header-row .day-col.holiday {
    background: #F6EAEA;
  }
  
  .weekly-header-row .day-col.empty {
    background: #FAFAFA;
  }
  
  .weekly-row .shift-col {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    min-height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .weekly-row .shift-col.weekend {
    background: #FFFBEB;
    border-color: #D6B656;
  }
  
  .weekly-row .shift-col.empty {
    background: #FAFAFA;
    border-color: #F0F0F0;
  }
  
  .weekly-doc-avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: white;
  }
  
  .weekly-doc-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .weekly-doc-name {
    font-size: 14px;
    font-weight: 600;
    color: #1F2933;
  }
  
  .weekly-shift-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .weekly-shift-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
  }
  
  .weekly-shift-desc {
    font-size: 10px;
    color: #6B7280;
  }
  
  .weekly-row.summary-row .doctor-col {
    background: #EDF1F5;
  }
  
  .weekly-summary-label {
    font-size: 12px;
    font-weight: 600;
    color: #3A5A7A;
    text-transform: uppercase;
  }
  
  .weekly-row.summary-row .shift-col {
    background: #F8F9FA;
  }
  
  .weekly-row.summary-row .shift-col.summary {
    min-height: auto;
    padding: 10px 6px;
  }
  
  .weekly-oncall-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }
  
  .weekly-oncall-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  
  .oncall-tier {
    font-weight: 600;
    min-width: 30px;
  }
  
  .oncall-name {
    color: #1F2933;
  }
  
  @media (max-width: 768px) {
    .header-content { flex-direction: column; gap: 16px; }
    .header-nav { flex-wrap: wrap; justify-content: center; }
    .status-bar { flex-direction: column; gap: 20px; text-align: center; }
    .team-doctors { grid-template-columns: 1fr; }
    .current-month { font-size: 22px; min-width: auto; }
    .handover-cta { flex-direction: column; text-align: center; gap: 16px; }
    .system-grid { grid-template-columns: 1fr; }
    .calls-summary { flex-wrap: wrap; }
    .selected-doctor-card { flex-direction: column; text-align: center; }
  }
`;
