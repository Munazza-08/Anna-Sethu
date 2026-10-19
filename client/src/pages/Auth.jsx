import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, register } from '../services/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('donor');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin) {
      const email = form.email.trim().toLowerCase();
      const emailPattern = /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/i;
      if (!emailPattern.test(email)) {
        toast.error('Enter a valid email address');
        return;
      }
      const digits = form.phone.replace(/\D/g, '');
      const indianPhone = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
      if (!/^[6-9]\d{9}$/.test(indianPhone)) {
        toast.error('Enter a valid 10-digit Indian phone number');
        return;
      }
      if (form.name.trim().length < 2) {
        toast.error('Name must contain at least 2 characters');
        return;
      }
    }
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await login({ email: form.email.trim().toLowerCase(), password: form.password });
      } else {
        res = await register({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), role });
      }
      const { token, user } = res.data;
      loginUser(user, token);
      toast.success(`Welcome, ${user.name}! 🎉`);
      navigate(user.role === 'donor' ? '/donor-dashboard' : user.role === 'operator' ? '/operator-dashboard' : '/volunteer-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">🍱</span>
          <h1>AnnaSethu</h1>
          <p>Feeding the world, one request at a time</p>
        </div>

        {/* Role Selector (only on register) */}
        {!isLogin && (
          <div className="role-selector">
            <button
              className={`role-btn ${role === 'donor' ? 'active' : ''}`}
              onClick={() => setRole('donor')}
              type="button"
            >
              🤝 I am a Donor
            </button>
            <button
              className={`role-btn ${role === 'volunteer' ? 'active' : ''}`}
              onClick={() => setRole('volunteer')}
              type="button"
            >
              🚴 I am a Volunteer
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                required
                maxLength={16}
                title="Enter a valid 10-digit Indian mobile number, optionally prefixed by +91"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => setIsLogin(!isLogin)} type="button">
            {isLogin ? ' Register' : ' Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
