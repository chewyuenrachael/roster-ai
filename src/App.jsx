import React, { useState, useMemo } from 'react';
import { Calendar, Users, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Sparkles, Eye, TrendingUp, Award, Shield, Zap, Info, Filter, BarChart3, Lightbulb } from 'lucide-react';

// ============ CONFIGURATION ============

// Updated Call Point System (Weekend rounds worth more)
const CALL_POINTS = {
  'HO1': { monThu: 1.0, friday: 1.5, saturday: 2.5, sunday: 2.0 },
  'HO2': { monThu: 1.0, friday: 1.5, saturday: 2.5, sunday: 2.0 },
  'HO3': { monThu: 0.5, friday: 0.75, saturday: 1.25, sunday: 1.0 },
};

// Shift types and their colors
const SHIFT_TYPES = {
  'HO1': { label: 'HO1', color: '#ef4444', textColor: '#fff', description: 'Active On-Call', category: 'call' },
  'HO2': { label: 'HO2', color: '#f97316', textColor: '#fff', description: 'Passive On-Call', category: 'call' },
  'HO3': { label: 'HO3', color: '#eab308', textColor: '#1f2937', description: 'Handover HO', category: 'call' },
  'PC': { label: 'PC', color: '#10b981', textColor: '#fff', description: 'Post-Call', category: 'rest' },
  'AL': { label: 'AL', color: '#6366f1', textColor: '#fff', description: 'Annual Leave', category: 'leave' },
  'CB': { label: 'CB', color: '#64748b', textColor: '#fff', description: 'Call Block', category: 'request' },
  'CR': { label: 'CR', color: '#14b8a6', textColor: '#fff', description: 'Call Request', category: 'request' },
  // Team postings
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

// Minimum staffing requirements per team
const MINIMUM_STAFFING = {
  'NES': 2, 'VAS': 2, 'CLR': 2, 'ESU': 3, 'PRAS': 1,
  'HPB': 1, 'UGI': 2, 'BES': 1, 'URO': 2,
};

// Random names for doctors
const INITIAL_DOCTORS = [
  { id: 1, name: 'Sarah Chen', team: 'NES', cumulativePoints: 17.5, bidsRemaining: 4 },
  { id: 2, name: 'Marcus Wong', team: 'VAS', cumulativePoints: 16.0, bidsRemaining: 4 },
  { id: 3, name: 'Emily Tan', team: 'ESU', cumulativePoints: 15.0, bidsRemaining: 4 },
  { id: 4, name: 'Raj Sharma', team: 'PRAS', cumulativePoints: 17.0, bidsRemaining: 4 },
  { id: 5, name: 'Jessica Lim', team: 'URO', cumulativePoints: 15.5, bidsRemaining: 4 },
  { id: 6, name: 'David Ng', team: 'ESU', cumulativePoints: 14.5, bidsRemaining: 4 },
  { id: 7, name: 'Michelle Goh', team: 'ESU', cumulativePoints: 17.0, bidsRemaining: 4 },
  { id: 8, name: 'Kevin Teo', team: 'URO', cumulativePoints: 16.5, bidsRemaining: 4 },
  { id: 9, name: 'Amanda Lee', team: 'ESU', cumulativePoints: 16.0, bidsRemaining: 4 },
  { id: 10, name: 'Ryan Koh', team: 'PRAS', cumulativePoints: 16.0, bidsRemaining: 4 },
  { id: 11, name: 'Priya Nair', team: 'CLR', cumulativePoints: 16.0, bidsRemaining: 4 },
  { id: 12, name: 'Jason Ong', team: 'BES', cumulativePoints: 16.0, bidsRemaining: 4 },
  { id: 13, name: 'Nicole Yeo', team: 'ESU', cumulativePoints: 17.0, bidsRemaining: 4 },
  { id: 14, name: 'Benjamin Chua', team: 'CLR', cumulativePoints: 15.5, bidsRemaining: 4 },
  { id: 15, name: 'Vanessa Loh', team: 'UGI', cumulativePoints: 16.5, bidsRemaining: 4 },
  { id: 16, name: 'Andrew Sim', team: 'VAS', cumulativePoints: 15.0, bidsRemaining: 4 },
  { id: 17, name: 'Rachel Foo', team: 'HPB', cumulativePoints: 17.0, bidsRemaining: 4 },
  { id: 18, name: 'Daniel Pang', team: 'NES', cumulativePoints: 15.5, bidsRemaining: 4 },
  { id: 19, name: 'Samantha Ho', team: 'HPB', cumulativePoints: 9.0, bidsRemaining: 4 },
  { id: 20, name: 'Timothy Seah', team: 'VAS', cumulativePoints: 5.0, bidsRemaining: 4 },
  { id: 21, name: 'Grace Tan', team: 'UGI', cumulativePoints: 6.0, bidsRemaining: 4 },
];

const PUBLIC_HOLIDAYS = {
  '2025-08-09': 'National Day',
  '2025-12-25': 'Christmas',
  '2026-01-01': 'New Year',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============ UTILITY FUNCTIONS ============

const generateMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
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

const getCallPoints = (callType, day) => {
  const points = CALL_POINTS[callType];
  if (!points) return 0;
  
  // Public holidays treated like Saturday (highest value)
  if (day.isPublicHoliday) return points.saturday;
  if (day.isSaturday) return points.saturday;
  if (day.isSunday) return points.sunday;
  if (day.isFriday) return points.friday;
  return points.monThu;
};

const getPointsDisplay = (day) => {
  if (day.isPublicHoliday || day.isSaturday) return '2.5';
  if (day.isSunday) return '2.0';
  if (day.isFriday) return '1.5';
  return '1.0';
};

// ============ AI ALLOCATION ALGORITHM ============

const generateAIAllocation = (doctors, requests, month, year) => {
  const days = generateMonthDays(year, month);
  const allocation = {};
  const callPoints = {};
  const callCounts = { HO1: {}, HO2: {}, HO3: {} };
  
  // Initialize
  doctors.forEach(doc => {
    allocation[doc.id] = {};
    callPoints[doc.id] = 0;
    callCounts.HO1[doc.id] = 0;
    callCounts.HO2[doc.id] = 0;
    callCounts.HO3[doc.id] = 0;
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
  
  // Second pass: Allocate calls for each day
  days.forEach(day => {
    const callTypes = ['HO1', 'HO2', 'HO3'];
    
    callTypes.forEach(callType => {
      // Get available doctors (not on leave, not blocked, not already assigned today)
      const available = doctors.filter(doc => {
        const currentAlloc = allocation[doc.id][day.date];
        // Skip if already has allocation (AL, CB, or another call)
        if (currentAlloc) return false;
        
        // Check if post-call from yesterday (HO1/HO2 gets next day off)
        const yesterday = day.date - 1;
        if (yesterday > 0) {
          const yesterdayAlloc = allocation[doc.id][yesterday];
          if (yesterdayAlloc === 'HO1' || yesterdayAlloc === 'HO2') return false;
        }
        
        return true;
      });
      
      if (available.length === 0) return;
      
      // Check for call requests first - prioritize those who requested this day
      const requesters = available.filter(doc => {
        const docRequests = requests[doc.id] || {};
        return docRequests[day.date] === 'CR';
      });
      
      let candidates = requesters.length > 0 ? requesters : available;
      
      // Sort by cumulative + current month points (lowest first for fairness)
      candidates.sort((a, b) => {
        const aTotal = a.cumulativePoints + callPoints[a.id];
        const bTotal = b.cumulativePoints + callPoints[b.id];
        return aTotal - bTotal;
      });
      
      // ESU doctors get priority for HO1
      if (callType === 'HO1') {
        const esuDocs = candidates.filter(d => d.team === 'ESU');
        if (esuDocs.length > 0) {
          candidates = [...esuDocs, ...candidates.filter(d => d.team !== 'ESU')];
        }
      }
      
      if (candidates.length > 0) {
        const assigned = candidates[0];
        allocation[assigned.id][day.date] = callType;
        callPoints[assigned.id] += getCallPoints(callType, day);
        callCounts[callType][assigned.id]++;
      }
    });
  });
  
  // Third pass: Add post-call for HO1/HO2 (they get next day as PC)
  doctors.forEach(doc => {
    days.forEach((day, idx) => {
      if (idx === 0) return;
      const yesterday = days[idx - 1];
      const yesterdayAlloc = allocation[doc.id][yesterday.date];
      
      // If worked HO1 or HO2 yesterday and no allocation today, mark as post-call
      if ((yesterdayAlloc === 'HO1' || yesterdayAlloc === 'HO2') && !allocation[doc.id][day.date]) {
        allocation[doc.id][day.date] = 'PC';
      }
    });
  });
  
  // Calculate staffing per team per day
  const staffingCheck = {};
  days.forEach(day => {
    staffingCheck[day.date] = {};
    Object.keys(MINIMUM_STAFFING).forEach(team => {
      const working = doctors.filter(doc => {
        const alloc = allocation[doc.id]?.[day.date];
        return doc.team === team && !['AL', 'PC', 'CB'].includes(alloc);
      });
      staffingCheck[day.date][team] = {
        count: working.length,
        minimum: MINIMUM_STAFFING[team],
        sufficient: working.length >= MINIMUM_STAFFING[team],
      };
    });
  });
  
  return { allocation, callPoints, callCounts, staffingCheck };
};

// ============ COMPONENTS ============

const ShiftBadge = ({ shift, small = false }) => {
  const shiftInfo = SHIFT_TYPES[shift] || { label: shift, color: '#6b7280', textColor: '#fff' };
  
  return (
    <span
      className={`shift-badge ${small ? 'small' : ''}`}
      style={{
        backgroundColor: shiftInfo.color,
        color: shiftInfo.textColor,
      }}
    >
      {shiftInfo.label}
    </span>
  );
};

const CallPointsLegend = () => (
  <div className="call-points-legend">
    <h4><TrendingUp size={16} /> Call Points System</h4>
    <p className="legend-subtitle">Weekend rounds are worth more points</p>
    <div className="points-grid">
      <div className="points-row header">
        <span>Type</span>
        <span>Mon-Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
      {Object.entries(CALL_POINTS).map(([type, points]) => (
        <div key={type} className="points-row">
          <ShiftBadge shift={type} small />
          <span>{points.monThu}</span>
          <span>{points.friday}</span>
          <span className="highlight">{points.saturday}</span>
          <span>{points.sunday}</span>
        </div>
      ))}
    </div>
  </div>
);

const LeaveMaximizationTips = () => (
  <div className="tips-card">
    <div className="tips-header">
      <Lightbulb size={18} />
      <h4>Leave Maximization Tips</h4>
    </div>
    <div className="tips-content">
      <div className="tip">
        <strong>🎯 The Thursday Call Strategy:</strong>
        <p>Call Request on Thursday → Work until 8am-12pm Friday (post-call) → Call Block Sat & Sun → Take AL from Monday onwards = Maximum consecutive days off!</p>
      </div>
      <div className="tip">
        <strong>📅 Weekend Protection:</strong>
        <p>If taking AL on Friday or Monday, always Call Block the adjacent weekend to ensure consecutive days off work.</p>
      </div>
      <div className="tip">
        <strong>⚡ Points Strategy:</strong>
        <p>Saturday calls = 2.5 pts (highest). If you need points, request Saturday. If you want rest, block weekends.</p>
      </div>
    </div>
  </div>
);

const StaffingIndicator = ({ staffing }) => {
  if (!staffing) return null;
  
  const issues = Object.entries(staffing).filter(([_, s]) => !s.sufficient);
  
  if (issues.length === 0) {
    return (
      <div className="staffing-ok">
        <CheckCircle size={14} />
      </div>
    );
  }
  
  return (
    <div className="staffing-warning" title={`${issues.length} team(s) understaffed`}>
      <AlertCircle size={14} />
    </div>
  );
};

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
      
      // If clicking same type, remove it
      if (current === selectedType) {
        const newDocReq = { ...docReq };
        delete newDocReq[dayNum];
        return { ...prev, [doctor.id]: newDocReq };
      }
      
      // Otherwise set the new type
      return {
        ...prev,
        [doctor.id]: { ...docReq, [dayNum]: selectedType }
      };
    });
  };
  
  const firstDayOffset = new Date(year, month, 1).getDay();
  
  const requestTypes = [
    { type: 'AL', label: 'Annual Leave', icon: '🏖️', desc: 'Day off work' },
    { type: 'CB', label: 'Call Block', icon: '🚫', desc: "Don't want call on this day" },
    { type: 'CR', label: 'Call Request', icon: '✋', desc: 'Want to be on call this day' },
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
              {doctor.cumulativePoints} pts cumulative
            </span>
          </div>
        </div>
      </div>
      
      <div className="availability-controls">
        <div className="type-selector">
          <span className="control-label">Select what to mark:</span>
          <div className="type-buttons">
            {requestTypes.map(({ type, label, icon, desc }) => (
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
                <span className="type-icon">{icon}</span>
                <span className="type-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="request-summary">
          <div className="summary-item">
            <span className="summary-label">AL:</span>
            <span className="summary-value">{alCount}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">CB:</span>
            <span className="summary-value">{cbCount}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">CR:</span>
            <span className="summary-value">{crCount}</span>
          </div>
        </div>
      </div>
      
      <div className="type-descriptions">
        {requestTypes.map(({ type, label, desc }) => (
          <div key={type} className={`type-desc ${selectedType === type ? 'active' : ''}`}>
            <ShiftBadge shift={type} small />
            <span>{desc}</span>
          </div>
        ))}
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
            const pointsVal = getPointsDisplay(day);
            
            return (
              <div
                key={day.date}
                className={`day-cell ${day.isWeekend ? 'weekend' : ''} ${day.isPublicHoliday ? 'holiday' : ''} ${status ? 'marked' : ''}`}
                onClick={() => toggleDay(day.date)}
                style={status ? {
                  backgroundColor: statusInfo?.color + '25',
                  borderColor: statusInfo?.color,
                } : {}}
              >
                <span className="day-number">{day.date}</span>
                <span className={`day-points ${day.isWeekend ? 'weekend-pts' : ''}`}>
                  {pointsVal}pt
                </span>
                {day.isPublicHoliday && <span className="ph-marker">PH</span>}
                {status && <ShiftBadge shift={status} small />}
              </div>
            );
          })}
        </div>
      </div>
      
      <LeaveMaximizationTips />
    </div>
  );
};

const RosterView = ({ doctors, allocation, callPoints, callCounts, staffingCheck, month, year }) => {
  const days = generateMonthDays(year, month);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState(new Set(Object.keys(MINIMUM_STAFFING)));
  
  const filteredDoctors = doctors.filter(d => selectedTeams.has(d.team));
  
  // Group by team
  const doctorsByTeam = {};
  filteredDoctors.forEach(doc => {
    if (!doctorsByTeam[doc.team]) doctorsByTeam[doc.team] = [];
    doctorsByTeam[doc.team].push(doc);
  });
  
  return (
    <div className="roster-view">
      <div className="roster-header">
        <h2>{MONTHS[month]} {year} Roster</h2>
        <div className="roster-actions">
          <button 
            className={`filter-btn ${showTeamFilter ? 'active' : ''}`}
            onClick={() => setShowTeamFilter(!showTeamFilter)}
          >
            <Filter size={16} />
            Filter Teams
          </button>
          <div className="roster-stats">
            <span className="stat">
              <Users size={16} />
              {filteredDoctors.length} Doctors
            </span>
            <span className="stat">
              <Calendar size={16} />
              {days.length} Days
            </span>
          </div>
        </div>
      </div>
      
      {showTeamFilter && (
        <div className="team-filter">
          {Object.keys(MINIMUM_STAFFING).map(team => (
            <button
              key={team}
              className={`team-chip ${selectedTeams.has(team) ? 'active' : ''}`}
              onClick={() => {
                const newSet = new Set(selectedTeams);
                if (newSet.has(team)) newSet.delete(team);
                else newSet.add(team);
                setSelectedTeams(newSet);
              }}
            >
              <ShiftBadge shift={team} small />
            </button>
          ))}
        </div>
      )}
      
      <div className="roster-table-container">
        <table className="roster-table">
          <thead>
            <tr>
              <th className="doctor-col">Doctor</th>
              <th className="team-col">Team</th>
              <th className="points-col">Points</th>
              <th className="calls-col">H1/H2/H3</th>
              {days.map(day => (
                <th 
                  key={day.date} 
                  className={`day-col ${day.isWeekend ? 'weekend' : ''} ${day.isPublicHoliday ? 'holiday' : ''}`}
                >
                  <div className="day-header-cell">
                    <span className="day-name">{DAYS[day.dayOfWeek]}</span>
                    <span className="day-num">{day.date}</span>
                    <span className="day-pts">{getPointsDisplay(day)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Daily call count row */}
            <tr className="count-row">
              <td colSpan={4} className="count-label">Daily Calls</td>
              {days.map(day => {
                const ho1 = filteredDoctors.filter(d => allocation[d.id]?.[day.date] === 'HO1').length;
                const ho2 = filteredDoctors.filter(d => allocation[d.id]?.[day.date] === 'HO2').length;
                const ho3 = filteredDoctors.filter(d => allocation[d.id]?.[day.date] === 'HO3').length;
                return (
                  <td key={day.date} className="count-cell">
                    <span className={ho1 >= 1 ? 'ok' : 'warn'}>{ho1}</span>/
                    <span className={ho2 >= 1 ? 'ok' : 'warn'}>{ho2}</span>/
                    <span className={ho3 >= 1 ? 'ok' : 'warn'}>{ho3}</span>
                  </td>
                );
              })}
            </tr>
            
            {Object.entries(doctorsByTeam).map(([team, members]) => (
              <React.Fragment key={team}>
                <tr className="team-row">
                  <td colSpan={days.length + 4} className="team-header">
                    <ShiftBadge shift={team} small />
                    <span className="team-name">{SHIFT_TYPES[team]?.description || team}</span>
                    <span className="team-count">{members.length} doctors • Min {MINIMUM_STAFFING[team]}/day</span>
                  </td>
                </tr>
                {members.map(doctor => (
                  <tr key={doctor.id} className="doctor-row">
                    <td className="doctor-name">{doctor.name}</td>
                    <td className="team-badge-cell">
                      <ShiftBadge shift={doctor.team} small />
                    </td>
                    <td className="points-cell">
                      <span className="points-value">
                        {(doctor.cumulativePoints + (callPoints[doctor.id] || 0)).toFixed(1)}
                      </span>
                      {callPoints[doctor.id] > 0 && (
                        <span className="points-delta">+{callPoints[doctor.id].toFixed(1)}</span>
                      )}
                    </td>
                    <td className="calls-cell">
                      <span className="call-counts">
                        {callCounts.HO1[doctor.id] || 0}/
                        {callCounts.HO2[doctor.id] || 0}/
                        {callCounts.HO3[doctor.id] || 0}
                      </span>
                    </td>
                    {days.map(day => {
                      const shift = allocation[doctor.id]?.[day.date];
                      return (
                        <td 
                          key={day.date} 
                          className={`shift-cell ${day.isWeekend ? 'weekend' : ''} ${day.isPublicHoliday ? 'holiday' : ''}`}
                        >
                          {shift && <ShiftBadge shift={shift} small />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="roster-footer">
        <CallPointsLegend />
        <div className="shift-legend">
          <h4>Shift Types</h4>
          <div className="legend-grid">
            {Object.entries(SHIFT_TYPES).filter(([_, v]) => v.category !== 'team').map(([key, info]) => (
              <div key={key} className="legend-item">
                <ShiftBadge shift={key} small />
                <span>{info.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsDashboard = ({ doctors, callPoints, callCounts }) => {
  const sortedByPoints = [...doctors].sort((a, b) => {
    const aTotal = a.cumulativePoints + (callPoints[a.id] || 0);
    const bTotal = b.cumulativePoints + (callPoints[b.id] || 0);
    return bTotal - aTotal;
  });
  
  const avgPoints = doctors.reduce((sum, d) => sum + d.cumulativePoints + (callPoints[d.id] || 0), 0) / doctors.length;
  const totalCalls = {
    HO1: Object.values(callCounts.HO1).reduce((a, b) => a + b, 0),
    HO2: Object.values(callCounts.HO2).reduce((a, b) => a + b, 0),
    HO3: Object.values(callCounts.HO3).reduce((a, b) => a + b, 0),
  };
  
  return (
    <div className="stats-dashboard">
      <h3><BarChart3 size={20} /> Statistics</h3>
      
      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-value">{avgPoints.toFixed(1)}</span>
          <span className="stat-label">Avg Points</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalCalls.HO1}</span>
          <span className="stat-label">HO1 Calls</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalCalls.HO2}</span>
          <span className="stat-label">HO2 Calls</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalCalls.HO3}</span>
          <span className="stat-label">HO3 Calls</span>
        </div>
      </div>
      
      <div className="leaderboard">
        <h4>Call Points Leaderboard (Highest First)</h4>
        <div className="leaderboard-list">
          {sortedByPoints.slice(0, 10).map((doc, idx) => (
            <div key={doc.id} className="leaderboard-item">
              <span className="rank">#{idx + 1}</span>
              <span className="name">{doc.name}</span>
              <ShiftBadge shift={doc.team} small />
              <span className="total-points">
                {(doc.cumulativePoints + (callPoints[doc.id] || 0)).toFixed(1)} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DoctorCard = ({ doctor, hasSubmitted, requestSummary, onClick }) => (
  <div 
    className={`doctor-card ${hasSubmitted ? 'submitted' : ''}`}
    onClick={onClick}
  >
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
      {hasSubmitted ? (
        <CheckCircle size={20} className="status-icon done" />
      ) : (
        <AlertCircle size={20} className="status-icon pending" />
      )}
    </div>
  </div>
);

// ============ MAIN APP ============

export default function EnhancedRosterApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [month, setMonth] = useState(7); // August
  const [year, setYear] = useState(2025);
  const [doctors] = useState(INITIAL_DOCTORS);
  const [requests, setRequests] = useState({});
  const [allocation, setAllocation] = useState({});
  const [callPoints, setCallPoints] = useState({});
  const [callCounts, setCallCounts] = useState({ HO1: {}, HO2: {}, HO3: {} });
  const [staffingCheck, setStaffingCheck] = useState({});
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
  
  const submittedCount = Object.keys(requests).filter(
    id => requests[id] && Object.keys(requests[id]).length > 0
  ).length;
  
  const handleGenerateRoster = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = generateAIAllocation(doctors, requests, month, year);
    setAllocation(result.allocation);
    setCallPoints(result.callPoints);
    setCallCounts(result.callCounts);
    setStaffingCheck(result.staffingCheck);
    setHasGenerated(true);
    setIsGenerating(false);
    setCurrentView('roster');
  };
  
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (month === 0) {
        setMonth(11);
        setYear(y => y - 1);
      } else {
        setMonth(m => m - 1);
      }
    } else {
      if (month === 11) {
        setMonth(0);
        setYear(y => y + 1);
      } else {
        setMonth(m => m + 1);
      }
    }
    setHasGenerated(false);
    setAllocation({});
  };
  
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
          onBack={() => {
            setCurrentView('dashboard');
            setSelectedDoctor(null);
          }}
        />
      </div>
    );
  }
  
  if (currentView === 'roster') {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <div className="roster-wrapper">
          <button className="back-btn floating" onClick={() => setCurrentView('dashboard')}>
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <RosterView 
            doctors={doctors}
            allocation={allocation}
            callPoints={callPoints}
            callCounts={callCounts}
            staffingCheck={staffingCheck}
            month={month}
            year={year}
          />
        </div>
      </div>
    );
  }
  
  if (currentView === 'stats') {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <div className="stats-wrapper">
          <button className="back-btn floating" onClick={() => setCurrentView('dashboard')}>
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <StatsDashboard 
            doctors={doctors}
            callPoints={callPoints}
            callCounts={callCounts}
          />
        </div>
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
            <div className="logo-icon">
              <Zap size={24} />
            </div>
            <div className="logo-text">
              <h1>RosterAI Pro</h1>
              <span>Smart Shift Allocation</span>
            </div>
          </div>
          <nav className="header-nav">
            <button 
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <Users size={18} />
              <span>Dashboard</span>
            </button>
            {hasGenerated && (
              <>
                <button 
                  className="nav-btn"
                  onClick={() => setCurrentView('roster')}
                >
                  <Eye size={18} />
                  <span>Roster</span>
                </button>
                <button 
                  className="nav-btn"
                  onClick={() => setCurrentView('stats')}
                >
                  <BarChart3 size={18} />
                  <span>Stats</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        <div className="dashboard">
          <div className="month-selector">
            <button className="month-nav" onClick={() => navigateMonth('prev')}>
              <ChevronLeft size={24} />
            </button>
            <h2 className="current-month">{MONTHS[month]} {year}</h2>
            <button className="month-nav" onClick={() => navigateMonth('next')}>
              <ChevronRight size={24} />
            </button>
          </div>
          
          <div className="status-bar">
            <div className="status-info">
              <div className="status-circle">
                <svg viewBox="0 0 36 36" className="progress-ring">
                  <path
                    className="progress-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="progress-fill"
                    strokeDasharray={`${(submittedCount / doctors.length) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="progress-text">{submittedCount}/{doctors.length}</span>
              </div>
              <div className="status-text">
                <h3>Submissions</h3>
                <p>{doctors.length - submittedCount} doctors remaining</p>
              </div>
            </div>
            
            <button 
              className={`generate-btn ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerateRoster}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="spinner" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate Roster</span>
                </>
              )}
            </button>
          </div>
          
          <LeaveMaximizationTips />
          
          <div className="teams-section">
            {Object.entries(doctorsByTeam).map(([team, members]) => (
              <div key={team} className="team-group">
                <div className="team-title-row">
                  <ShiftBadge shift={team} />
                  <span className="team-label">{SHIFT_TYPES[team]?.description || team}</span>
                  <span className="min-staff">Min: {MINIMUM_STAFFING[team]}/day</span>
                </div>
                <div className="team-doctors">
                  {members.map(doctor => {
                    const hasSubmitted = requests[doctor.id] && Object.keys(requests[doctor.id]).length > 0;
                    return (
                      <DoctorCard
                        key={doctor.id}
                        doctor={doctor}
                        hasSubmitted={hasSubmitted}
                        requestSummary={hasSubmitted ? getRequestSummary(doctor.id) : null}
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setCurrentView('availability');
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="rules-section">
            <h3>How It Works</h3>
            <div className="rules-grid">
              <div className="rule-card">
                <div className="rule-icon">📅</div>
                <h4>1. Mark Your Days</h4>
                <p>Set AL (leave), CB (don't want call), CR (want call) on the calendar</p>
              </div>
              <div className="rule-card">
                <div className="rule-icon">🤖</div>
                <h4>2. AI Generates</h4>
                <p>Algorithm assigns HO1/HO2/HO3 fairly based on points</p>
              </div>
              <div className="rule-card">
                <div className="rule-icon">⚖️</div>
                <h4>3. Fair Points</h4>
                <p>Lowest cumulative points = first to get assigned calls</p>
              </div>
              <div className="rule-card">
                <div className="rule-icon">😴</div>
                <h4>4. Auto Post-Call</h4>
                <p>HO1/HO2 automatically get next day as PC (post-call rest)</p>
              </div>
            </div>
          </div>
          
          <CallPointsLegend />
        </div>
      </main>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  .app-container {
    min-height: 100vh;
    background: #0a0a0f;
    font-family: 'Inter', sans-serif;
    color: #e2e8f0;
  }
  
  /* Header */
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
  
  .logo {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  
  .logo-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
  }
  
  .logo-text h1 {
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, #f1f5f9, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .logo-text span {
    font-size: 12px;
    color: #64748b;
  }
  
  .header-nav {
    display: flex;
    gap: 8px;
  }
  
  .nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
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
  
  /* Main Content */
  .main-content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 32px 24px;
  }
  
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  
  .month-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
  }
  
  .month-nav {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .month-nav:hover {
    background: rgba(99, 102, 241, 0.2);
    color: #f1f5f9;
  }
  
  .current-month {
    font-size: 32px;
    font-weight: 800;
    min-width: 280px;
    text-align: center;
    background: linear-gradient(135deg, #f1f5f9, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  /* Status Bar */
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background: linear-gradient(135deg, rgba(30, 30, 50, 0.6), rgba(20, 20, 35, 0.8));
    border-radius: 20px;
    border: 1px solid rgba(99, 102, 241, 0.15);
  }
  
  .status-info {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  
  .status-circle {
    position: relative;
    width: 80px;
    height: 80px;
  }
  
  .progress-ring {
    transform: rotate(-90deg);
  }
  
  .progress-bg {
    fill: none;
    stroke: rgba(99, 102, 241, 0.15);
    stroke-width: 3;
  }
  
  .progress-fill {
    fill: none;
    stroke: #6366f1;
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 16px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    color: #a5b4fc;
  }
  
  .status-text h3 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .status-text p {
    font-size: 14px;
    color: #64748b;
  }
  
  .generate-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 32px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    font-family: inherit;
    box-shadow: 0 4px 25px rgba(99, 102, 241, 0.35);
  }
  
  .generate-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 35px rgba(99, 102, 241, 0.5);
  }
  
  .generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Tips Card */
  .tips-card {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(20, 184, 166, 0.1));
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 16px;
    padding: 24px;
  }
  
  .tips-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: #22c55e;
  }
  
  .tips-header h4 {
    font-size: 16px;
    font-weight: 700;
  }
  
  .tips-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .tip {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 16px;
  }
  
  .tip strong {
    display: block;
    margin-bottom: 8px;
    color: #a5f3a6;
    font-size: 14px;
  }
  
  .tip p {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.6;
  }
  
  /* Teams Section */
  .teams-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .team-group {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 20px;
    padding: 24px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .team-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .team-label {
    font-size: 15px;
    font-weight: 600;
    color: #e2e8f0;
  }
  
  .min-staff {
    margin-left: auto;
    font-size: 12px;
    color: #64748b;
    background: rgba(100, 116, 139, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
  }
  
  .team-doctors {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 14px;
  }
  
  .doctor-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: rgba(15, 15, 25, 0.7);
    border-radius: 14px;
    border: 1px solid rgba(99, 102, 241, 0.1);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .doctor-card:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }
  
  .doctor-card.submitted {
    border-color: rgba(34, 197, 94, 0.3);
  }
  
  .card-avatar {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
    color: white;
  }
  
  .card-info {
    flex: 1;
    min-width: 0;
  }
  
  .card-info h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  
  .card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }
  
  .points {
    font-size: 12px;
    color: #64748b;
    font-family: 'JetBrains Mono', monospace;
  }
  
  .request-badges {
    display: flex;
    gap: 6px;
  }
  
  .req-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }
  
  .req-badge.al { background: rgba(99, 102, 241, 0.3); color: #a5b4fc; }
  .req-badge.cb { background: rgba(100, 116, 139, 0.3); color: #94a3b8; }
  .req-badge.cr { background: rgba(20, 184, 166, 0.3); color: #5eead4; }
  
  .card-status {
    flex-shrink: 0;
  }
  
  .status-icon.done { color: #22c55e; }
  .status-icon.pending { color: #f59e0b; }
  
  /* Shift Badge */
  .shift-badge {
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
    display: inline-block;
  }
  
  .shift-badge.small {
    padding: 3px 7px;
    font-size: 10px;
  }
  
  /* Rules Section */
  .rules-section h3 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 20px;
  }
  
  .rules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .rule-card {
    padding: 24px;
    background: rgba(20, 20, 35, 0.6);
    border-radius: 16px;
    border: 1px solid rgba(99, 102, 241, 0.1);
    text-align: center;
  }
  
  .rule-icon {
    font-size: 32px;
    margin-bottom: 14px;
  }
  
  .rule-card h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .rule-card p {
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
  }
  
  /* Call Points Legend */
  .call-points-legend {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .call-points-legend h4 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #a5b4fc;
  }
  
  .legend-subtitle {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 16px;
  }
  
  .points-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .points-row {
    display: grid;
    grid-template-columns: 80px repeat(4, 1fr);
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .points-row.header {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
  }
  
  .points-row:last-child {
    border-bottom: none;
  }
  
  .points-row span {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
  }
  
  .points-row .highlight {
    color: #f59e0b;
    font-weight: 700;
  }
  
  /* Availability View */
  .availability-view {
    max-width: 1000px;
    margin: 0 auto;
    padding: 32px 24px;
  }
  
  .availability-header {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 32px;
  }
  
  .header-info h2 {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 8px;
  }
  
  .doctor-meta {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .cumulative-points {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #a5b4fc;
    font-family: 'JetBrains Mono', monospace;
  }
  
  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    color: #94a3b8;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .back-btn:hover {
    background: rgba(99, 102, 241, 0.15);
    color: #f1f5f9;
  }
  
  .back-btn.floating {
    position: sticky;
    top: 90px;
    z-index: 50;
    margin-bottom: 24px;
  }
  
  .availability-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .type-selector {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  
  .control-label {
    font-size: 14px;
    color: #94a3b8;
    font-weight: 500;
  }
  
  .type-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .type-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    border: 2px solid;
  }
  
  .type-btn:hover {
    transform: translateY(-2px);
  }
  
  .type-icon {
    font-size: 16px;
  }
  
  .request-summary {
    display: flex;
    gap: 16px;
    padding: 12px 20px;
    background: rgba(30, 30, 50, 0.6);
    border-radius: 12px;
  }
  
  .summary-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .summary-label {
    font-size: 12px;
    color: #64748b;
  }
  
  .summary-value {
    font-size: 16px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    color: #a5b4fc;
  }
  
  .type-descriptions {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  
  .type-desc {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #64748b;
    padding: 8px 14px;
    background: rgba(30, 30, 50, 0.4);
    border-radius: 8px;
    opacity: 0.6;
    transition: all 0.2s;
  }
  
  .type-desc.active {
    opacity: 1;
    background: rgba(99, 102, 241, 0.15);
    color: #e2e8f0;
  }
  
  /* Calendar Grid */
  .calendar-grid {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 20px;
    padding: 24px;
    border: 1px solid rgba(99, 102, 241, 0.1);
    margin-bottom: 24px;
  }
  
  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .day-header {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    padding: 10px;
    text-transform: uppercase;
  }
  
  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }
  
  .day-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: rgba(15, 15, 25, 0.6);
    border-radius: 14px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 90px;
    position: relative;
    padding: 8px;
  }
  
  .day-cell:hover:not(.empty) {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
    transform: scale(1.02);
  }
  
  .day-cell.weekend {
    background: rgba(245, 158, 11, 0.08);
  }
  
  .day-cell.holiday {
    background: rgba(239, 68, 68, 0.1);
  }
  
  .day-cell.marked {
    border-width: 2px;
  }
  
  .day-cell.empty {
    background: transparent;
    cursor: default;
  }
  
  .day-number {
    font-size: 18px;
    font-weight: 700;
  }
  
  .day-points {
    font-size: 10px;
    color: #64748b;
    font-family: 'JetBrains Mono', monospace;
  }
  
  .day-points.weekend-pts {
    color: #f59e0b;
    font-weight: 600;
  }
  
  .ph-marker {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: 9px;
    font-weight: 700;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.2);
    padding: 2px 5px;
    border-radius: 4px;
  }
  
  /* Roster View */
  .roster-wrapper {
    padding: 24px;
    max-width: 100%;
    overflow-x: auto;
  }
  
  .roster-view {
    min-width: 1400px;
  }
  
  .roster-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .roster-header h2 {
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(135deg, #f1f5f9, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .roster-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .filter-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    color: #94a3b8;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .filter-btn:hover, .filter-btn.active {
    background: rgba(99, 102, 241, 0.15);
    color: #f1f5f9;
  }
  
  .roster-stats {
    display: flex;
    gap: 16px;
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #94a3b8;
    background: rgba(30, 30, 50, 0.6);
    padding: 10px 16px;
    border-radius: 10px;
  }
  
  .team-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(20, 20, 35, 0.6);
    border-radius: 14px;
  }
  
  .team-chip {
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .team-chip.active {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.5);
  }
  
  .roster-table-container {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid rgba(99, 102, 241, 0.1);
    overflow-x: auto;
  }
  
  .roster-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  
  .roster-table th,
  .roster-table td {
    padding: 10px 6px;
    text-align: center;
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .roster-table th {
    background: rgba(15, 15, 25, 0.8);
    font-weight: 600;
    color: #94a3b8;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .doctor-col {
    width: 140px;
    min-width: 140px;
    text-align: left !important;
    padding-left: 16px !important;
    position: sticky;
    left: 0;
    background: rgba(15, 15, 25, 0.98) !important;
    z-index: 20;
  }
  
  .team-col, .points-col, .calls-col {
    position: sticky;
    background: rgba(15, 15, 25, 0.98) !important;
    z-index: 20;
  }
  
  .team-col { left: 140px; width: 70px; }
  .points-col { left: 210px; width: 80px; }
  .calls-col { left: 290px; width: 80px; }
  
  .day-col {
    min-width: 55px;
  }
  
  .day-col.weekend {
    background: rgba(245, 158, 11, 0.08);
  }
  
  .day-col.holiday {
    background: rgba(239, 68, 68, 0.08);
  }
  
  .day-header-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  
  .day-name {
    font-size: 10px;
    text-transform: uppercase;
  }
  
  .day-num {
    font-size: 14px;
    font-weight: 700;
    color: #f1f5f9;
  }
  
  .day-pts {
    font-size: 9px;
    color: #64748b;
    font-family: 'JetBrains Mono', monospace;
  }
  
  .count-row td {
    background: rgba(30, 30, 50, 0.6);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
  }
  
  .count-label {
    text-align: left !important;
    padding-left: 16px !important;
    font-weight: 600;
    color: #64748b;
  }
  
  .count-cell .ok { color: #22c55e; }
  .count-cell .warn { color: #f59e0b; }
  
  .team-row .team-header {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(99, 102, 241, 0.1);
    padding: 12px 16px;
    font-size: 12px;
  }
  
  .team-name {
    font-weight: 600;
    color: #a5b4fc;
  }
  
  .team-count {
    margin-left: auto;
    color: #64748b;
    font-size: 11px;
  }
  
  .doctor-row:hover td {
    background: rgba(99, 102, 241, 0.08);
  }
  
  .doctor-name {
    font-weight: 600;
    color: #f1f5f9;
    text-align: left !important;
    position: sticky;
    left: 0;
    background: rgba(15, 15, 25, 0.98);
    z-index: 5;
  }
  
  .team-badge-cell, .points-cell, .calls-cell {
    position: sticky;
    background: rgba(15, 15, 25, 0.98);
    z-index: 5;
  }
  
  .team-badge-cell { left: 140px; }
  .points-cell { left: 210px; }
  .calls-cell { left: 290px; }
  
  .points-value {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    color: #a5b4fc;
  }
  
  .points-delta {
    display: block;
    font-size: 10px;
    color: #22c55e;
    font-family: 'JetBrains Mono', monospace;
  }
  
  .call-counts {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #94a3b8;
  }
  
  .shift-cell {
    padding: 4px 2px !important;
  }
  
  .shift-cell.weekend {
    background: rgba(245, 158, 11, 0.05);
  }
  
  .shift-cell.holiday {
    background: rgba(239, 68, 68, 0.05);
  }
  
  /* Roster Footer */
  .roster-footer {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 24px;
    margin-top: 24px;
  }
  
  .shift-legend {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .shift-legend h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #a5b4fc;
  }
  
  .legend-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #94a3b8;
  }
  
  /* Stats */
  .stats-wrapper {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .stats-dashboard {
    background: rgba(20, 20, 35, 0.6);
    border-radius: 20px;
    padding: 32px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .stats-dashboard h3 {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 28px;
    color: #a5b4fc;
  }
  
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }
  
  .stat-card {
    background: rgba(15, 15, 25, 0.7);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .stat-value {
    display: block;
    font-size: 36px;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;
    color: #f1f5f9;
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 13px;
    color: #64748b;
    text-transform: uppercase;
  }
  
  .leaderboard {
    background: rgba(15, 15, 25, 0.5);
    border-radius: 16px;
    padding: 24px;
  }
  
  .leaderboard h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #e2e8f0;
  }
  
  .leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .leaderboard-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    background: rgba(30, 30, 50, 0.6);
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  
  .leaderboard-item .rank {
    font-size: 14px;
    font-weight: 700;
    color: #a5b4fc;
    font-family: 'JetBrains Mono', monospace;
    min-width: 36px;
  }
  
  .leaderboard-item .name {
    flex: 1;
    font-weight: 600;
    color: #e2e8f0;
  }
  
  .leaderboard-item .total-points {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    color: #22c55e;
  }
  
  .staffing-ok, .staffing-warning {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .staffing-ok { color: #22c55e; }
  .staffing-warning { color: #f59e0b; }
  
  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 16px;
    }
    
    .status-bar {
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }
    
    .team-doctors {
      grid-template-columns: 1fr;
    }
    
    .current-month {
      font-size: 22px;
      min-width: auto;
    }
    
    .availability-controls {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .stats-cards {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .roster-footer {
      grid-template-columns: 1fr;
    }
    
    .tips-content {
      gap: 12px;
    }
  }
`;