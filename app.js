const App = {
  currentCity: CONFIG.DEFAULT_CITY,
  activeModule: null,

  init() {
    this.loadCity();
    this.bindCitySelector();
    this.bindModuleNav();
    Auth.init();
    Search.init();
    this.loadListingsForCurrentCity();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModules();
        Auth.closeAllModals();
      }
    });

    document.querySelectorAll('[data-close-module]').forEach(el => {
      el.addEventListener('click', () => this.closeAllModules());
    });
  },

  loadCity() {
    const saved = localStorage.getItem('sourcn_city');
    if (saved && CONFIG.CITIES.includes(saved)) {
      this.currentCity = saved;
    }
    this.updateCityDisplay();
  },

  setCity(city) {
    this.currentCity = city;
    localStorage.setItem('sourcn_city', city);
    this.updateCityDisplay();
    this.closeCityModal();
    Listings.clearCache();
    this.loadListingsForCurrentCity();
  },

  updateCityDisplay() {
    document.querySelectorAll('.city-name').forEach(el => {
      el.textContent = this.currentCity;
    });
    const display = document.getElementById('city-name-display');
    if (display) display.textContent = this.currentCity;
    const select = document.getElementById('city-select');
    if (select) select.value = this.currentCity;
  },

  openCityModal() {
    document.getElementById('city-modal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
    this._renderCityList('');
    setTimeout(() => document.getElementById('city-search')?.focus(), 100);
  },

  filterCities() {
    const q = (document.getElementById('city-search')?.value || '').toLowerCase();
    this._renderCityList(q);
  },

  _renderCityList(query) {
    const list = document.getElementById('city-list');
    if (!list) return;
    const cities = CONFIG.CITIES.filter(c => !query || c.toLowerCase().includes(query));
    list.innerHTML = cities.map(c => `
      <div onclick="App.setCity('${c}')" style="padding:13px 14px;border-radius:14px;cursor:pointer;font-size:14px;font-weight:${c===this.currentCity?'700':'500'};color:${c===this.currentCity?'#C87D3A':'#1A1917'};background:${c===this.currentCity?'rgba(200,125,58,0.06)':'transparent'};transition:background 0.15s;" onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='${c===this.currentCity?'rgba(200,125,58,0.06)':'transparent'}'">
        ${c}${c===this.currentCity?' ✓':''}
      </div>
    `).join('');
  },

  bindCitySelector() {
    document.getElementById('open-city-modal')?.addEventListener('click', () => this.openCityModal());

    document.getElementById('city-select')?.addEventListener('change', (e) => {
      this.setCity(e.target.value);
    });

    document.querySelectorAll('.city-option').forEach(el => {
      el.addEventListener('click', () => {
        this.setCity(el.dataset.city);
      });
    });

    document.querySelectorAll('[data-close-city]').forEach(el => {
      el.addEventListener('click', () => this.closeCityModal());
    });
  },

  closeCityModal() {
    document.getElementById('city-modal')?.classList.remove('active');
    document.body.style.overflow = '';
  },

  bindModuleNav() {
    document.querySelectorAll('[data-module]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const moduleId = el.dataset.module;
        this.openModule(moduleId);
      });
    });
  },

  openModule(moduleId) {
    this.closeAllModules();
    const mod = document.getElementById(`mod-${moduleId}`);
    if (mod) {
      mod.classList.add('active');
      this.activeModule = moduleId;
      document.body.style.overflow = 'hidden';
      this.loadModuleData(moduleId);
    }
  },

  closeAllModules() {
    document.querySelectorAll('.module-view').forEach(m => m.classList.remove('active'));
    this.activeModule = null;
    document.body.style.overflow = '';
  },

  async loadModuleData(moduleId) {
    const city = this.currentCity;
    try {
      switch (moduleId) {
        case 'services-buyer': {
          const listings = await Listings.load(city, 'service');
          Listings.renderList(listings, 'listings-services');
          break;
        }
        case 'drivers': {
          const loads = await Utils.api('GET', `/loads?city=${encodeURIComponent(city)}&status=open&limit=20`);
          this.renderDriverGigs(loads.loads || [], 'listings-drivers');
          break;
        }
        case 'service-providers': {
          const providers = await Utils.api('GET', `/providers?city=${encodeURIComponent(city)}&limit=20`);
          this.renderProviders(providers.providers || [], 'listings-providers');
          break;
        }
        case 'load-board': {
          const loads = await Utils.api('GET', `/loads?city=${encodeURIComponent(city)}&status=open&limit=20`);
          this.renderLoadBoard(loads.loads || [], 'listings-load-board');
          break;
        }
        case 'market-shoppers': {
          const listings = await Listings.load(city, 'market');
          Listings.renderList(listings, 'listings-market');
          break;
        }
        case 'market-shops': {
          if (Auth.isLoggedIn()) {
            const listings = await Listings.load(city, 'market');
            const mine = listings.filter(l => l.user_id === Auth.currentUser?.id);
            Listings.renderList(mine, 'listings-my-market');
          }
          break;
        }
        case 'rentals-seek': {
          const listings = await Utils.api('GET', `/listings?city=${encodeURIComponent(city)}&vertical=rentals&limit=20`).catch(() => ({ listings: [] }));
          Listings.renderList(listings.listings || [], 'listings-rentals');
          break;
        }
        case 'rentals-offer': {
          if (Auth.isLoggedIn()) {
            const listings = await Utils.api('GET', `/listings?city=${encodeURIComponent(city)}&vertical=rentals&limit=20`).catch(() => ({ listings: [] }));
            const mine = (listings.listings || []).filter(l => l.user_id === Auth.currentUser?.id);
            Listings.renderList(mine, 'listings-my-rentals');
          }
          break;
        }
        case 'dashboard': {
          this.loadDashboard();
          break;
        }
        case 'create': {
          this.initCreateForm();
          break;
        }
      }
    } catch (err) {
      console.error(`Failed to load ${moduleId}:`, err);
    }
  },

  // ===== DRAWER =====
  openDrawer() {
    document.getElementById('drawer-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('open');
    document.body.style.overflow = '';
  },

  // ===== DASHBOARD =====
  async loadDashboard() {
    if (!Auth.isLoggedIn()) {
      Auth.openModal('login-modal');
      this.closeAllModules();
      return;
    }
    const user = Auth.currentUser;

    // Profile card
    const name = user.fullName || user.email || 'You';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarEl = document.getElementById('dash-avatar');
    const nameEl = document.getElementById('dash-display-name');
    const ageEl = document.getElementById('dash-age');
    const ratingEl = document.getElementById('dash-rating');

    if (avatarEl) {
      if (user.avatarUrl) {
        avatarEl.innerHTML = `<img src="${Utils.escapeHtml(user.avatarUrl)}" alt="Avatar">`;
      } else {
        avatarEl.textContent = initials;
      }
    }
    if (nameEl) nameEl.textContent = name;
    if (ageEl) ageEl.textContent = this._profileAge(user.createdAt || user.created_at);
    if (ratingEl) ratingEl.innerHTML = Utils.renderStars(user.average_rating || 0, user.rating_count || 0);

    // Load provider listings
    try {
      const r = await Utils.api('GET', `/listings?user_id=${user.id}&limit=50`).catch(() => ({ listings: [] }));
      const all = r.listings || [];
      const shopItems = all.filter(l => l.vertical === 'market' || l.type === 'market');
      const svcItems = all.filter(l => l.vertical === 'services' || l.type === 'service');
      const rentalItems = all.filter(l => l.vertical === 'rentals');

      this._renderAccordionListings('acc-shop-listings', shopItems, 'shop-badge');
      this._renderAccordionListings('acc-services-listings', svcItems, 'services-badge');
      this._renderAccordionListings('acc-rentals-listings', rentalItems, 'rentals-badge');
    } catch (_) {}

    // Load orders (requesting by default)
    this.switchOrderTab('requesting');
  },

  _profileAge(createdAt) {
    if (!createdAt) return 'New member';
    const ms = Date.now() - new Date(createdAt).getTime();
    const days = Math.floor(ms / 86400000);
    if (days < 7) return `Member for ${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `Member for ${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 13) return `Member for ${months} mo`;
    const years = Math.floor(days / 365);
    return `Member for ${years} yr${years > 1 ? 's' : ''}`;
  },

  _renderAccordionListings(containerId, listings, badgeId) {
    const el = document.getElementById(containerId);
    const badge = document.getElementById(badgeId);
    if (!el) return;
    if (badge) {
      if (listings.length > 0) { badge.textContent = listings.length; badge.style.display = 'grid'; }
      else badge.style.display = 'none';
    }
    if (listings.length === 0) {
      el.innerHTML = '<p style="color:#9A9490;font-size:13px;">None yet.</p>';
      return;
    }
    el.innerHTML = listings.map(l => `
      <div class="order-row" style="padding:10px 12px;">
        <div class="font-semibold text-sm" style="color:#1A1917;">${Utils.escapeHtml(l.title)}</div>
        <div class="text-xs" style="color:#9A9490;margin-top:2px;">${l.price ? Utils.formatPrice(l.price) : 'No price set'} · ${Utils.timeAgo(l.created_at)}</div>
      </div>
    `).join('');
  },

  async switchOrderTab(status) {
    document.querySelectorAll('.order-tab').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim().toLowerCase().replace(' ', '_') === status
        || (status === 'in_progress' && btn.textContent.includes('Progress'))
        || (status === 'requesting' && btn.textContent.includes('Requesting'))
        || (status === 'completed' && btn.textContent.includes('Completed')));
    });

    const listEl = document.getElementById('orders-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="empty-state"><p>Loading…</p></div>';

    try {
      const r = await Utils.api('GET', `/orders?status=${status}`);
      const orders = r.orders || [];
      if (orders.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><p>No ' + status.replace('_', ' ') + ' orders.</p></div>';
        return;
      }
      listEl.innerHTML = orders.map(o => {
        const other = o.buyer?.id === Auth.currentUser?.id ? o.seller : o.buyer;
        const listingTitle = o.listing?.title || 'Order';
        return `
          <div class="order-row">
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <div class="font-semibold text-sm" style="color:#1A1917;">${Utils.escapeHtml(listingTitle)}</div>
              <span class="order-status-pill status-${o.status}">${o.status.replace('_', ' ')}</span>
            </div>
            <div class="text-xs" style="color:#6B6560;">
              ${other ? 'With ' + Utils.escapeHtml(other.full_name || 'User') + ' · ' : ''}${Utils.timeAgo(o.created_at)}
            </div>
          </div>
        `;
      }).join('');
    } catch (_) {
      listEl.innerHTML = '<div class="empty-state"><p>Could not load orders.</p></div>';
    }
  },

  // ===== ACCORDION =====
  toggleAccordion(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('open');
  },

  async loadListingsForCurrentCity() {
    const trending = document.getElementById('trending-grid');
    if (!trending) return;

    try {
      const market = await Listings.load(this.currentCity, 'market');
      if (market.length > 0) {
        trending.innerHTML = market.slice(0, 6).map(l => Utils.renderListingCard(l)).join('');
      } else {
        trending.innerHTML = '<div class="empty-state"><p>No trending items yet. Be the first to post!</p></div>';
      }
    } catch (err) {
      console.error('Failed to load trending:', err);
    }
  },

  renderDriverGigs(loads, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (loads.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No delivery jobs available right now.</p></div>';
      return;
    }

    container.innerHTML = loads.map(load => `
      <div class="listing-card" data-id="${load.id}">
        <div class="listing-info">
          <h4 class="listing-title">${Utils.escapeHtml(load.title)}</h4>
          <p class="listing-desc">${Utils.escapeHtml(load.description || '')}</p>
          <div class="listing-price">${Utils.formatPrice(load.offered_price)}</div>
          <div class="listing-meta">
            <span class="cargo-tier cargo-${load.cargo_tier}">${CONFIG.CARGO_TIERS[load.cargo_tier]?.icon || ''} ${CONFIG.CARGO_TIERS[load.cargo_tier]?.label || load.cargo_tier}</span>
            <span class="listing-time">${Utils.timeAgo(load.created_at)}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderProviders(providers, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (providers.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No service providers registered yet.</p></div>';
      return;
    }

    container.innerHTML = providers.map(p => `
      <div class="listing-card" data-id="${p.id}">
        <div class="listing-info">
          <h4 class="listing-title">${Utils.escapeHtml(p.business_name)}</h4>
          <p class="listing-desc">${Utils.escapeHtml(Utils.truncate(p.description, 80))}</p>
          <div class="listing-rating">
            ${Utils.renderStars(p.rating_avg || 0, p.rating_count || 0)}
          </div>
          <div class="listing-meta">
            <span class="listing-category">${Utils.escapeHtml(p.category || '')}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderLoadBoard(loads, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (loads.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No loads posted yet. Post your first load!</p></div>';
      return;
    }

    container.innerHTML = loads.map(load => `
      <div class="load-row" data-id="${load.id}">
        <div class="load-info">
          <h4 class="load-title">${Utils.escapeHtml(load.title)}</h4>
          <div class="load-route">
            <span>${Utils.escapeHtml(load.pickup_address || 'Pickup')}</span>
            <span class="load-arrow">→</span>
            <span>${Utils.escapeHtml(load.dropoff_address || 'Dropoff')}</span>
          </div>
        </div>
        <div class="load-details">
          <span class="cargo-tier cargo-${load.cargo_tier}">${CONFIG.CARGO_TIERS[load.cargo_tier]?.icon || ''} ${CONFIG.CARGO_TIERS[load.cargo_tier]?.label || load.cargo_tier}</span>
          <span class="load-weight">${load.weight_kg ? load.weight_kg + ' kg' : ''}</span>
        </div>
        <div class="load-price">${Utils.formatPrice(load.offered_price)}</div>
        <div class="load-time">${Utils.timeAgo(load.created_at)}</div>
      </div>
    `).join('');
  },

  initCreateForm() {
    const form = document.getElementById('create-listing-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        Utils.showToast('Please sign in to create a listing', 'error');
        return;
      }

      const formData = new FormData(form);
      const tags = (formData.get('tags') || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

      try {
        await Listings.create({
          title: formData.get('title'),
          description: formData.get('description'),
          type: formData.get('type') || 'market',
          tags,
          price: formData.get('price') ? parseFloat(formData.get('price')) : null,
          category: formData.get('category') || null,
          city: this.currentCity,
        });

        Utils.showToast('Listing created!', 'success');
        form.reset();
        this.closeAllModules();
        this.loadListingsForCurrentCity();
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    };
  },
};

window.currentCity = CONFIG.DEFAULT_CITY;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
