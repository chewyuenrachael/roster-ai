import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Settings, ChevronLeft, Edit2, Trash2, Save, X, 
  Shield, UserCheck, Mail, Building2, AlertCircle, CheckCircle, 
  RefreshCw, Link2, Database
} from 'lucide-react';
import { db, supabase } from '../lib/supabase';

// Team options
const TEAMS = [
  { key: 'ESU', name: 'Emergency Surgical Unit', color: '#8A7A9A' },
  { key: 'NES', name: 'Neurosurgery', color: '#3A5A7A' },
  { key: 'VAS', name: 'Vascular', color: '#5A8A9A' },
  { key: 'CLR', name: 'Colorectal', color: '#7FAE9A' },
  { key: 'HPB', name: 'Hepatobiliary', color: '#6A8A9A' },
  { key: 'UGI', name: 'Upper GI', color: '#9AAE7A' },
  { key: 'BES', name: 'Breast/Endocrine', color: '#D6B656' },
  { key: 'URO', name: 'Urology', color: '#B08A9A' },
  { key: 'PRAS', name: 'Plastic Surgery', color: '#C48A9A' },
];

const ROLES = [
  { key: 'doctor', name: 'Doctor', description: 'Can view roster and submit requests' },
  { key: 'roster_admin', name: 'Roster IC', description: 'Can generate and publish rosters' },
  { key: 'admin', name: 'Admin', description: 'Full access to all settings' },
];

const AdminPanel = ({ onBack }) => {
  const [doctors, setDoctors] = useState([]);
  const [authUsers, setAuthUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    team_key: 'ESU',
    role: 'doctor'
  });

  // Fetch doctors and auth users
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await db.doctors.getAll();
      if (doctorsError) throw doctorsError;
      setDoctors(doctorsData || []);
      
      // Fetch auth users (this requires admin access in real scenario)
      // For now, we'll get users that are linked to doctors
      const linkedUserIds = doctorsData?.filter(d => d.user_id).map(d => d.user_id) || [];
      setAuthUsers(linkedUserIds);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add new doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!newDoctor.name.trim()) {
      setError('Name is required');
      return;
    }
    
    try {
      const { data, error } = await db.doctors.create({
        name: newDoctor.name.trim(),
        email: newDoctor.email.trim() || null,
        team_key: newDoctor.team_key,
        role: newDoctor.role,
        is_active: true,
        cumulative_points: 0
      });
      
      if (error) throw error;
      
      setDoctors(prev => [...prev, data]);
      setNewDoctor({ name: '', email: '', team_key: 'ESU', role: 'doctor' });
      setShowAddForm(false);
      setSuccess('Doctor added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Update doctor
  const handleUpdateDoctor = async (doctor) => {
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await db.doctors.update(doctor.id, {
        name: doctor.name,
        email: doctor.email,
        team_key: doctor.team_key,
        role: doctor.role,
        is_active: doctor.is_active
      });
      
      if (error) throw error;
      
      setDoctors(prev => prev.map(d => d.id === doctor.id ? data : d));
      setEditingDoctor(null);
      setSuccess('Doctor updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete doctor
  const handleDeleteDoctor = async (id) => {
    if (!confirm('Are you sure you want to delete this doctor? This cannot be undone.')) {
      return;
    }
    
    setError(null);
    
    try {
      const { error } = await db.doctors.delete(id);
      if (error) throw error;
      
      setDoctors(prev => prev.filter(d => d.id !== id));
      setSuccess('Doctor deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Link user to doctor (when they sign up with same email)
  const handleLinkUser = async (doctorId, email) => {
    setError(null);
    
    try {
      // This would need a server-side function to look up user by email
      // For now, show instructions
      setError(
        `To link a user: The user must sign up with email "${email}". ` +
        `Then run this SQL in Supabase: ` +
        `UPDATE doctors SET user_id = (SELECT id FROM auth.users WHERE email = '${email}') WHERE id = '${doctorId}';`
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const getTeamColor = (teamKey) => {
    return TEAMS.find(t => t.key === teamKey)?.color || '#6B7280';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' };
      case 'roster_admin': return { bg: '#DBEAFE', color: '#2563EB', border: '#BFDBFE' };
      default: return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' };
    }
  };

  return (
    <div className="admin-panel">
      <style>{adminStyles}</style>
      
      <div className="admin-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-title">
          <Settings size={24} />
          <h2>Admin Panel</h2>
        </div>
        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="message success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <Users size={24} />
          <div>
            <span className="stat-value">{doctors.length}</span>
            <span className="stat-label">Total Doctors</span>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck size={24} />
          <div>
            <span className="stat-value">{doctors.filter(d => d.user_id).length}</span>
            <span className="stat-label">Linked Users</span>
          </div>
        </div>
        <div className="stat-card">
          <Shield size={24} />
          <div>
            <span className="stat-value">{doctors.filter(d => d.role === 'admin' || d.role === 'roster_admin').length}</span>
            <span className="stat-label">Admins</span>
          </div>
        </div>
      </div>

      {/* Add Doctor Button */}
      <div className="section-header">
        <h3>Manage Doctors</h3>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>
          <UserPlus size={18} />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Add Doctor Form */}
      {showAddForm && (
        <div className="add-form">
          <h4>Add New Doctor</h4>
          <form onSubmit={handleAddDoctor}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newDoctor.name}
                  onChange={e => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Dr. John Smith"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newDoctor.email}
                  onChange={e => setNewDoctor(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.smith@hospital.com"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Team</label>
                <select
                  value={newDoctor.team_key}
                  onChange={e => setNewDoctor(prev => ({ ...prev, team_key: e.target.value }))}
                >
                  {TEAMS.map(team => (
                    <option key={team.key} value={team.key}>{team.key} - {team.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newDoctor.role}
                  onChange={e => setNewDoctor(prev => ({ ...prev, role: e.target.value }))}
                >
                  {ROLES.map(role => (
                    <option key={role.key} value={role.key}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                <UserPlus size={16} />
                Add Doctor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors List */}
      <div className="doctors-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spinning" />
            <span>Loading doctors...</span>
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>No doctors added yet</p>
            <button onClick={() => setShowAddForm(true)}>Add your first doctor</button>
          </div>
        ) : (
          doctors.map(doctor => (
            <div key={doctor.id} className={`doctor-card ${editingDoctor?.id === doctor.id ? 'editing' : ''}`}>
              {editingDoctor?.id === doctor.id ? (
                // Edit Mode
                <div className="edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={editingDoctor.name}
                        onChange={e => setEditingDoctor(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editingDoctor.email || ''}
                        onChange={e => setEditingDoctor(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Team</label>
                      <select
                        value={editingDoctor.team_key}
                        onChange={e => setEditingDoctor(prev => ({ ...prev, team_key: e.target.value }))}
                      >
                        {TEAMS.map(team => (
                          <option key={team.key} value={team.key}>{team.key}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={editingDoctor.role}
                        onChange={e => setEditingDoctor(prev => ({ ...prev, role: e.target.value }))}
                      >
                        {ROLES.map(role => (
                          <option key={role.key} value={role.key}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={editingDoctor.is_active}
                          onChange={e => setEditingDoctor(prev => ({ ...prev, is_active: e.target.checked }))}
                        />
                        Active
                      </label>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="cancel-btn" onClick={() => setEditingDoctor(null)}>
                      <X size={16} /> Cancel
                    </button>
                    <button className="save-btn" onClick={() => handleUpdateDoctor(editingDoctor)}>
                      <Save size={16} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="doctor-avatar" style={{ background: getTeamColor(doctor.team_key) }}>
                    {doctor.name?.charAt(0) || '?'}
                  </div>
                  <div className="doctor-info">
                    <div className="doctor-name">
                      {doctor.name}
                      {!doctor.is_active && <span className="inactive-badge">Inactive</span>}
                    </div>
                    <div className="doctor-meta">
                      {doctor.email && (
                        <span className="meta-item">
                          <Mail size={12} />
                          {doctor.email}
                        </span>
                      )}
                      <span className="meta-item">
                        <Building2 size={12} />
                        {doctor.team_key}
                      </span>
                    </div>
                  </div>
                  <div className="doctor-badges">
                    <span 
                      className="role-badge"
                      style={{
                        background: getRoleBadgeColor(doctor.role).bg,
                        color: getRoleBadgeColor(doctor.role).color,
                        borderColor: getRoleBadgeColor(doctor.role).border
                      }}
                    >
                      {ROLES.find(r => r.key === doctor.role)?.name || doctor.role}
                    </span>
                    {doctor.user_id ? (
                      <span className="linked-badge">
                        <Link2 size={12} />
                        Linked
                      </span>
                    ) : (
                      <span className="unlinked-badge">
                        <Database size={12} />
                        Not linked
                      </span>
                    )}
                  </div>
                  <div className="doctor-actions">
                    <button className="edit-btn" onClick={() => setEditingDoctor({ ...doctor })}>
                      <Edit2 size={16} />
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteDoctor(doctor.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h4>📋 Quick Start Guide</h4>
        <ol>
          <li><strong>Add doctors</strong> - Click "Add Doctor" to create doctor profiles</li>
          <li><strong>Set emails</strong> - Add email addresses so users can be linked when they sign up</li>
          <li><strong>Assign roles</strong> - Set at least one person as "Roster IC" to generate rosters</li>
          <li><strong>Link users</strong> - When a doctor signs up with matching email, they auto-link</li>
        </ol>
      </div>
    </div>
  );
};

const adminStyles = `
  .admin-panel {
    max-width: 1000px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  .admin-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 28px;
  }

  .admin-header .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0F766E;
    flex: 1;
  }

  .admin-header h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1E293B;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    color: #64748B;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: #F1F5F9;
    color: #1E293B;
  }

  .refresh-btn {
    width: 40px;
    height: 40px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    color: #64748B;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .refresh-btn:hover {
    background: #F1F5F9;
    color: #0F766E;
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .message {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .message.error {
    background: #FEF2F2;
    color: #DC2626;
    border: 1px solid #FECACA;
  }

  .message.success {
    background: #F0FDF4;
    color: #16A34A;
    border: 1px solid #BBF7D0;
  }

  .message button {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
  }

  .message button:hover {
    opacity: 1;
  }

  .admin-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }

  .stat-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-card svg {
    color: #0F766E;
  }

  .stat-value {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: #1E293B;
  }

  .stat-label {
    display: block;
    font-size: 13px;
    color: #64748B;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .section-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1E293B;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%);
    border: none;
    border-radius: 8px;
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
  }

  .add-form, .edit-form {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .add-form h4 {
    font-size: 16px;
    font-weight: 600;
    color: #1E293B;
    margin-bottom: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  .form-group input,
  .form-group select {
    padding: 10px 14px;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-size: 14px;
    background: #FFFFFF;
    transition: all 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #0F766E;
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }

  .checkbox-group {
    flex-direction: row;
    align-items: center;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }

  .cancel-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    color: #64748B;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    background: #F3F4F6;
    color: #374151;
  }

  .save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    background: #0F766E;
    border: none;
    border-radius: 8px;
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn:hover {
    background: #0D6359;
  }

  .doctors-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
  }

  .doctor-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.2s;
  }

  .doctor-card:hover {
    border-color: #CBD5E1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .doctor-card.editing {
    border-color: #0F766E;
    background: #F8FAFC;
  }

  .doctor-avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-weight: 600;
    font-size: 18px;
    flex-shrink: 0;
  }

  .doctor-info {
    flex: 1;
    min-width: 0;
  }

  .doctor-name {
    font-size: 15px;
    font-weight: 600;
    color: #1E293B;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .inactive-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    background: #FEE2E2;
    color: #DC2626;
    border-radius: 4px;
  }

  .doctor-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #64748B;
  }

  .doctor-badges {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }

  .role-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid;
  }

  .linked-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    background: #D1FAE5;
    color: #065F46;
    border-radius: 4px;
  }

  .unlinked-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    background: #FEF3C7;
    color: #92400E;
    border-radius: 4px;
  }

  .doctor-actions {
    display: flex;
    gap: 8px;
  }

  .edit-btn, .delete-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #64748B;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    background: #EFF6FF;
    border-color: #BFDBFE;
    color: #2563EB;
  }

  .delete-btn:hover {
    background: #FEF2F2;
    border-color: #FECACA;
    color: #DC2626;
  }

  .loading-state, .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #64748B;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .empty-state svg {
    color: #CBD5E1;
    margin-bottom: 12px;
  }

  .empty-state p {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .empty-state button {
    padding: 10px 20px;
    background: #0F766E;
    border: none;
    border-radius: 8px;
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .instructions {
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-radius: 12px;
    padding: 24px;
  }

  .instructions h4 {
    font-size: 16px;
    font-weight: 600;
    color: #166534;
    margin-bottom: 16px;
  }

  .instructions ol {
    margin: 0;
    padding-left: 24px;
  }

  .instructions li {
    font-size: 14px;
    color: #166534;
    margin-bottom: 10px;
    line-height: 1.5;
  }

  .instructions li:last-child {
    margin-bottom: 0;
  }
`;

export default AdminPanel;
