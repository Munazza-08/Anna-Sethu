import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {io} from "socket.io-client";
import {
  getNearbyRequests, getMyDeliveries, getDeliveryHistory,
  getCoupons, acceptRequest, completeDelivery
} from '../services/api';
import MapTracker from '../components/MapTracker';
import toast from 'react-hot-toast';
import './DonorDashboard.css';
import './VolunteerDashboard.css';

// const SOCKET_URL = 'http://localhost:5000'; // enable when MongoDB is connected

// ── Profile Tab ───────────────────────────────────────────────────
function VolProfileTab({ user, setUser }) {
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
          <span className="role-badge volunteer-badge">🚴 Volunteer</span>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚚</div>
          <div className="stat-num">{user?.totalDeliveries || 0}</div>
          <div className="stat-label">Deliveries Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎟️</div>
          <div className="stat-num">{user?.couponsEarned || 0}</div>
          <div className="stat-label">Coupons Earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-num">{Math.round((user?.totalDeliveries || 0) * 4.8) || 0}</div>
          <div className="stat-label">Impact Points</div>
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

// ── Nearby Requests Tab ───────────────────────────────────────────
function NearbyRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null); // open map for this delivery
  const { user } = useAuth();

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setLocating(false);
        toast.success('Location detected! 📍');
        fetchNearby(loc);
      },
      () => { toast.error('Location access denied'); setLocating(false); }
    );
  };

  const fetchNearby = async (loc) => {
    setLoading(true);
    try {
      const { data } = await getNearbyRequests(loc.lat, loc.lng);
      setRequests(data.requests);
      if (data.requests.length === 0) toast('No requests nearby right now', { icon: '📍' });
    } catch (err) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (req) => {
  setAccepting(req._id);

  try {
    const { data } = await acceptRequest(req._id);

    const acceptedRequest = data.foodRequest || req;

    setActiveDelivery(acceptedRequest);
    setRequests(prev => prev.filter(r => r._id !== req._id));

    toast.success('Request accepted! Starting live location sharing.');
  } catch (err) {
    toast.error(
      err.response?.data?.message || 'Failed to accept'
    );
  } finally {
    setAccepting(null);
  }
};
useEffect(() => {
  if (!activeDelivery?._id) return;

  let watchId;

  const socket = io('http://localhost:5000');
  const requestId = String(activeDelivery._id);

  socket.on('connect', () => {
    console.log('Connected for live tracking');
  });

  if (!navigator.geolocation) {
    toast.error('Your browser does not support GPS location');
  } else {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit('volunteer-location', {
          requestId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error('GPS error:', err.message);
        toast.error('Please allow location access to share GPS');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );
  }

  return () => {
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
    }

    socket.disconnect();
  };
}, [activeDelivery?._id]);
  // Get pickup coords from request
  const getPickupCoords = (req) => {
    const coords = req.pickupLocation?.coordinates;
    if (coords && coords.length === 2) return { lat: coords[1], lng: coords[0] };
    return null;
  };

  return (
    <>
      {activeDelivery && (
        <MapTracker
          requestTitle={activeDelivery.title}
          donorLat={getPickupCoords(activeDelivery)?.lat}
          donorLng={getPickupCoords(activeDelivery)?.lng}
          volunteerLat={null}
          volunteerLng={null}
          volunteerName={user?.name || 'You'}
          status="accepted"
          onClose={() => setActiveDelivery(null)}
          isVolunteer={true}
        />
      )}
      <div className="tab-content">
        <div className="nearby-controls">
          <button className="detect-loc-btn" onClick={detectLocation} disabled={locating}>
            {locating ? <><span className="spinner-sm"/> Detecting...</> : '📍 Detect My Location'}
          </button>
          {location && (
            <span className="loc-indicator">
              📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
          {location && !loading && (
            <button className="detect-loc-btn" onClick={() => fetchNearby(location)} style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981' }}>
              🔄 Refresh
            </button>
          )}
        </div>

        {loading && <div className="loading-state"><span className="spinner-lg"/> Finding nearby requests...</div>}

        {!loading && requests.length === 0 && location && (
          <div className="empty-state">
            <span>🗺️</span>
            <p>No food requests nearby right now. Check back soon!</p>
          </div>
        )}

        {!location && !loading && (
          <div className="empty-state">
            <span>📍</span>
            <p>Detect your location to see nearby food requests</p>
          </div>
        )}

        <div className="nearby-grid">
          {requests.map(req => (
            <div key={req._id} className="nearby-card">
              {req.image && <img src={`http://localhost:5000${req.image}`} alt={req.title} />}
              <div className="nearby-card-body">
                <h4>{req.title}</h4>
                <p>{req.description || 'No description'}</p>
                <div className="nearby-meta">
                  <span>📦 {req.quantity}</span>
                  <span>👥 {req.servings} servings</span>
                  <span>🍽️ {req.foodType}</span>
                </div>
                <div className="donor-info-row">
                  <span>🤝 {req.donor?.name}</span>
                  {req.donor?.phone && <span>📞 {req.donor.phone}</span>}
                </div>
                <button
                  className="accept-btn"
                  disabled={accepting === req._id}
                  onClick={() => handleAccept(req)}
                >
                  {accepting === req._id ? <><span className="spinner-sm"/> Accepting...</> : '✅ Accept & Navigate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Delivery History Tab ──────────────────────────────────────────
function DeliveryHistoryTab() {
  const [deliveries, setDeliveries] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [proofFile, setProofFile] = useState({});
  const [navRequest, setNavRequest] = useState(null);
  const { user } = useAuth();

  const getPickupCoords = (req) => {
    const coords = req?.pickupLocation?.coordinates;
    if (coords && coords.length === 2) return { lat: coords[1], lng: coords[0] };
    return null;
  };

  useEffect(() => {
    Promise.all([getDeliveryHistory(), getMyDeliveries()]).then(([dRes, mRes]) => {
      setDeliveries(dRes.data.deliveries);
      setMyRequests(mRes.data.requests.filter(r => r.status !== 'delivered' && r.status !== 'cancelled'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleComplete = async (reqId) => {
    setCompleting(reqId);
    try {
      const fd = new FormData();
      if (proofFile[reqId]) fd.append('proof', proofFile[reqId]);
      fd.append('notes', 'Delivered successfully');
      const { data } = await completeDelivery(reqId, fd);
      toast.success(`Delivered! 🎉 Coupon: ${data.couponCode}`);
      setMyRequests(prev => prev.filter(r => r._id !== reqId));
    } catch {
      toast.error('Failed to mark as delivered');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) return <div className="loading-state"><span className="spinner-lg"/> Loading history...</div>;

  return (
    <>
      {navRequest && (
        <MapTracker
          requestTitle={navRequest.title}
          donorLat={getPickupCoords(navRequest)?.lat}
          donorLng={getPickupCoords(navRequest)?.lng}
          volunteerLat={null}
          volunteerLng={null}
          volunteerName={user?.name || 'You'}
          status={navRequest.status || 'in_transit'}
          onClose={() => setNavRequest(null)}
          isVolunteer={true}
        />
      )}
      <div className="tab-content">
        {/* Active Deliveries */}
        {myRequests.length > 0 && (
          <>
            <h3 className="section-title">🚴 Active Deliveries</h3>
            <div className="active-deliveries-list" style={{ marginBottom: 36 }}>
              {myRequests.map(req => (
                <div key={req._id} className="delivery-card active-delivery-card">
                  <div className="delivery-no-proof">🚚</div>
                  <div className="delivery-info">
                    <h4>{req.title}</h4>
                    <p>📍 {req.donor?.name} — {req.donor?.phone}</p>
                    <div className="delivery-meta" style={{ marginBottom: 12 }}>
                      <span>📦 {req.pickupLocation?.address || 'Location captured'}</span>
                      <span className="status-badge" style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b' }}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        className="track-btn"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                        onClick={() => setNavRequest(req)}
                      >
                        🗺️ Live GPS Navigate
                      </button>
                      <div className="file-input-wrapper">
                        <input type="file" accept="image/*" id={`proof-${req._id}`}
                          onChange={e => setProofFile(prev => ({ ...prev, [req._id]: e.target.files[0] }))} />
                        <label htmlFor={`proof-${req._id}`} className="file-label" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                          {proofFile[req._id] ? `📸 ${proofFile[req._id].name}` : '📷 Add Proof Photo'}
                        </label>
                      </div>
                      <button
                        className="accept-btn"
                        style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem' }}
                        disabled={completing === req._id}
                        onClick={() => handleComplete(req._id)}
                      >
                        {completing === req._id ? <><span className="spinner-sm"/> Saving...</> : '✅ Mark Delivered'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      {/* Completed Deliveries */}
      <h3 className="section-title">📜 Delivery History</h3>
      {deliveries.length === 0 ? (
        <div className="empty-state">
          <span>📦</span>
          <p>No completed deliveries yet. Accept a request to get started!</p>
        </div>
      ) : (
        <div className="deliveries-list">
          {deliveries.map(del => (
            <div key={del._id} className="delivery-card">
              {del.proofImage
                ? <img src={`http://localhost:5000${del.proofImage}`} alt="proof" className="delivery-proof" />
                : <div className="delivery-no-proof">📦</div>
              }
              <div className="delivery-info">
                <h4>{del.foodRequest?.title || 'Food Delivery'}</h4>
                <p>Donor: {del.donor?.name}</p>
                <div className="delivery-meta">
                  <span>✅ Delivered</span>
                  <span>📅 {new Date(del.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {del.couponCode && (
                  <div className="delivery-coupon" style={{ marginTop: 8 }}>🎟️ {del.couponCode}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}

// ── Coupons Tab ───────────────────────────────────────────────────
function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCoupons().then(({ data }) => { setCoupons(data.coupons); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state"><span className="spinner-lg"/> Loading coupons...</div>;

  return (
    <div className="tab-content">
      <h3 className="section-title">🎟️ Your Earned Coupons</h3>
      {coupons.length === 0 ? (
        <div className="empty-state">
          <span>🎟️</span>
          <p>Complete deliveries to earn reward coupons!</p>
        </div>
      ) : (
        <div className="coupons-grid">
          {coupons.map(c => (
            <div key={c._id} className="coupon-card">
              <div className="coupon-icon">🎟️</div>
              <div>
                <div className="coupon-code">{c.couponCode}</div>
                <div className="coupon-sub">
                  Earned on {new Date(c.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Volunteer Dashboard ──────────────────────────────────────
export default function VolunteerDashboard() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) navigate('/auth');
    else if (user.role !== 'volunteer') navigate('/donor-dashboard');
  }, [user, navigate]);

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'nearby', label: '🗺️ Nearby Requests' },
    { id: 'history', label: '📦 Delivery History' },
    { id: 'coupons', label: '🎟️ Coupons' },
  ];

  return (
    <div className="dashboard-page volunteer-theme">
      <div className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span>🍱</span>
          <span>AnnaSethu</span>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <small>Volunteer</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(t => (
            <button key={t.id} className={`nav-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn" style={{ marginTop: 'auto' }} onClick={() => { logout(); navigate('/auth'); }}>
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

        {activeTab === 'profile' && <VolProfileTab user={user} setUser={setUser} />}
        {activeTab === 'nearby' && <NearbyRequestsTab />}
        {activeTab === 'history' && <DeliveryHistoryTab />}
        {activeTab === 'coupons' && <CouponsTab />}
      </div>
    </div>
  );
}
