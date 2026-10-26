// Version 3: Authentication and User Registration Handler
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get('tab');
  if (activeTab === 'register') {
    switchAuthTab('register');
  }

  // Redirect if already logged in
  const user = API.getUser();
  if (user && !urlParams.get('force')) {
    // Already logged in
    showToast(`Already logged in as ${user.name}`, 'info');
  }
});

function switchAuthTab(tabName) {
  const loginForm = document.getElementById('login-form-container');
  const registerForm = document.getElementById('register-form-container');
  const tabLoginBtn = document.getElementById('tab-btn-login');
  const tabRegisterBtn = document.getElementById('tab-btn-register');

  if (tabName === 'register') {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabLoginBtn.classList.remove('active');
    tabRegisterBtn.classList.add('active');
  } else {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorMsg = document.getElementById('login-error-msg');
  errorMsg.style.display = 'none';

  try {
    const res = await API.login(email, password);
    showToast(`Welcome back, ${res.user.name}!`, 'success');
    
    // Redirect based on role or URL param
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');

    setTimeout(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (res.user.role === 'admin') {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/profile.html';
      }
    }, 500);
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const errorMsg = document.getElementById('reg-error-msg');
  errorMsg.style.display = 'none';

  if (password.length < 6) {
    errorMsg.textContent = 'Password must be at least 6 characters.';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    const res = await API.register(name, email, password, role);
    showToast(`Account created! Welcome, ${res.user.name}`, 'success');

    setTimeout(() => {
      if (res.user.role === 'admin') {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/profile.html';
      }
    }, 500);
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
  }
}

// 1-Click Quick Demo Sign-In
async function quickLoginAs(role) {
  if (role === 'student') {
    document.getElementById('login-email').value = 'student@example.com';
    document.getElementById('login-password').value = 'password123';
  } else {
    document.getElementById('login-email').value = 'admin@example.com';
    document.getElementById('login-password').value = 'admin123';
  }

  document.getElementById('login-form').dispatchEvent(new Event('submit'));
}
