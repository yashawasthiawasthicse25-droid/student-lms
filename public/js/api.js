// API and Client State Utilities
const API_BASE = '';

const API = {
  // Auth Token & User Storage
  getToken() {
    return localStorage.getItem('lms_token');
  },
  setToken(token) {
    if (token) localStorage.setItem('lms_token', token);
    else localStorage.removeItem('lms_token');
  },
  getUser() {
    try {
      const u = localStorage.getItem('lms_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) localStorage.setItem('lms_user', JSON.stringify(user));
    else localStorage.removeItem('lms_user');
  },

  // Base Request with Bearer Token
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed.');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  async register(name, email, password, role = 'student') {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async me() {
    const data = await this.request('/api/auth/me');
    if (data.user) {
      this.setUser(data.user);
    } else {
      this.setUser(null);
      this.setToken(null);
    }
    return data.user;
  },

  logout() {
    this.setToken(null);
    this.setUser(null);
    window.location.href = '/login.html';
  },

  // Courses
  async getCourses(search = '', subject = '', level = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (subject && subject !== 'all') params.append('subject', subject);
    if (level && level !== 'all') params.append('level', level);
    return this.request(`/api/courses?${params.toString()}`);
  },

  async getCourseDetail(idOrSlug) {
    return this.request(`/api/courses/${idOrSlug}`);
  },

  async enrollCourse(courseId) {
    return this.request(`/api/courses/${courseId}/enroll`, {
      method: 'POST'
    });
  },

  async toggleLesson(courseId, lessonId) {
    return this.request(`/api/courses/${courseId}/lessons/${lessonId}/toggle`, {
      method: 'POST'
    });
  },

  async submitQuiz(courseId, answers) {
    return this.request(`/api/courses/${courseId}/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },

  // Student Dashboard
  async getStudentDashboard() {
    return this.request('/api/student/dashboard');
  },

  async updateStudentProfile(profileData) {
    return this.request('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Admin / Teacher
  async getAdminOverview() {
    return this.request('/api/admin/overview');
  },

  async getAdminStudents() {
    return this.request('/api/admin/students');
  },

  async createCourse(courseData) {
    return this.request('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  },

  async getAdminMessages() {
    return this.request('/api/admin/messages');
  },

  // Contact
  async getContactConfig() {
    return this.request('/api/contact/config');
  },

  async submitContact(contactData) {
    return this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  }
};

// UI Notification Toast
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global UI Initialization (Nav Auth state & mobile drawer)
document.addEventListener('DOMContentLoaded', () => {
  renderNavbarAuthState();

  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }
});

function renderNavbarAuthState() {
  const user = API.getUser();
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  if (user) {
    navActions.innerHTML = `
      <a href="/profile.html" class="user-menu-pill" title="View Profile">
        <div class="avatar-circle">${user.avatar_url || 'ST'}</div>
        <span>${user.name.split(' ')[0]}</span>
      </a>
      ${user.role === 'admin' ? '<a href="/admin.html" class="btn btn-outline btn-sm">Teacher Portal</a>' : ''}
      <button onclick="API.logout()" class="btn btn-outline btn-sm" title="Log Out">Log Out</button>
    `;
  } else {
    navActions.innerHTML = `
      <a href="/login.html" class="btn btn-outline btn-sm">Log In</a>
      <a href="/login.html?tab=register" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }
}
