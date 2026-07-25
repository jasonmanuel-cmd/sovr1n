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

  async login() {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
      Utils.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const data = await Utils.api('POST', '/auth/login', { email, password });
      localStorage.setItem('sourcn_session', JSON.stringify(data.session));
      this.currentUser = data.user;
      this.updateUI();
      this.closeAllModals();
      Utils.showToast('Welcome back!', 'success');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async register() {
    const fullName = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    const city = document.getElementById('register-city')?.value || CONFIG.DEFAULT_CITY;

    if (!fullName || !email || !password) {
      Utils.showToast('Please fill in all fields', 'error');
      return;
    }

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
      Utils.showToast(err.message, 'error');
    }
  },

  async logout() {
    try {
      await Utils.api('POST', '/auth/logout');
    } catch (_) {}
    localStorage.removeItem('sourcn_session');
    this.currentUser = null;
    this.updateUI();
    Utils.showToast('Signed out', 'info');
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
    document.getElementById(id)?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeAllModals() {
    document.querySelectorAll('.auth-modal').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  },

  isLoggedIn() {
    return !!this.currentUser;
  },
};

window.Auth = Auth;
