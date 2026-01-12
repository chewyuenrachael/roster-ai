import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onAuth, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        
        const result = await onAuth('signup', { email, password, name });
        if (result.error) {
          setError(result.error.message);
        } else {
          setSuccess('Account created! Please check your email to verify your account.');
          // Reset form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
        }
      } else {
        const result = await onAuth('login', { email, password });
        if (result.error) {
          setError(result.error.message);
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-header">
          <div className="auth-icon">
            {mode === 'login' ? <LogIn size={24} /> : <UserPlus size={24} />}
          </div>
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{mode === 'login' ? 'Sign in to access your roster' : 'Join RosterAI to manage your schedule'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">
                <User size={16} />
                <span>Full Name</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. John Smith"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={16} />
              <span>Email</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={16} />
              <span>Password</span>
            </label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={16} />
                <span>Confirm Password</span>
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {error && (
            <div className="auth-message error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-message success">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={switchMode} className="switch-mode">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <button className="close-modal" onClick={onClose}>×</button>
      </div>

      <style>{`
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .auth-modal {
          background: #FFFFFF;
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          padding: 32px;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .auth-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #fff;
        }

        .auth-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 8px;
        }

        .auth-header p {
          font-size: 14px;
          color: #64748B;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          padding: 12px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.2s;
          background: #F9FAFB;
        }

        .form-group input:focus {
          outline: none;
          border-color: #0F766E;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
        }

        .password-input {
          position: relative;
        }

        .password-input input {
          width: 100%;
          padding-right: 48px;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6B7280;
          cursor: pointer;
          padding: 4px;
        }

        .toggle-password:hover {
          color: #374151;
        }

        .auth-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
        }

        .auth-message.error {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .auth-message.success {
          background: #F0FDF4;
          color: #16A34A;
          border: 1px solid #BBF7D0;
        }

        .auth-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
        }

        .auth-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
        }

        .auth-footer p {
          font-size: 14px;
          color: #64748B;
        }

        .switch-mode {
          background: none;
          border: none;
          color: #0F766E;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .switch-mode:hover {
          text-decoration: underline;
        }

        .close-modal {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          background: #F3F4F6;
          border: none;
          border-radius: 8px;
          font-size: 20px;
          color: #6B7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-modal:hover {
          background: #E5E7EB;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default AuthModal;
