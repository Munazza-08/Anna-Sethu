import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {io} from "socket.io-client";
import {
  getMyRequests, getCertificates, createFoodRequest
} from '../services/api';
import MapTracker from '../components/MapTracker';
import toast from 'react-hot-toast';
import './DonorDashboard.css';

// Socket URL — used when real backend is connected
// const SOCKET_URL = 'http://localhost:5000';

// ── Tab Components ────────────────────────────────────────────────

function ProfileTab({ user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const { setUser: setAuthUser } = useAuth();

  const handleSave = async () => {
    try {
      const { updateProfile } = await import('../services/api');
      const { data } = await updateProfile(form);
      setAuthUser(data.user);
      setUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="tab-content">
      <div className="profile-hero">
        <div className="profile-avatar-ring">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        </div>
        <div className="profile-info">
          <h2>{user?.name}</h2>
          <span className="role-badge donor-badge">🤝 Donor</span>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🍱</div>
          <div className="stat-num">{user?.totalDonations || 0}</div>
          <div className="stat-label">Total Donations</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-num">{user?.certificates?.length || 0}</div>
          <div className="stat-label">Certificates</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-num">{Math.round((user?.totalDonations || 0) * 3.5)}</div>
          <div className="stat-label">Lives Impacted</div>
        </div>
      </div>

      <div className="profile-form-card">
        <div className="card-header-row">
          <h3>Personal Information</h3>
          <button className="edit-btn" onClick={() => editing ? handleSave() : setEditing(true)}>
            {editing ? '💾 Save' : '✏️ Edit'}
          </button>
        </div>
        <div className="profile-fields">
          {[['Name', 'name', 'text'], ['Phone', 'phone', 'tel'], ['Address', 'address', 'text']].map(([label, key, type]) => (
            <div className="field-row" key={key}>
              <label>{label}</label>
              {editing
                ? <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                : <span>{user?.[key] || '—'}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FoodRequestModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', foodType: 'cooked', quantity: '', servings: 1 });
  const [image, setImage] = useState(null);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success('Location captured! 📍');
      },
      () => { toast.error('Location access denied'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return toast.error('Please capture your location first');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('lat', location.lat);
      fd.append('lng', location.lng);
      if (image) fd.append('image', image);
      await createFoodRequest(fd);
      toast.success('Food request posted! 🎉');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🍱 Post Food Request</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label>Food Title *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Biryani for 20 people" required />
            </div>
            <div className="form-group">
              <label>Food Type</label>
              <select value={form.foodType} onChange={e => setForm({...form, foodType: e.target.value})}>
                <option value="cooked">Cooked Food</option>
                <option value="raw">Raw Ingredients</option>
                <option value="packaged">Packaged Food</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What food are you donating? Any special notes?" rows={3} />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Quantity *</label>
              <input value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="e.g. 5 kg, 20 packets" required />
            </div>
            <div className="form-group">
              <label>Servings</label>
              <input type="number" min="1" value={form.servings} onChange={e => setForm({...form, servings: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Photo (optional)</label>
            <div className="file-input-wrapper">
              <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} id="food-image" />
              <label htmlFor="food-image" className="file-label">
                {image ? `📸 ${image.name}` : '📷 Click to add photo'}
              </label>
            </div>
          </div>

          <div className="location-section">
            {location ? (
              <div className="location-captured">
                <span>📍</span>
                <div>
                  <strong>Location Captured</strong>
                  <small>Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</small>
                </div>
                <span className="location-check">✅</span>
              </div>
            ) : (
              <button type="button" className="locate-btn" onClick={getLocation} disabled={locating}>
                {locating ? <><span className="spinner-sm"/> Detecting...</> : '📍 Auto-Detect My Location'}
              </button>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={loading || !location}>
            {loading ? <><span className="spinner-sm"/> Posting...</> : '🚀 Post Food Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

function TrackerPanel({ request }) {
  if (!request) return null;

  const statusSteps = ['pending', 'accepted', 'in_transit', 'delivered'];
  const stepIdx = statusSteps.indexOf(request.status);

  return (
    <div className="tracker-panel">
      <h3>📍 Tracking — {request.title}</h3>
      <div className="status-stepper">
        {['Posted', 'Accepted', 'In Transit', 'Delivered'].map((label, i) => (
          <div key={i} className={`step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}`}>
            <div className="step-dot" />
            <span>{label}</span>
            {i < 3 && <div className="step-line" />}
          </div>
        ))}
      </div>
      {request.volunteer && (
        <div className="volunteer-info-bar">
          <div className="vol-avatar">{request.volunteer.name?.[0]}</div>
          <div>
            <strong>{request.volunteer.name}</strong>
            <small>{request.volunteer.phone}</small>
          </div>
          <span className="status-chip">{request.status.replace('_', ' ')}</span>
        </div>
      )}
      {!request.volunteer && (
        <div className="live-coords" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
          ⏳ Waiting for a volunteer to accept this request...
        </div>
      )}
    </div>
  );
}

function DonationHistoryTab() {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [mapRequest, setMapRequest] = useState(null); // open full map for this request
  const { user } = useAuth();
  const [volunteerLocation,setVolunteerLocation]=useState(null);
  const [trackingRequestId,setTrackingRequestId]=useState(null);
  useEffect(() => {
  if (!mapRequest?._id) return;

  const socket = io('http://localhost:5000');
  const requestId = String(mapRequest._id);

  setTrackingRequestId(requestId);
  setVolunteerLocation(null);

  socket.on('connect', () => {
    socket.emit('join-tracking-room', { requestId });
  });

  socket.on('volunteer-location-update', (location) => {
    if (String(location.requestId) === requestId) {
      setVolunteerLocation({
        lat: location.lat,
        lng: location.lng,
      });
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Tracking connection error:', error.message);
  });

  return () => {
    socket.disconnect();
  };
}, [mapRequest?._id]);

  useEffect(() => {
    getMyRequests().then(({ data }) => { setRequests(data.requests); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const statusColor = { pending: '#f59e0b', accepted: '#3b82f6', in_transit: '#ff6b35', delivered: '#10b981', cancelled: '#ef4444' };

  if (loading) return <div className="loading-state"><span className="spinner-lg" />Loading requests...</div>;

  // Get donor pickup coords from the request
  const getDonorCoords = (req) => {
    const coords = req.pickupLocation?.coordinates;
    if (coords && coords.length === 2) return { lat: coords[1], lng: coords[0] };
    return null; // fallback
  };

  return (
    <div className="tab-content">
      {/* Full-screen map when Track is clicked */}
      {mapRequest && (
        <MapTracker
  requestTitle={mapRequest.title}
  donorLat={getDonorCoords(mapRequest)?.lat}
  donorLng={getDonorCoords(mapRequest)?.lng}
  volunteerLat={volunteerLocation?.lat ?? mapRequest.volunteerLocation?.lat ?? null}
  volunteerLng={volunteerLocation?.lng ?? mapRequest.volunteerLocation?.lng ?? null}
  volunteerName={mapRequest.volunteer?.name || 'Volunteer'}
  status={mapRequest.status}
  onClose={() => {
    setMapRequest(null);
    setVolunteerLocation(null);
    setTrackingRequestId(null);
  }}
  isVolunteer={false}
/>
      )}

      <h3 className="section-title">Your Food Requests</h3>
      {requests.length === 0 ? (
        <div className="empty-state">
          <span>🍱</span>
          <p>No donation requests yet. Post your first one!</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map(req => (
            <div key={req._id} className="request-card">
              {req.image && <img src={`http://localhost:5000${req.image}`} alt={req.title} className="req-img" />}
              <div className="req-body">
                <div className="req-top">
                  <h4>{req.title}</h4>
                  <span className="status-badge" style={{ background: statusColor[req.status] + '22', color: statusColor[req.status], border: `1px solid ${statusColor[req.status]}` }}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="req-desc">{req.description || 'No description'}</p>
                <div className="req-meta">
                  <span>📦 {req.quantity}</span>
                  <span>👥 {req.servings} servings</span>
                  <span>🍽️ {req.foodType}</span>
                </div>
                {req.volunteer && (
                  <div className="req-volunteer">
                    <span>🚴 {req.volunteer.name}</span>
                    <button
                      className="track-btn"
                      onClick={() => setMapRequest(req)}
                    >
                      📍 Track on Map
                    </button>
                  </div>
                )}
                <small className="req-date">{new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CertificatesTab() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCertificates().then(({ data }) => { setCerts(data.certificates); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state"><span className="spinner-lg" />Loading certificates...</div>;

  return (
    <div className="tab-content">
      <h3 className="section-title">🏆 Your Certificates</h3>
      {certs.length === 0 ? (
        <div className="empty-state">
          <span>🏆</span>
          <p>Complete your first donation to earn a certificate!</p>
        </div>
      ) : (
        <div className="certs-grid">
          {certs.map(cert => (
            <div key={cert._id} className="cert-card">
              <div className="cert-seal">🏅</div>
              <div className="cert-body">
                <h4>{cert.title}</h4>
                <p>Milestone: <strong>{cert.milestone}</strong></p>
                <p className="cert-id">ID: {cert.certificateId}</p>
                <small>{new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
              </div>
              <div className="cert-ribbon">✓ Verified</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Donor Dashboard ──────────────────────────────────────────
export default function DonorDashboard() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) navigate('/auth');
    else if (user.role !== 'donor') navigate('/volunteer-dashboard');
  }, [user, navigate]);

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'history', label: '📦 Donations' },
    { id: 'certificates', label: '🏆 Certificates' },
  ];

  return (
    <div className="dashboard-page donor-theme">
      <div className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span>🍱</span>
          <span>AnnaSethu</span>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <small>Donor</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(t => (
            <button key={t.id} className={`nav-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button className="post-request-btn" onClick={() => setShowModal(true)}>
          + Post Food Request
        </button>
        <button className="logout-btn" onClick={() => { logout(); navigate('/auth'); }}>
          🚪 Logout
        </button>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="topbar-right">
            <span className="greeting">Hello, {user?.name?.split(' ')[0]} 👋</span>
          </div>
        </div>

        {activeTab === 'profile' && <ProfileTab user={user} setUser={setUser} />}
        {activeTab === 'history' && <DonationHistoryTab key={refreshKey} />}
        {activeTab === 'certificates' && <CertificatesTab />}
      </div>

      {showModal && (
        <FoodRequestModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setActiveTab('history'); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}
