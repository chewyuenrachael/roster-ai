import React, { useState, useMemo } from 'react';
import { Calendar, Users, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Sparkles, Eye, TrendingUp, Award, Shield, Zap, Info, Filter, BarChart3, Lightbulb, Search, Copy, ArrowDown, Clock, UserCheck, Coffee } from 'lucide-react';

// ============ CONFIGURATION ============

// Configurable HO Tiers (1-11)
const HO_TIERS_CONFIG = {
  'HO1': { enabled: true, label: 'HO1', description: 'Active On-Call', postCall: true, color: '#ef4444', emoji: '🔴' },
  'HO2': { enabled: true, label: 'HO2', description: 'Passive On-Call', postCall: true, color: '#f97316', emoji: '🟠' },
  'HO3': { enabled: true, label: 'HO3', description: 'Handover HO', postCall: false, color: '#eab308', emoji: '🟡' },
  'HO4': { enabled: true, label: 'HO4', description: 'Additional Coverage', postCall: false, color: '#84cc16', emoji: '🟢' },
  'HO5': { enabled: false, label: 'HO5', description: 'Custom Role 5', postCall: false, color: '#06b6d4', emoji: '🔵' },
  'HO6': { enabled: false, label: 'HO6', description: 'Custom Role 6', postCall: false, color: '#8b5cf6', emoji: '🟣' },
  'HO7': { enabled: false, label: 'HO7', description: 'Custom Role 7', postCall: false, color: '#ec4899', emoji: '💗' },
  'HO8': { enabled: false, label: 'HO8', description: 'Custom Role 8', postCall: false, color: '#14b8a6', emoji: '💚' },
  'HO9': { enabled: false, label: 'HO9', description: 'Custom Role 9', postCall: false, color: '#f43f5e', emoji: '❤️' },
  'HO10': { enabled: false, label: 'HO10', description: 'Custom Role 10', postCall: false, color: '#6366f1', emoji: '💜' },
  'HO11': { enabled: false, label: 'HO11', description: 'Custom Role 11', postCall: false, color: '#0ea5e9', emoji: '💙' },
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

// Shift types and colors
const SHIFT_TYPES = {
  ...Object.fromEntries(
    Object.entries(HO_TIERS_CONFIG).map(([key, config]) => [
      key, 
      { label: config.label, color: config.color, textColor: '#fff', description: config.description, category: 'call' }
    ])
  ),
  'PC': { label: 'PC', color: '#10b981', textColor: '#fff', description: 'Post-Call', category: 'rest' },
  'AL': { label: 'AL', color: '#6366f1', textColor: '#fff', description: 'Annual Leave', category: 'leave' },
  'CB': { label: 'CB', color: '#64748b', textColor: '#fff', description: 'Call Block', category: 'request' },
  'CR': { label: 'CR', color: '#14b8a6', textColor: '#fff', description: 'Call Request', category: 'request' },
  // Teams
  'NES': { label: 'NES', color: '#3b82f6', textColor: '#fff', description: 'Neurosurgery', category: 'team' },
  'VAS': { label: 'VAS', color: '#06b6d4', textColor: '#fff', description: 'Vascular', category: 'team' },
  'CLR': { label: 'CLR', color: '#22c55e', textColor: '#fff', description: 'Colorectal', category: 'team' },
  'ESU': { label: 'ESU', color: '#a855f7', textColor: '#fff', description: 'Emergency Surgical Unit', category: 'team' },
  'PRAS': { label: 'PRAS', color: '#f43f5e', textColor: '#fff', description: 'Plastic Surgery', category: 'team' },
  'HPB': { label: 'HPB', color: '#0ea5e9', textColor: '#fff', description: 'Hepatobiliary', category: 'team' },
  'UGI': { label: 'UGI', color: '#84cc16', textColor: '#1f2937', description: 'Upper GI', category: 'team' },
  'BES': { label: 'BES', color: '#fbbf24', textColor: '#1f2937', description: 'Breast/Endocrine', category: 'team' },
  'URO': { label: 'URO', color: '#f472b6', textColor: '#fff', description: 'Urology', category: 'team' },
};

const MINIMUM_STAFFING = {
  'NES': 2, 'VAS': 2, 'CLR': 2, 'ESU': 3, 'PRAS': 1,
  'HPB': 1, 'UGI': 2, 'BES': 1, 'URO': 2,
};

const INITIAL_DOCTORS = [
  { id: 1, name: 'Sarah Chen', team: 'NES', cumulativePoints: 17.5 },
  { id: 2, name: 'Marcus Wong', team: 'VAS', cumulativePoints: 16.0 },
  { id: 3, name: 'Emily Tan', team: 'ESU', cumulativePoints: 15.0 },
  { id: 4, name: 'Raj Sharma', team: 'PRAS', cumulativePoints: 17.0 },
  { id: 5, name: 'Jessica Lim', team: 'URO', cumulativePoints: 15.5 },
  { id: 6, name: 'David Ng', team: 'ESU', cumulativePoints: 14.5 },
  { id: 7, name: 'Michelle Goh', team: 'ESU', cumulativePoints: 17.0 },
  { id: 8, name: 'Kevin Teo', team: 'URO', cumulativePoints: 16.5 },
  { id: 9, name: 'Amanda Lee', team: 'ESU', cumulativePoints: 16.0 },
  { id: 10, name: 'Ryan Koh', team: 'PRAS', cumulativePoints: 16.0 },
  { id: 11, name: 'Priya Nair', team: 'CLR', cumulativePoints: 16.0 },
  { id: 12, name: 'Jason Ong', team: 'BES', cumulativePoints: 16.0 },
  { id: 13, name: 'Nicole Yeo', team: 'ESU', cumulativePoints: 17.0 },
  { id: 14, name: 'Benjamin Chua', team: 'CLR', cumulativePoints: 15.5 },
  { id: 15, name: 'Vanessa Loh', team: 'UGI', cumulativePoints: 16.5 },
  { id: 16, name: 'Andrew Sim', team: 'VAS', cumulativePoints: 15.0 },
  { id: 17, name: 'Rachel Foo', team: 'HPB', cumulativePoints: 17.0 },
  { id: 18, name: 'Daniel Pang', team: 'NES', cumulativePoints: 15.5 },
  { id: 19, name: 'Samantha Ho', team: 'HPB', cumulativePoints: 9.0 },
  { id: 20, name: 'Timothy Seah', team: 'VAS', cumulativePoints: 5.0 },
  { id: 21, name: 'Grace Tan', team: 'UGI', cumulativePoints: 6.0 },
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
        <button onClick={() => {
          const prev = new Date(selectedDate);
          prev.setDate(prev.getDate() - 1);
          setSelectedDate(prev);
        }}>
          <ChevronLeft size={20} />
        </button>
        <div className="current-selection">
          <span className="nav-label">Viewing from</span>
          <span className="nav-date">{formatDateShort(selectedDate)}</span>
        </div>
        <button onClick={() => {
          const next = new Date(selectedDate);
          next.setDate(next.getDate() + 1);
          setSelectedDate(next);
        }}>
          <ChevronRight size={20} />
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

// ============ OTHER COMPONENTS (Abbreviated for space) ============

const DoctorAvailabilityView = ({ doctor, month, year, requests, setRequests, onBack }) => {
  const days = generateMonthDays(year, month);
  const [selectedType, setSelectedType] = useState('AL');
  
  const docRequests = requests[doctor.id] || {};
  const cbCount = Object.values(docRequests).filter(r => r === 'CB').length;
  const crCount = Object.values(docRequests).filter(r => r === 'CR').length;
  const alCount = Object.values(docRequests).filter(r => r === 'AL').length;
  
  const toggleDay = (dayNum) => {
    setRequests(prev => {
      const docReq = prev[doctor.id] || {};
      const current = docReq[dayNum];
      if (current === selectedType) {
        const newDocReq = { ...docReq };
        delete newDocReq[dayNum];
        return { ...prev, [doctor.id]: newDocReq };
      }
      return { ...prev, [doctor.id]: { ...docReq, [dayNum]: selectedType } };
    });
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
  const [doctors] = useState(INITIAL_DOCTORS);
  const [requests, setRequests] = useState({});
  const [allocation, setAllocation] = useState({});
  const [callPoints, setCallPoints] = useState({});
  const [callCounts, setCallCounts] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
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
              <button className="nav-btn handover-nav" onClick={() => setCurrentView('handover')}>
                <Clock size={18} /><span>Handover</span>
              </button>
            )}
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        <div className="dashboard">
          <div className="month-selector">
            <button className="month-nav" onClick={() => navigateMonth('prev')}><ChevronLeft size={24} /></button>
            <h2 className="current-month">{MONTHS[month]} {year}</h2>
            <button className="month-nav" onClick={() => navigateMonth('next')}><ChevronRight size={24} /></button>
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
              {isGenerating ? (<><div className="spinner" /><span>Generating...</span></>) : (<><Sparkles size={20} /><span>Generate Roster</span></>)}
            </button>
          </div>
          
          {hasGenerated && (
            <div className="handover-cta">
              <div className="cta-content">
                <Clock size={24} />
                <div>
                  <h3>Quick Handover View</h3>
                  <p>See today's and tomorrow's on-call team, search for any doctor's schedule</p>
                </div>
              </div>
              <button className="cta-btn" onClick={() => setCurrentView('handover')}>
                Open Handover View
                <ChevronRight size={20} />
              </button>
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  .app-container {
    min-height: 100vh;
    background: #0a0a0f;
    font-family: 'Inter', sans-serif;
    color: #e2e8f0;
  }
  
  .app-header {
    background: linear-gradient(180deg, rgba(15, 15, 25, 0.95) 0%, rgba(10, 10, 15, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .header-content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo { display: flex; align-items: center; gap: 14px; }
  
  .logo-icon {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
  }
  
  .logo-text h1 {
    font-size: 22px; font-weight: 800;
    background: linear-gradient(135deg, #f1f5f9, #a5b4fc);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  
  .logo-text span { font-size: 12px; color: #64748b; }
  
  .header-nav { display: flex; gap: 8px; }
  
  .nav-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 18px;
    background: rgba(30, 30, 50, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
  }
  
  .nav-btn:hover, .nav-btn.active {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
    color: #f1f5f9;
  }
  
  .nav-btn.handover-nav {
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.2));
    border-color: rgba(20, 184, 166, 0.4);
    color: #5eead4;
  }
  
  .main-content { max-width: 1600px; margin: 0 auto; padding: 32px 24px; }
  
  .dashboard { display: flex; flex-direction: column; gap: 28px; }
  
  .month-selector { display: flex; align-items: center; justify-content: center; gap: 28px; }
  
  .month-nav {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #94a3b8;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  
  .month-nav:hover { background: rgba(99, 102, 241, 0.2); color: #f1f5f9; }
  
  .current-month {
    font-size: 32px; font-weight: 800;
    min-width: 280px; text-align: center;
    background: linear-gradient(135deg, #f1f5f9, #a5b4fc);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  
  .status-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 24px 32px;
    background: linear-gradient(135deg, rgba(30, 30, 50, 0.6), rgba(20, 20, 35, 0.8));
    border-radius: 20px;
    border: 1px solid rgba(99, 102, 241, 0.15);
  }
  
  .status-info { display: flex; align-items: center; gap: 24px; }
  
  .status-circle { position: relative; width: 80px; height: 80px; }
  
  .progress-ring { transform: rotate(-90deg); }
  
  .progress-bg { fill: none; stroke: rgba(99, 102, 241, 0.15); stroke-width: 3; }
  
  .progress-fill {
    fill: none; stroke: #6366f1; stroke-width: 3;
    stroke-linecap: round; transition: stroke-dasharray 0.5s ease;
  }
  
  .progress-text {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 16px; font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    color: #a5b4fc;
  }
  
  .status-text h3 { font-size: 17px; font-weight: 600; margin-bottom: 4px; }
  .status-text p { font-size: 14px; color: #64748b; }
  
  .generate-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 32px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none; border-radius: 14px;
    color: white; font-size: 16px; font-weight: 600;
    cursor: pointer; transition: all 0.3s;
    font-family: inherit;
    box-shadow: 0 4px 25px rgba(99, 102, 241, 0.35);
  }
  
  .generate-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 35px rgba(99, 102, 241, 0.5);
  }
  
  .generate-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  
  .spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin { to { transform: rotate(360deg); } }
  
  /* Handover CTA */
  .handover-cta {
    display: flex; justify-content: space-between; align-items: center;
    padding: 20px 28px;
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(6, 182, 212, 0.1));
    border: 1px solid rgba(20, 184, 166, 0.3);
    border-radius: 16px;
  }
  
  .cta-content { display: flex; align-items: center; gap: 16px; color: #5eead4; }
  .cta-content h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
  .cta-content p { font-size: 13px; color: #94a3b8; }
  
  .cta-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 24px;
    background: rgba(20, 184, 166, 0.2);
    border: 1px solid rgba(20, 184, 166, 0.4);
    border-radius: 10px;
    color: #5eead4; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit;
  }
  
  .cta-btn:hover {
    background: rgba(20, 184, 166, 0.3);
    transform: translateX(4px);
  }
  
  /* Teams */
  .teams-section { display: flex; flex-direction: column; gap: 24px; }
  
  .team-group {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 20px; padding: 24px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .team-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .team-label { font-size: 15px; font-weight: 600; }
  .min-staff {
    margin-left: auto; font-size: 12px; color: #64748b;
    background: rgba(100, 116, 139, 0.2);
    padding: 4px 12px; border-radius: 20px;
  }
  
  .team-doctors { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
  
  .doctor-card {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 20px;
    background: rgba(15, 15, 25, 0.7);
    border-radius: 14px;
    border: 1px solid rgba(99, 102, 241, 0.1);
    cursor: pointer; transition: all 0.2s;
  }
  
  .doctor-card:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }
  
  .doctor-card.submitted { border-color: rgba(34, 197, 94, 0.3); }
  
  .card-avatar {
    width: 46px; height: 46px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700;
    color: white;
  }
  
  .card-info { flex: 1; min-width: 0; }
  .card-info h3 { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
  .card-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .points { font-size: 12px; color: #64748b; font-family: 'JetBrains Mono', monospace; }
  
  .request-badges { display: flex; gap: 6px; }
  .req-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
  .req-badge.al { background: rgba(99, 102, 241, 0.3); color: #a5b4fc; }
  .req-badge.cb { background: rgba(100, 116, 139, 0.3); color: #94a3b8; }
  .req-badge.cr { background: rgba(20, 184, 166, 0.3); color: #5eead4; }
  
  .status-icon.done { color: #22c55e; }
  .status-icon.pending { color: #f59e0b; }
  
  .shift-badge {
    padding: 5px 10px; border-radius: 6px;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
    display: inline-block;
  }
  
  .shift-badge.small { padding: 3px 7px; font-size: 10px; }
  
  /* Availability View */
  .availability-view { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
  
  .availability-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 32px; }
  .header-info h2 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  .doctor-meta { display: flex; align-items: center; gap: 16px; }
  .cumulative-points { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #a5b4fc; }
  
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 18px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    color: #94a3b8; cursor: pointer;
    font-family: inherit; font-size: 14px; font-weight: 500;
    transition: all 0.2s;
  }
  
  .back-btn:hover { background: rgba(99, 102, 241, 0.15); color: #f1f5f9; }
  
  .availability-controls {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px; flex-wrap: wrap; gap: 16px;
  }
  
  .type-selector { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .control-label { font-size: 14px; color: #94a3b8; font-weight: 500; }
  .type-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
  
  .type-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 20px; border-radius: 12px;
    font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit; border: 2px solid;
  }
  
  .type-btn:hover { transform: translateY(-2px); }
  
  .request-summary { display: flex; gap: 16px; padding: 12px 20px; background: rgba(30, 30, 50, 0.6); border-radius: 12px; }
  .summary-item { display: flex; align-items: center; gap: 6px; }
  .summary-item span { font-size: 12px; color: #64748b; }
  .summary-item strong { font-size: 16px; font-family: 'JetBrains Mono', monospace; color: #a5b4fc; }
  
  .calendar-grid {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 20px; padding: 24px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px; }
  .day-header { text-align: center; font-size: 12px; font-weight: 600; color: #64748b; padding: 10px; text-transform: uppercase; }
  .calendar-body { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  
  .day-cell {
    aspect-ratio: 1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 4px;
    background: rgba(15, 15, 25, 0.6);
    border-radius: 14px; border: 2px solid transparent;
    cursor: pointer; transition: all 0.2s;
    min-height: 80px;
  }
  
  .day-cell:hover:not(.empty) {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
  }
  
  .day-cell.weekend { background: rgba(245, 158, 11, 0.08); }
  .day-cell.marked { border-width: 2px; }
  .day-cell.empty { background: transparent; cursor: default; }
  .day-number { font-size: 18px; font-weight: 700; }
  
  /* Handover View */
  .handover-view { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
  
  .handover-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
  .header-title { display: flex; align-items: center; gap: 12px; color: #5eead4; }
  .header-title h2 { font-size: 28px; font-weight: 800; }
  
  .date-navigator {
    display: flex; align-items: center; justify-content: center; gap: 16px;
    margin-bottom: 32px;
  }
  
  .date-navigator button {
    width: 40px; height: 40px;
    border-radius: 10px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #94a3b8; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  
  .date-navigator button:hover { background: rgba(99, 102, 241, 0.2); color: #f1f5f9; }
  
  .current-selection { text-align: center; }
  .nav-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .nav-date { font-size: 18px; font-weight: 700; color: #f1f5f9; }
  
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
    color: #64748b; padding: 8px 0;
  }
  
  .handover-arrow span { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  
  .handover-card {
    background: rgba(20, 20, 35, 0.8);
    border-radius: 20px; padding: 24px;
    border: 2px solid rgba(99, 102, 241, 0.2);
  }
  
  .handover-card.today { border-color: rgba(34, 197, 94, 0.4); }
  .handover-card.tomorrow { border-color: rgba(99, 102, 241, 0.4); }
  .handover-card.empty { opacity: 0.5; }
  
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px; padding-bottom: 16px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .card-label {
    font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px;
    color: #64748b;
  }
  
  .card-date { font-size: 14px; font-weight: 600; color: #e2e8f0; }
  .card-empty { text-align: center; color: #64748b; padding: 40px; }
  
  .oncall-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
  
  .oncall-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px;
    background: rgba(15, 15, 25, 0.6);
    border-radius: 12px;
  }
  
  .tier-info { display: flex; align-items: center; gap: 12px; }
  .tier-emoji { font-size: 20px; }
  .tier-details { display: flex; flex-direction: column; }
  .tier-name { font-size: 14px; font-weight: 700; color: #f1f5f9; }
  .tier-desc { font-size: 11px; color: #64748b; }
  
  .doctor-info { display: flex; align-items: center; gap: 10px; }
  .doctor-name { font-size: 14px; font-weight: 600; color: #e2e8f0; }
  .not-assigned { font-size: 13px; color: #64748b; font-style: italic; }
  
  .status-section { margin-bottom: 16px; }
  .status-header { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
  .status-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .status-pill { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .status-pill.postcall { background: rgba(16, 185, 129, 0.2); color: #34d399; }
  .status-pill.leave { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
  
  .copy-btn {
    width: 100%; padding: 12px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: rgba(30, 30, 50, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    color: #94a3b8; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit;
  }
  
  .copy-btn:hover { background: rgba(99, 102, 241, 0.15); color: #f1f5f9; }
  .copy-btn.copied { background: rgba(34, 197, 94, 0.2); border-color: rgba(34, 197, 94, 0.4); color: #22c55e; }
  
  /* Search */
  .search-section {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 20px; padding: 24px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .search-header { display: flex; align-items: center; gap: 10px; color: #a5b4fc; margin-bottom: 16px; }
  .search-header h3 { font-size: 16px; font-weight: 600; }
  
  .search-input-wrapper { position: relative; margin-bottom: 16px; }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; }
  
  .search-input {
    width: 100%; padding: 14px 14px 14px 46px;
    background: rgba(15, 15, 25, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    color: #f1f5f9; font-size: 15px;
    font-family: inherit;
    transition: all 0.2s;
  }
  
  .search-input:focus { outline: none; border-color: rgba(99, 102, 241, 0.5); }
  .search-input::placeholder { color: #64748b; }
  
  .clear-search {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    width: 24px; height: 24px;
    background: rgba(100, 116, 139, 0.3);
    border: none; border-radius: 50%;
    color: #94a3b8; font-size: 16px;
    cursor: pointer; transition: all 0.2s;
  }
  
  .clear-search:hover { background: rgba(100, 116, 139, 0.5); color: #f1f5f9; }
  
  .search-results { display: flex; flex-direction: column; gap: 12px; }
  
  .search-result-card {
    background: rgba(15, 15, 25, 0.6);
    border-radius: 14px; padding: 16px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .result-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .result-name { font-size: 16px; font-weight: 600; color: #f1f5f9; }
  
  .result-calls { }
  .calls-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 8px; }
  .calls-list { display: flex; flex-wrap: wrap; gap: 8px; }
  
  .call-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    background: rgba(30, 30, 50, 0.6);
    border-radius: 8px;
  }
  
  .call-date { font-size: 12px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
  .no-calls { font-size: 13px; color: #64748b; font-style: italic; }
  .no-results { text-align: center; color: #64748b; padding: 20px; }
  
  @media (max-width: 768px) {
    .header-content { flex-direction: column; gap: 16px; }
    .status-bar { flex-direction: column; gap: 20px; text-align: center; }
    .team-doctors { grid-template-columns: 1fr; }
    .current-month { font-size: 22px; min-width: auto; }
    .handover-cta { flex-direction: column; text-align: center; gap: 16px; }
  }
`;
