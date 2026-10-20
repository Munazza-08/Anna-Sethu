import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addCoupon, getCouponCatalog, getOperatorOverview, resolveIssueReport, toggleCoupon } from '../services/api';
import { backendAssetUrl } from '../services/backend';
import toast from 'react-hot-toast';
import './DonorDashboard.css';

export default function OperatorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [overview, setOverview] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', code: '', description: '', expiresAt: '', usageLimit: '' });

  const loadCoupons = () => getCouponCatalog().then(({ data }) => setCoupons(data.coupons)).catch(() => toast.error('Could not load coupons')).finally(() => setLoading(false));
  const loadOverview = () => getOperatorOverview().then(({ data }) => setOverview(data)).catch(() => toast.error('Could not load operator overview')).finally(() => setOverviewLoading(false));
  useEffect(() => { if (user?.role === 'operator') { loadCoupons(); loadOverview(); } }, [user?.role]);
  useEffect(() => { if (user && user.role !== 'operator') navigate(user.role === 'donor' ? '/donor-dashboard' : '/volunteer-dashboard'); }, [user, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await addCoupon(form);
      setForm({ title: '', code: '', description: '', expiresAt: '', usageLimit: '' });
      toast.success('Coupon published for volunteers');
      await loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add coupon');
    } finally { setSaving(false); }
  };

  const toggle = async (id) => {
    try { await toggleCoupon(id); await loadCoupons(); }
    catch { toast.error('Could not update coupon'); }
  };

  const resolveReport = async (reportId) => {
    try {
      await resolveIssueReport(reportId);
      toast.success('Issue marked resolved');
      await loadOverview();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not resolve report');
    }
  };

  const tabs = [
    ['overview', 'Overview'], ['deliveries', 'Deliveries'], ['users', 'Users'],
    ['reports', 'Reported Issues'], ['claims', 'Coupon Claims'], ['coupons', 'Coupons'],
  ];

  return <div className="dashboard-page volunteer-theme">
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand"><span>🍱</span><span>AnnaSethu</span></div>
      <div className="sidebar-user"><div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div><div><strong>{user?.name}</strong><small>Operator</small></div></div>
      <button className="logout-btn" style={{ marginTop: 'auto' }} onClick={() => { logout(); navigate('/auth'); }}>🚪 Logout</button>
    </aside>
    <main className="dashboard-main">
      <div className="dashboard-topbar"><h1>{tabs.find(([id]) => id === activeView)?.[1]}</h1>
        <button className="track-btn" onClick={() => { loadOverview(); if (activeView === 'coupons') loadCoupons(); }}>↻ Refresh</button>
      </div>
      <nav className="operator-tabs">
        {tabs.map(([id, label]) => <button key={id} className={activeView === id ? 'active' : ''} onClick={() => setActiveView(id)}>{label}</button>)}
      </nav>
      <div className="tab-content">
        {activeView === 'overview' && (overviewLoading ? <div className="loading-state">Loading overview...</div> : <>
          <div className="stats-grid operator-stat-grid">
            {[
              ['Donors', overview?.counts?.donors || 0], ['Volunteers', overview?.counts?.volunteers || 0], ['Operators', overview?.counts?.operators || 0],
              ['Food Requests', overview?.counts?.foodRequests || 0], ['Deliveries', overview?.counts?.deliveries || 0],
              ['Open Issues', overview?.counts?.openReports || 0], ['Coupon Claims', overview?.counts?.couponClaims || 0],
            ].map(([label, value]) => <div className="stat-card" key={label}><div className="stat-num">{value}</div><div className="stat-label">{label}</div></div>)}
          </div>
          <h2 className="section-title" style={{ marginTop: 26 }}>Recent activity</h2>
          <div className="operator-summary-grid">
            <div className="profile-form-card"><h3>Latest deliveries</h3>{(overview?.deliveries || []).slice(0, 5).map(delivery => <p key={delivery._id}>{delivery.foodRequest?.title || 'Food delivery'} · {delivery.volunteer?.name || 'Volunteer'} · {new Date(delivery.deliveredAt).toLocaleDateString()}</p>)}</div>
            <div className="profile-form-card"><h3>Latest reports</h3>{(overview?.reports || []).filter(report => report.status === 'open').slice(0, 5).map(report => <p key={report._id}>{report.foodRequest?.title || 'Request'} · {report.reporter?.name || 'User'} · Open</p>)}</div>
          </div>
        </>)}

        {activeView === 'deliveries' && (overviewLoading ? <div className="loading-state">Loading deliveries...</div> : (overview?.deliveries || []).length === 0 ? <div className="empty-state"><span>📦</span><p>No deliveries recorded yet.</p></div> : <div className="operator-record-list">
          {overview.deliveries.map(delivery => <article className="profile-form-card operator-record" key={delivery._id}>
            {delivery.proofImage && <img className="operator-proof" src={backendAssetUrl(delivery.proofImage)} alt="Delivery proof" />}
            <div><h3>{delivery.foodRequest?.title || 'Food delivery'}</h3><p>Volunteer: {delivery.volunteer?.name || '—'} ({delivery.volunteer?.email || '—'})</p><p>Donor: {delivery.donor?.name || '—'} ({delivery.donor?.email || '—'})</p><small>Delivered {new Date(delivery.deliveredAt).toLocaleString()}</small></div>
          </article>)}
        </div>)}

        {activeView === 'users' && (overviewLoading ? <div className="loading-state">Loading users...</div> : <div className="operator-record-list">
          {(overview?.users || []).map(account => <article className="profile-form-card operator-record" key={account._id}>
            <div><h3>{account.name} <span className="operator-role-pill">{account.role}</span></h3><p>{account.email} · {account.phone || 'No phone listed'}</p><p>{account.role === 'volunteer' ? `${account.totalDeliveries || 0} deliveries · ${account.points || 0} points` : `${account.totalDonations || 0} donations`}</p></div>
            <small>Joined {new Date(account.createdAt).toLocaleDateString()}</small>
          </article>)}
        </div>)}

        {activeView === 'reports' && (overviewLoading ? <div className="loading-state">Loading reports...</div> : (overview?.reports || []).length === 0 ? <div className="empty-state"><span>✅</span><p>No issues have been reported.</p></div> : <div className="operator-record-list">
          {overview.reports.map(report => <article className="profile-form-card operator-record" key={report._id}>
            <div><h3>{report.foodRequest?.title || 'Food request'} <span className={`operator-role-pill ${report.status === 'open' ? 'issue-open' : 'issue-resolved'}`}>{report.status}</span></h3><p>Reported by {report.reporter?.name || 'User'} ({report.reporter?.role || '—'}) · {new Date(report.createdAt).toLocaleString()}</p><p>{report.details}</p>{report.resolutionNote && <small>Resolution: {report.resolutionNote}</small>}</div>
            {report.status === 'open' && <button className="track-btn" onClick={() => resolveReport(report._id)}>Mark resolved</button>}
          </article>)}
        </div>)}

        {activeView === 'claims' && (overviewLoading ? <div className="loading-state">Loading coupon claims...</div> : (overview?.couponClaims || []).length === 0 ? <div className="empty-state"><span>🎟️</span><p>No coupons have been claimed.</p></div> : <div className="operator-record-list">
          {overview.couponClaims.map(claim => <article className="profile-form-card operator-record" key={claim._id}>
            <div><h3>{claim.couponTitle}</h3><p>Claimed by {claim.volunteer?.name || 'Volunteer'} ({claim.volunteer?.email || '—'})</p><p>Code: <strong>{claim.couponCode}</strong> · {claim.pointsSpent} points</p></div>
            <small>{new Date(claim.redeemedAt).toLocaleString()}</small>
          </article>)}
        </div>)}

        {activeView === 'coupons' && <>
        <p className="section-title">Add a coupon to the volunteer catalog. Volunteers can claim one coupon for every 10 points.</p>
        <form className="profile-form-card operator-coupon-form" onSubmit={submit}>
          <label>Coupon title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 15% off groceries" /></label>
          <label>Coupon code<input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. ANNA15" /></label>
          <label>Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional details" /></label>
          <label>Expiry date (optional)<input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></label>
          <label>Maximum claims (optional)<input type="number" min="1" step="1" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Leave blank for unlimited" /></label>
          <button className="submit-btn" disabled={saving}>{saving ? 'Publishing…' : 'Publish Coupon'}</button>
        </form>
        <h2 className="section-title" style={{ marginTop: 28 }}>Coupon Catalog</h2>
        {loading ? <div className="loading-state">Loading coupons...</div> : coupons.length === 0 ? <div className="empty-state"><span>🎟️</span><p>No coupons posted yet.</p></div> : <div className="coupons-grid">
          {coupons.map(coupon => {
            const expired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now();
            const full = coupon.usageLimit != null && coupon.claimedCount >= coupon.usageLimit;
            const availability = !coupon.active ? 'Hidden from volunteers' : expired ? 'Expired' : full ? 'Fully claimed' : 'Available';
            return <div key={coupon._id} className="coupon-card">
            <div className="coupon-icon">🎟️</div><div><div className="coupon-code">{coupon.title}</div><div className="coupon-sub">{coupon.code}{coupon.description ? ` · ${coupon.description}` : ''}</div>
              <div className="coupon-sub">{availability} · {coupon.claimedCount || 0} claimed{coupon.usageLimit != null ? ` of ${coupon.usageLimit}` : ' · no claim limit'}</div>
              {coupon.expiresAt && <div className="coupon-sub">Expires {new Date(coupon.expiresAt).toLocaleDateString()}</div>}
            </div>
            <button className="track-btn" onClick={() => toggle(coupon._id)}>{coupon.active ? 'Hide' : 'Publish'}</button>
          </div>})}
        </div>}
        </>}
      </div>
    </main>
  </div>;
}
