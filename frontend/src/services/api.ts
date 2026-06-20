// API Base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Global flag to track connection state
export let isOfflineSandbox = false;

// Request Helper
async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('eco-token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('eco-token');
      window.dispatchEvent(new Event('auth-expired'));
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'API Error' }));
      throw new Error(errData.detail || 'Request failed');
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      isOfflineSandbox = true;
      console.warn('FastAPI backend is offline. EcoTrack has initialized client-side Offline Sandbox Mode.');
      return handleSandboxFallback(path, options);
    }
    throw error;
  }
}

// --- CLIENT-SIDE SANDBOX FALLBACK LAYER ---
// Simulates database operations inside LocalStorage so the app is fully playable offline!

function getSandboxDB() {
  const db = localStorage.getItem('ecotrack_sandbox_db');
  if (db) return JSON.parse(db);

  const initialDB = {
    users: [
      {
        id: 'admin-123',
        name: 'Eco Admin',
        email: 'admin@ecotrack.com',
        role: 'admin',
        points: 450,
        badges: ['Green Beginner'],
        profile: {
          age: 32,
          country: 'Canada',
          city: 'Toronto',
          occupation: 'Sustainability Director',
          household_size: 2,
          transportation_preference: 'Electric Vehicle',
          sustainability_interests: ['Solar Energy', 'Recycling']
        },
        blocked: false
      },
      {
        id: 'user-456',
        name: 'Jane Doe',
        email: 'jane@gmail.com',
        role: 'user',
        points: 150,
        badges: ['Green Beginner'],
        profile: {
          age: 27,
          country: 'United States',
          city: 'Austin',
          occupation: 'UX Designer',
          household_size: 1,
          transportation_preference: 'Bicycle',
          sustainability_interests: ['Zero Waste', 'Plant-Based Diet']
        },
        blocked: false
      }
    ],
    carbon_records: [],
    goals: [],
    challenges: [
      {
        id: 'c-1',
        title: 'No Plastic Week',
        description: 'Avoid all single-use plastics like straws, water bottles, and bags for 7 days.',
        points: 100,
        duration_days: 7,
        category: 'lifestyle',
        active: true
      },
      {
        id: 'c-2',
        title: 'Walk Instead of Drive Challenge',
        description: 'Walk, cycle, or scooter for all trips under 3 kilometers this week.',
        points: 150,
        duration_days: 7,
        category: 'transportation',
        active: true
      },
      {
        id: 'c-3',
        title: 'Save Energy Challenge',
        description: 'Unplug standby vampire devices and lower your air-con heating levels for 7 days.',
        points: 120,
        duration_days: 7,
        category: 'energy',
        active: true
      },
      {
        id: 'c-4',
        title: 'Meatless Week',
        description: 'Eat a 100% vegetarian or vegan diet for one full week.',
        points: 200,
        duration_days: 7,
        category: 'food',
        active: true
      }
    ],
    participations: [],
    posts: [
      {
        id: 'post-1',
        user_id: 'user-456',
        user_name: 'Jane Doe',
        content: 'Just completed my first calculation on EcoTrack! My carbon footprint is 240kg CO2/month, but I\'m setting a goal to reduce my electricity usage by 15%. Join me!',
        likes: [],
        comments: [],
        created_at: new Date().toISOString()
      }
    ]
  };

  localStorage.setItem('ecotrack_sandbox_db', JSON.stringify(initialDB));
  return initialDB;
}

function saveSandboxDB(db: any) {
  localStorage.setItem('ecotrack_sandbox_db', JSON.stringify(db));
}

function handleSandboxFallback(path: string, options: RequestInit = {}) {
  const db = getSandboxDB();
  const token = localStorage.getItem('eco-token');
  const loggedUserId = token ? token.replace('mock-token-', '') : 'user-456';
  const currentUser = db.users.find((u: any) => u.id === loggedUserId) || db.users[1];

  const body = options.body ? JSON.parse(options.body as string) : {};

  // --- Auth Fallbacks ---
  if (path === '/api/auth/login') {
    const user = db.users.find((u: any) => u.email === body.email);
    if (!user) throw new Error('Incorrect email or password.');
    const mockToken = `mock-token-${user.id}`;
    localStorage.setItem('eco-token', mockToken);
    return { access_token: mockToken, token_type: 'bearer', user };
  }

  if (path === '/api/auth/register') {
    const existing = db.users.find((u: any) => u.email === body.email);
    if (existing) throw new Error('Email already exists');
    const newUser = {
      id: `user-${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role || 'user',
      points: 0,
      badges: [],
      profile: {
        age: 0,
        country: '',
        city: '',
        occupation: '',
        household_size: 1,
        transportation_preference: 'Public Transit',
        sustainability_interests: []
      },
      blocked: false
    };
    db.users.push(newUser);
    saveSandboxDB(db);
    const mockToken = `mock-token-${newUser.id}`;
    localStorage.setItem('eco-token', mockToken);
    return { access_token: mockToken, token_type: 'bearer', user: newUser };
  }

  if (path === '/api/auth/me') {
    return currentUser;
  }

  if (path === '/api/auth/profile') {
    const updated = { ...currentUser.profile };
    Object.keys(body).forEach((key) => {
      const dbKey = key.replace('profile.', '');
      updated[dbKey] = body[key];
    });
    currentUser.profile = updated;
    saveSandboxDB(db);
    return currentUser;
  }

  if (path === '/api/auth/change-password') {
    return { message: 'Password updated successfully.' };
  }

  if (path === '/api/auth/forgot-password') {
    return { message: 'Mock reset token generated.', reset_token: 'mock-reset-token' };
  }

  if (path === '/api/auth/reset-password') {
    return { message: 'Password reset successful.' };
  }

  // --- Carbon Footprint Fallbacks ---
  if (path === '/api/carbon/calculate') {
    // Basic frontend calculator simulator
    const trans = body.transportation || {};
    const energy = body.energy || {};
    const food = body.food || {};
    const lifestyle = body.lifestyle || {};

    const trans_co2 = (trans.car_km * 4.33 * 0.171) + (trans.public_transit_km * 4.33 * 0.04) + (trans.flights_per_year * 250 / 12);
    const energy_co2 = (energy.electricity_kwh * 0.385 * (1 - energy.renewable_pct / 100)) + (energy.gas_lpg * 2.30);
    const diet_base = food.diet_type?.toLowerCase() === 'vegan' ? 45.0 : food.diet_type?.toLowerCase() === 'vegetarian' ? 75.0 : 120.0;
    const food_co2 = diet_base + (food.meat_servings * 2.5 * 4.33) + (food.food_waste_level?.toLowerCase() === 'high' ? 25 : food.food_waste_level?.toLowerCase() === 'medium' ? 10 : 0);
    const lifestyle_co2 = (lifestyle.online_purchases * 2.5) + (lifestyle.clothing_purchases * 15.0) + (lifestyle.electronics_purchases * 120.0 / 12) + (lifestyle.waste_generation * 4.33 * 5.0);

    const total = trans_co2 + energy_co2 + food_co2 + lifestyle_co2;
    const score = Math.max(5, Math.min(100, Math.round(100 - (total / 12))));

    const newRecord = {
      id: `rec-${Date.now()}`,
      user_id: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      transportation: { ...trans, emission_co2: Math.round(trans_co2) },
      energy: { ...energy, emission_co2: Math.round(energy_co2) },
      food: { ...food, emission_co2: Math.round(food_co2) },
      lifestyle: { ...lifestyle, emission_co2: Math.round(lifestyle_co2) },
      total_emission: Math.round(total),
      sustainability_score: score,
      created_at: new Date().toISOString()
    };

    db.carbon_records.push(newRecord);
    
    // Allocate Gamification points
    let pointsGained = 50;
    const badges = [...currentUser.badges];
    if (db.carbon_records.filter((r: any) => r.user_id === currentUser.id).length === 1 && !badges.includes('Green Beginner')) {
      badges.push('Green Beginner');
      pointsGained += 100;
    }
    if (total < 250 && !badges.includes('Carbon Reducer')) {
      badges.push('Carbon Reducer');
      pointsGained += 200;
    }
    if (total < 120 && !badges.includes('Eco Warrior')) {
      badges.push('Eco Warrior');
      pointsGained += 300;
    }

    currentUser.points += pointsGained;
    currentUser.badges = badges;
    currentUser.sustainability_score = score;
    saveSandboxDB(db);

    return newRecord;
  }

  if (path === '/api/carbon/history') {
    return db.carbon_records.filter((r: any) => r.user_id === currentUser.id);
  }

  if (path === '/api/carbon/recommendations') {
    const records = db.carbon_records.filter((r: any) => r.user_id === currentUser.id);
    if (records.length === 0) return [];
    return [
      { category: 'Energy', title: 'Switch to LEDs', tip: 'LED bulbs consume 75% less energy than standard bulbs.', impact: 'Medium', potential_saving: '15 kg CO2/month' },
      { category: 'Transportation', title: 'Ride-sharing', tip: 'Carpooling or taking transit twice a week saves fossil fuels.', impact: 'High', potential_saving: '45 kg CO2/month' },
      { category: 'Food', title: 'Meat-free days', tip: 'Introduce Meatless Mondays to dramatically lower diet emissions.', impact: 'Medium', potential_saving: '20 kg CO2/month' }
    ];
  }

  if (path === '/api/carbon/dashboard-summary') {
    const records = db.carbon_records.filter((r: any) => r.user_id === currentUser.id);
    const latest = records[records.length - 1];
    return {
      monthly_emissions: latest ? latest.total_emission : 0.0,
      yearly_emissions: latest ? latest.total_emission * 12 : 0.0,
      sustainability_score: latest ? latest.sustainability_score : 0,
      points: currentUser.points,
      badges: currentUser.badges
    };
  }

  if (path === '/api/carbon/predict') {
    const car = body.car_km || 0;
    const elec = body.electricity || 0;
    const meat = body.meat_servings || 0;
    const shop = body.online_purchases || 0;

    const base = 100.0;
    const prediction = base + (car * 4.33 * 0.171) + (elec * 0.385) + (meat * 2.5 * 4.33) + (shop * 2.5);
    const reduced = base + ((car * 0.7) * 4.33 * 0.171) + ((elec * 0.8) * 0.385) + ((meat * 0.5) * 2.5 * 4.33) + ((shop * 0.8) * 2.5);

    return {
      predicted_emissions: Math.round(prediction),
      reduced_predicted_emissions: Math.round(reduced),
      potential_monthly_saving: Math.round(prediction - reduced)
    };
  }

  if (path === '/api/carbon/chatbot') {
    const msg = body.message.toLowerCase();
    if (msg.includes('hello') || msg.includes('hi')) return { reply: 'Hello! I am EcoBot, your sustainability advisor. How can I help you reduce your footprint today?' };
    if (msg.includes('car') || msg.includes('transport')) return { reply: 'Driving accounts for a significant portion of average footprint. Swapping a daily 5km car ride for cycling saves around 30kg of CO2 monthly.' };
    if (msg.includes('meat') || msg.includes('food')) return { reply: 'Switching to a plant-based diet or limiting beef/pork helps cut emissions, as livestock farming is resource-intensive.' };
    if (msg.includes('solar') || msg.includes('energy')) return { reply: 'Solar panels harness infinite energy. Installing home systems offsets grid carbon footprints by nearly 0.38kg per kWh.' };
    return { reply: 'That is a great sustainability question! Small consistent lifestyle changes accumulate to save large footprints. Try setting a public transport goal!' };
  }

  // --- Goals Fallbacks ---
  if (path === '/api/goals') {
    if (options.method === 'POST') {
      const newGoal = {
        id: `goal-${Date.now()}`,
        user_id: currentUser.id,
        category: body.category,
        title: body.title,
        target_value: body.target_value,
        progress: 0.0,
        status: 'active',
        deadline: body.deadline,
        created_at: new Date().toISOString()
      };
      db.goals.push(newGoal);
      saveSandboxDB(db);
      return newGoal;
    }
    return db.goals.filter((g: any) => g.user_id === currentUser.id);
  }

  if (path.startsWith('/api/goals/')) {
    const goalId = path.split('/').pop();
    if (options.method === 'PUT') {
      const goal = db.goals.find((g: any) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      goal.progress = body.progress;
      if (body.status) {
        if (body.status === 'completed' && goal.status !== 'completed') {
          currentUser.points += 150;
        }
        goal.status = body.status;
      }
      saveSandboxDB(db);
      return goal;
    }
    if (options.method === 'DELETE') {
      db.goals = db.goals.filter((g: any) => g.id !== goalId);
      saveSandboxDB(db);
      return { message: 'Goal deleted successfully.' };
    }
  }

  // --- Challenges Fallbacks ---
  if (path === '/api/goals/challenges') {
    return db.challenges;
  }

  if (path.endsWith('/join')) {
    const chalId = path.split('/')[3];
    const newPart = {
      id: `p-${Date.now()}`,
      user_id: currentUser.id,
      challenge_id: chalId,
      status: 'joined',
      joined_at: new Date().toISOString()
    };
    db.participations.push(newPart);
    saveSandboxDB(db);
    return { message: 'You successfully joined the challenge!', participation_id: newPart.id };
  }

  if (path.endsWith('/complete')) {
    const chalId = path.split('/')[3];
    const part = db.participations.find((p: any) => p.challenge_id === chalId && p.user_id === currentUser.id);
    if (part) part.status = 'completed';
    
    const challenge = db.challenges.find((c: any) => c.id === chalId);
    currentUser.points += challenge ? challenge.points : 100;
    
    // Check if badges earned
    const badges = [...currentUser.badges];
    const completedCount = db.participations.filter((p: any) => p.user_id === currentUser.id && p.status === 'completed').length;
    if (completedCount >= 3 && !badges.includes('Eco Warrior')) {
      badges.push('Eco Warrior');
      currentUser.points += 300;
    }
    currentUser.badges = badges;
    saveSandboxDB(db);
    return { message: 'Congratulations! Challenge completed successfully!', badges_earned: completedCount >= 3 ? ['Eco Warrior'] : [] };
  }

  if (path === '/api/goals/participations') {
    return db.participations.filter((p: any) => p.user_id === currentUser.id);
  }

  // --- Community Fallbacks ---
  if (path === '/api/community/posts') {
    if (options.method === 'POST') {
      const newPost = {
        id: `post-${Date.now()}`,
        user_id: currentUser.id,
        user_name: currentUser.name,
        content: body.content,
        likes: [],
        comments: [],
        created_at: new Date().toISOString()
      };
      db.posts.unshift(newPost);
      currentUser.points += 10;
      saveSandboxDB(db);
      return newPost;
    }
    return db.posts;
  }

  if (path.includes('/like')) {
    const pId = path.split('/')[3];
    const post = db.posts.find((p: any) => p.id === pId);
    if (post) {
      if (post.likes.includes(currentUser.id)) {
        post.likes = post.likes.filter((id: string) => id !== currentUser.id);
      } else {
        post.likes.push(currentUser.id);
      }
      saveSandboxDB(db);
    }
    return post;
  }

  if (path.includes('/comment')) {
    const pId = path.split('/')[3];
    const post = db.posts.find((p: any) => p.id === pId);
    if (post) {
      post.comments.push({
        user_id: currentUser.id,
        user_name: currentUser.name,
        content: body.content,
        created_at: new Date().toISOString()
      });
      saveSandboxDB(db);
    }
    return post;
  }

  if (path === '/api/community/leaderboard') {
    // Mock sorting
    return db.users
      .map((u: any, idx: number) => ({
        rank: idx + 1,
        user_id: u.id,
        name: u.name,
        points: u.points,
        sustainability_score: u.id === currentUser.id ? (currentUser.sustainability_score || 72) : (75 - idx * 3),
        badges_count: u.badges.length,
        is_self: u.id === currentUser.id
      }))
      .sort((a: any, b: any) => b.points - a.points)
      .map((item: any, idx: number) => ({ ...item, rank: idx + 1 }));
  }

  // --- Admin Fallbacks ---
  if (path === '/api/admin/users') {
    return db.users;
  }

  if (path.includes('/block')) {
    const targetId = path.split('/')[4];
    const user = db.users.find((u: any) => u.id === targetId);
    if (user) {
      user.blocked = body.blocked;
      saveSandboxDB(db);
    }
    return { message: `User status changed to ${body.blocked}` };
  }

  if (path.startsWith('/api/admin/users/') && options.method === 'DELETE') {
    const targetId = path.split('/').pop();
    db.users = db.users.filter((u: any) => u.id !== targetId);
    saveSandboxDB(db);
    return { message: 'User deleted.' };
  }

  if (path === '/api/admin/analytics') {
    return {
      total_users: db.users.length,
      active_users: db.users.filter((u: any) => !u.blocked).length,
      total_emissions_calculations: db.carbon_records.length + 2,
      estimated_carbon_saved_kg: db.goals.filter((g: any) => g.status === 'completed').length * 100,
      challenges: {
        total_participants: db.participations.length,
        total_completions: db.participations.filter((p: any) => p.status === 'completed').length,
        completion_rate_pct: Math.round((db.participations.filter((p: any) => p.status === 'completed').length / (db.participations.length || 1)) * 100)
      }
    };
  }

  if (path === '/api/admin/emission-factors') {
    return [
      { key: 'car_co2_per_km', value: 0.171, unit: 'kg CO2', category: 'transportation' },
      { key: 'electricity_co2_per_kwh', value: 0.385, unit: 'kg CO2', category: 'energy' },
      { key: 'meat_serving_co2', value: 2.5, unit: 'kg CO2', category: 'food' }
    ];
  }

  if (path === '/api/admin/challenges') {
    const newChal = {
      id: `c-${Date.now()}`,
      title: body.title,
      description: body.description,
      points: body.points,
      duration_days: body.duration_days,
      category: body.category,
      active: true
    };
    db.challenges.push(newChal);
    db.posts.unshift({
      id: `post-${Date.now()}`,
      user_id: 'admin-system',
      user_name: 'EcoTrack System',
      content: `📢 NEW WEEKLY CHALLENGE: '${body.title}'! Join now and earn ${body.points} Eco Points by completing it! Description: ${body.description}`,
      likes: [],
      comments: [],
      created_at: new Date().toISOString()
    });
    saveSandboxDB(db);
    return newChal;
  }

  throw new Error('Endpoint mock not found');
}

// --- API Methods Exports ---
export const api = {
  auth: {
    login: (data: any) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => request('/api/auth/me'),
    updateProfile: (data: any) => request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data: any) => request('/api/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
    forgotPassword: (data: any) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (data: any) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  },
  carbon: {
    calculate: (data: any) => request('/api/carbon/calculate', { method: 'POST', body: JSON.stringify(data) }),
    getHistory: () => request('/api/carbon/history'),
    getRecommendations: () => request('/api/carbon/recommendations'),
    getDashboardSummary: () => request('/api/carbon/dashboard-summary'),
    predict: (data: any) => request('/api/carbon/predict', { method: 'POST', body: JSON.stringify(data) }),
    chat: (message: string) => request('/api/carbon/chatbot', { method: 'POST', body: JSON.stringify({ message }) }),
    
    // File downloads (use real url triggers, or open window if sandbox)
    downloadPDF: () => {
      const token = localStorage.getItem('eco-token');
      if (isOfflineSandbox || !token || token.startsWith('mock-token-')) {
        alert('PDF reports require connection to the FastAPI server. Currently running in Sandbox Mode.');
        return;
      }
      window.open(`${BASE_URL}/api/carbon/report/pdf?token=${token}`, '_blank');
    },
    downloadExcel: () => {
      const token = localStorage.getItem('eco-token');
      if (isOfflineSandbox || !token || token.startsWith('mock-token-')) {
        alert('Excel data exports require connection to the FastAPI server. Currently running in Sandbox Mode.');
        return;
      }
      window.open(`${BASE_URL}/api/carbon/report/excel?token=${token}`, '_blank');
    }
  },
  goals: {
    list: () => request('/api/goals'),
    create: (data: any) => request('/api/goals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/goals/${id}`, { method: 'DELETE' }),
    listChallenges: () => request('/api/goals/challenges'),
    joinChallenge: (id: string) => request(`/api/goals/challenges/${id}/join`, { method: 'POST' }),
    completeChallenge: (id: string) => request(`/api/goals/challenges/${id}/complete`, { method: 'POST' }),
    getParticipations: () => request('/api/goals/participations')
  },
  community: {
    getPosts: () => request('/api/community/posts'),
    createPost: (content: string) => request('/api/community/posts', { method: 'POST', body: JSON.stringify({ content }) }),
    likePost: (id: string) => request(`/api/community/posts/${id}/like`, { method: 'POST' }),
    commentPost: (id: string, content: string) => request(`/api/community/posts/${id}/comment`, { method: 'POST', body: JSON.stringify({ content }) }),
    getLeaderboard: () => request('/api/community/leaderboard')
  },
  admin: {
    getUsers: () => request('/api/admin/users'),
    blockUser: (id: string, blocked: boolean) => request(`/api/admin/users/${id}/block`, { method: 'PUT', body: JSON.stringify({ blocked }) }),
    deleteUser: (id: string) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
    getAnalytics: () => request('/api/admin/analytics'),
    getFactors: () => request('/api/admin/emission-factors'),
    updateFactor: (data: any) => request('/api/admin/emission-factors', { method: 'PUT', body: JSON.stringify(data) }),
    createChallenge: (data: any) => request('/api/admin/challenges', { method: 'POST', body: JSON.stringify(data) }),
    updateChallenge: (id: string, data: any) => request(`/api/admin/challenges/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }
};
