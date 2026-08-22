const Auth = {
  currentUser: null,

  init() {
    const session = JSON.parse(localStorage.getItem('sourcn_session') || 'null');
    if (session?.accessToken) {
      this.loadProfile();
    }
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });

    document.getElementById('register-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.register();
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      this.logout();
    });

    document.getElementById('btn-login')?.addEventListener('click', () => {
      this.openModal('login-modal');
    });

    document.getElementById('btn-register')?.addEventListener('click', () => {
      this.openModal('register-modal');
    });

    document.querySelectorAll('.auth-switch').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.dataset.target;
        this.closeAllModals();
        this.openModal(target);
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => this.closeAllModals());
    });
  },

  setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.origText = btn.textContent;
      btn.disabled = true;
      btn.classList.add('btn-loading');
      const textSpan = document.createElement('span');
      textSpan.className = 'btn-text';
      textSpan.textContent = btn.dataset.origText || 'Loading...';
      btn.textContent = '';
      btn.appendChild(textSpan);
    } else {
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.textContent = btn.dataset.origText || 'Submit';
    }
  },

  clearFieldError(input) {
    if (!input) return;
    input.classList.remove('input-error');
    const err = input.parentElement?.querySelector('.field-error');
    if (err) err.remove();
  },

  showFieldError(input, message) {
    if (!input) return;
    input.classList.add('input-error');
    let err = input.parentElement?.querySelector('.field-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      err.setAttribute('role', 'alert');
      input.parentElement?.appendChild(err);
    }
    err.textContent = message;
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  async login() {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput?.value;
    const password = passwordInput?.value;
    const btn = document.querySelector('#login-form button[type="submit"]');

    this.clearFieldError(emailInput);
    this.clearFieldError(passwordInput);

    if (!email || !password) {
      if (!email) this.showFieldError(emailInput, 'Email is required');
      if (!password) this.showFieldError(passwordInput, 'Password is required');
      return;
    }

    if (!this.validateEmail(email)) {
      this.showFieldError(emailInput, 'Enter a valid email address');
      return;
    }

    this.setButtonLoading(btn, true);
    try {
      const data = await Utils.api('POST', '/auth/login', { email, password });
      localStorage.setItem('sourcn_session', JSON.stringify(data.session));
      this.currentUser = data.user;
      this.updateUI();
      this.closeAllModals();
      Utils.showToast('Welcome back!', 'success');
      this.onAuthSuccess();
    } catch (err) {
      this.showFieldError(emailInput, err.message);
    } finally {
      this.setButtonLoading(btn, false);
    }
  },

  async register() {
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const cityInput = document.getElementById('register-city');
    const fullName = nameInput?.value;
    const email = emailInput?.value;
    const password = passwordInput?.value;
    const city = cityInput?.value || CONFIG.DEFAULT_CITY;
    const btn = document.querySelector('#register-form button[type="submit"]');

    this.clearFieldError(nameInput);
    this.clearFieldError(emailInput);
    this.clearFieldError(passwordInput);

    if (!fullName || !email || !password) {
      if (!fullName) this.showFieldError(nameInput, 'Name is required');
      if (!email) this.showFieldError(emailInput, 'Email is required');
      if (!password) this.showFieldError(passwordInput, 'Password is required');
      return;
    }

    if (!this.validateEmail(email)) {
      this.showFieldError(emailInput, 'Enter a valid email address');
      return;
    }

    if (password.length < 6) {
      this.showFieldError(passwordInput, 'Password must be at least 6 characters');
      return;
    }

    this.setButtonLoading(btn, true);
    try {
      await Utils.api('POST', '/auth/register', {
        fullName,
        email,
        password,
        city,
      });
      Utils.showToast('Account created! Please sign in.', 'success');
      this.closeAllModals();
      this.openModal('login-modal');
      document.getElementById('login-email').value = email;
    } catch (err) {
      this.showFieldError(emailInput, err.message);
    } finally {
      this.setButtonLoading(btn, false);
    }
  },

  async logout() {
    const btn = document.getElementById('btn-logout');
    this.setButtonLoading(btn, true);
    try {
      await Utils.api('POST', '/auth/logout');
    } catch (_) {}
    localStorage.removeItem('sourcn_session');
    this.currentUser = null;
    this.updateUI();
    Utils.showToast('Signed out', 'info');
    if (btn) this.setButtonLoading(btn, false);
    this.onLogout();
  },

  async loadProfile() {
    try {
      const data = await Utils.api('GET', '/auth/profile');
      this.currentUser = data;
      this.updateUI();
    } catch (_) {
      localStorage.removeItem('sourcn_session');
    }
  },

  updateUI() {
    const authBtns = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');

    if (this.currentUser) {
      if (authBtns) authBtns.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
      if (userName) userName.textContent = this.currentUser.fullName || this.currentUser.email;
    } else {
      if (authBtns) authBtns.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
    }
  },

  openModal(id) {
    document.getElementById(id)?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeAllModals() {
    document.querySelectorAll('.auth-modal').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  // Overridable hooks (no-ops by default). app/home.js attaches real
  // behavior for the city -> auth gateway -> role routing flow.
  onAuthSuccess() {},
  onLogout() {},
};

window.Auth = Auth;
