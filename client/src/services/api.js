// ─────────────────────────────────────────────────────────────
//  MOCK API — Runs entirely in the browser using localStorage
//  Replace with real API calls once MongoDB is connected.
// ─────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

const getStore = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const setStore = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── Seed demo data if first visit ──────────────────────────────
const seedDemoData = () => {
  if (getStore('as_seeded', false)) return;

  // Demo donor
  const donor = {
    _id: 'donor-demo-001',
    name: 'Priya Ramesh',
    email: 'donor@demo.com',
    password: 'demo1234',
    role: 'donor',
    phone: '+91 98765 43210',
    address: 'Anna Nagar, Chennai',
    avatar: '',
    totalDonations: 7,
    certificates: ['cert-001', 'cert-002'],
    couponsEarned: 0,
    createdAt: new Date('2024-01-15').toISOString(),
  };

  // Demo volunteer
  const volunteer = {
    _id: 'vol-demo-001',
    name: 'Arjun Kumar',
    email: 'volunteer@demo.com',
    password: 'demo1234',
    role: 'volunteer',
    phone: '+91 91234 56789',
    address: 'T. Nagar, Chennai',
    avatar: '',
    totalDonations: 0,
    totalDeliveries: 5,
    couponsEarned: 5,
    isAvailable: true,
    createdAt: new Date('2024-02-10').toISOString(),
  };

  setStore('as_users', [donor, volunteer]);

  // Demo food requests
  setStore('as_food_requests', [
    {
      _id: 'req-001',
      donor: { _id: 'donor-demo-001', name: 'Priya Ramesh', phone: '+91 98765 43210' },
      volunteer: { _id: 'vol-demo-001', name: 'Arjun Kumar', phone: '+91 91234 56789' },
      title: 'Biryani for 30 People',
      description: 'Freshly cooked chicken biryani from our restaurant surplus.',
      foodType: 'cooked',
      quantity: '15 kg',
      servings: 30,
      status: 'delivered',
      pickupLocation: { address: 'Anna Nagar, Chennai', coordinates: [80.2101, 13.0827] },
      image: '',
      createdAt: new Date('2024-03-01').toISOString(),
    },
    {
      _id: 'req-002',
      donor: { _id: 'donor-demo-001', name: 'Priya Ramesh', phone: '+91 98765 43210' },
      volunteer: null,
      title: 'Rice & Dal Packets',
      description: 'Packaged rice and dal from community kitchen.',
      foodType: 'packaged',
      quantity: '20 packets',
      servings: 20,
      status: 'pending',
      pickupLocation: { address: 'Anna Nagar, Chennai', coordinates: [80.2101, 13.0827] },
      image: '',
      createdAt: new Date('2024-03-10').toISOString(),
    },
    {
      _id: 'req-003',
      donor: { _id: 'donor-demo-001', name: 'Priya Ramesh', phone: '+91 98765 43210' },
      volunteer: null,
      title: 'Idli & Sambar',
      description: 'Morning breakfast surplus — 50 idlis with sambar.',
      foodType: 'cooked',
      quantity: '50 idlis',
      servings: 25,
      status: 'accepted',
      pickupLocation: { address: 'Anna Nagar, Chennai', coordinates: [80.2101, 13.0827] },
      image: '',
      createdAt: new Date('2024-03-12').toISOString(),
    },
  ]);

  // Demo certificates
  setStore('as_certificates', [
    {
      _id: 'cert-001',
      donor: 'donor-demo-001',
      title: '1 Donation Milestone',
      milestone: '1 donation',
      certificateId: 'CERT-17098-DEMO1',
      issuedAt: new Date('2024-01-20').toISOString(),
    },
    {
      _id: 'cert-002',
      donor: 'donor-demo-001',
      title: '5 Donations Milestone',
      milestone: '5 donations',
      certificateId: 'CERT-17099-DEMO5',
      issuedAt: new Date('2024-02-28').toISOString(),
    },
  ]);

  // Demo deliveries
  setStore('as_deliveries', [
    {
      _id: 'del-001',
      volunteer: 'vol-demo-001',
      donor: { _id: 'donor-demo-001', name: 'Priya Ramesh', avatar: '' },
      foodRequest: { _id: 'req-001', title: 'Biryani for 30 People', status: 'delivered' },
      proofImage: '',
      notes: 'Delivered successfully to the shelter.',
      couponAwarded: true,
      couponCode: 'ANNA-XK9PLM2Q',
      deliveredAt: new Date('2024-03-01').toISOString(),
    },
    {
      _id: 'del-002',
      volunteer: 'vol-demo-001',
      donor: { _id: 'donor-demo-001', name: 'Priya Ramesh', avatar: '' },
      foodRequest: { _id: 'req-004', title: 'Veg Meals Box', status: 'delivered' },
      proofImage: '',
      notes: 'Happy to help!',
      couponAwarded: true,
      couponCode: 'ANNA-TZ3AB9WR',
      deliveredAt: new Date('2024-03-05').toISOString(),
    },
  ]);

  setStore('as_seeded', true);
};

seedDemoData();

// ── Helpers ─────────────────────────────────────────────────────
const makeToken = (userId) => `mock_token_${userId}_${Date.now()}`;

const mockResp = (data) => ({ data: { success: true, ...data } });

// ── Auth ─────────────────────────────────────────────────────────
export const register = async ({ name, email, password, role, phone }) => {
  await delay();
  const users = getStore('as_users', []);
  if (users.find(u => u.email === email)) {
    throw { response: { data: { message: 'Email already registered' } } };
  }
  const milestones = [1, 5, 10, 25, 50, 100];
  const user = {
    _id: `user-${Date.now()}`,
    name, email, password, role, phone: phone || '',
    address: '', avatar: '',
    totalDonations: 0, totalDeliveries: 0, couponsEarned: 0,
    certificates: [], isAvailable: true,
    createdAt: new Date().toISOString(),
  };
  setStore('as_users', [...users, user]);
  const token = makeToken(user._id);
  return mockResp({ token, user });
};

export const login = async ({ email, password }) => {
  await delay();
  const users = getStore('as_users', []);
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw { response: { data: { message: 'Invalid email or password' } } };
  const token = makeToken(user._id);
  return mockResp({ token, user });
};

export const getMe = async () => {
  await delay(100);
  const token = localStorage.getItem('annasethu_token');
  if (!token) throw { response: { data: { message: 'No token' } } };
  // Extract userId from token
  const userId = token.replace('mock_token_', '').split('_')[0];
  const users = getStore('as_users', []);
  const user = users.find(u => u._id === userId);
  if (!user) throw { response: { data: { message: 'User not found' } } };
  return mockResp({ user });
};

export const updateProfile = async ({ name, phone, address, isAvailable }) => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const users = getStore('as_users', []);
  const idx = users.findIndex(u => u._id === userId);
  if (idx === -1) throw { response: { data: { message: 'User not found' } } };
  users[idx] = { ...users[idx], name: name || users[idx].name, phone: phone || users[idx].phone, address: address || users[idx].address, isAvailable: isAvailable ?? users[idx].isAvailable };
  setStore('as_users', users);
  return mockResp({ user: users[idx] });
};

// ── Food Requests ────────────────────────────────────────────────
export const createFoodRequest = async (formData) => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const users = getStore('as_users', []);
  const user = users.find(u => u._id === userId);

  const req = {
    _id: `req-${Date.now()}`,
    donor: { _id: userId, name: user?.name, phone: user?.phone },
    volunteer: null,
    title: formData.get('title'),
    description: formData.get('description') || '',
    foodType: formData.get('foodType') || 'other',
    quantity: formData.get('quantity'),
    servings: parseInt(formData.get('servings')) || 1,
    status: 'pending',
    pickupLocation: {
      address: '',
      coordinates: [parseFloat(formData.get('lng')), parseFloat(formData.get('lat'))],
    },
    image: '',
    createdAt: new Date().toISOString(),
  };

  const requests = getStore('as_food_requests', []);
  setStore('as_food_requests', [...requests, req]);

  // Increment donor donations
  const idx = users.findIndex(u => u._id === userId);
  if (idx !== -1) {
    users[idx].totalDonations = (users[idx].totalDonations || 0) + 1;
    setStore('as_users', users);

    // Award certificate at milestones
    const milestones = [1, 5, 10, 25, 50, 100];
    if (milestones.includes(users[idx].totalDonations)) {
      const certs = getStore('as_certificates', []);
      certs.push({
        _id: `cert-${Date.now()}`,
        donor: userId,
        title: `${users[idx].totalDonations} Donation${users[idx].totalDonations > 1 ? 's' : ''} Milestone`,
        milestone: `${users[idx].totalDonations} donation${users[idx].totalDonations > 1 ? 's' : ''}`,
        certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        issuedAt: new Date().toISOString(),
      });
      setStore('as_certificates', certs);
    }
  }

  return mockResp({ foodRequest: req });
};

export const getNearbyRequests = async (lat, lng, radius = 10000) => {
  await delay();
  const all = getStore('as_food_requests', []);
  // Return all pending requests (mock — no real geo filtering)
  const requests = all.filter(r => r.status === 'pending');
  return mockResp({ requests });
};

export const getMyRequests = async () => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const all = getStore('as_food_requests', []);
  const requests = all.filter(r => r.donor?._id === userId).reverse();
  return mockResp({ requests });
};

export const getMyDeliveries = async () => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const all = getStore('as_food_requests', []);
  const requests = all.filter(r => r.volunteer?._id === userId && r.status !== 'delivered').reverse();
  return mockResp({ requests });
};

export const acceptRequest = async (id) => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const users = getStore('as_users', []);
  const vol = users.find(u => u._id === userId);
  const requests = getStore('as_food_requests', []);
  const idx = requests.findIndex(r => r._id === id);
  if (idx === -1) throw { response: { data: { message: 'Request not found' } } };
  if (requests[idx].status !== 'pending') throw { response: { data: { message: 'Already accepted' } } };
  requests[idx].volunteer = { _id: userId, name: vol?.name, phone: vol?.phone };
  requests[idx].status = 'accepted';
  requests[idx].acceptedAt = new Date().toISOString();
  setStore('as_food_requests', requests);
  return mockResp({ foodRequest: requests[idx] });
};

export const markInTransit = async (id) => {
  await delay();
  const requests = getStore('as_food_requests', []);
  const idx = requests.findIndex(r => r._id === id);
  if (idx !== -1) { requests[idx].status = 'in_transit'; setStore('as_food_requests', requests); }
  return mockResp({ foodRequest: requests[idx] });
};

export const completeDelivery = async (id, formData) => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const requests = getStore('as_food_requests', []);
  const reqIdx = requests.findIndex(r => r._id === id);
  if (reqIdx !== -1) {
    requests[reqIdx].status = 'delivered';
    requests[reqIdx].deliveredAt = new Date().toISOString();
    setStore('as_food_requests', requests);
  }

  const couponCode = `ANNA-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  const deliveries = getStore('as_deliveries', []);
  const newDel = {
    _id: `del-${Date.now()}`,
    volunteer: userId,
    donor: requests[reqIdx]?.donor || {},
    foodRequest: { _id: id, title: requests[reqIdx]?.title, status: 'delivered' },
    proofImage: '',
    notes: formData.get?.('notes') || 'Delivered successfully',
    couponAwarded: true,
    couponCode,
    deliveredAt: new Date().toISOString(),
  };
  setStore('as_deliveries', [...deliveries, newDel]);

  // Update volunteer stats
  const users = getStore('as_users', []);
  const volIdx = users.findIndex(u => u._id === userId);
  if (volIdx !== -1) {
    users[volIdx].totalDeliveries = (users[volIdx].totalDeliveries || 0) + 1;
    users[volIdx].couponsEarned = (users[volIdx].couponsEarned || 0) + 1;
    setStore('as_users', users);
  }

  return mockResp({ delivery: newDel, couponCode });
};

export const getRequest = async (id) => {
  await delay();
  const all = getStore('as_food_requests', []);
  const request = all.find(r => r._id === id);
  if (!request) throw { response: { data: { message: 'Not found' } } };
  return mockResp({ request });
};

// ── User extras ──────────────────────────────────────────────────
export const getCertificates = async () => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const all = getStore('as_certificates', []);
  const certificates = all.filter(c => c.donor === userId).reverse();
  return mockResp({ certificates });
};

export const getDeliveryHistory = async () => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const all = getStore('as_deliveries', []);
  const deliveries = all.filter(d => d.volunteer === userId).reverse();
  return mockResp({ deliveries });
};

export const getCoupons = async () => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const all = getStore('as_deliveries', []);
  const coupons = all.filter(d => d.volunteer === userId && d.couponAwarded).reverse()
    .map(d => ({ _id: d._id, couponCode: d.couponCode, deliveredAt: d.deliveredAt }));
  return mockResp({ coupons });
};

export const getStats = async () => {
  await delay();
  const token = localStorage.getItem('annasethu_token');
  const userId = token.replace('mock_token_', '').split('_')[0];
  const users = getStore('as_users', []);
  const user = users.find(u => u._id === userId);
  return mockResp({ user });
};

export default { register, login, getMe, updateProfile };
