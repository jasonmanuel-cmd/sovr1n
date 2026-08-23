const App = {
  currentCity: CONFIG.DEFAULT_CITY,
  activeModule: null,
  _listingsCache: {},

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
    const validCities = (typeof window !== 'undefined' && window.CRAIGSLIST_CITIES)
      ? window.CRAIGSLIST_CITIES.map(c => c.name)
      : CONFIG.CITIES;
    if (saved && validCities.includes(saved)) {
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
    const select = document.getElementById('city-select');
    if (select) {
      // The saved city can be outside the small initial option set. Keep the
      // selector honest rather than presenting an empty field.
      if (![...select.options].some(option => option.value === this.currentCity)) {
        const option = new Option(this.currentCity, this.currentCity);
        select.add(option, 1);
      }
      select.value = this.currentCity;
    }
  },

  openProfileOrLogin() {
    if (Auth.isLoggedIn()) {
      App.openRoleModal?.();
      return;
    }
    Auth.openModal('login-modal');
  },

  bindCitySelector() {
    document.getElementById('open-city-modal')?.addEventListener('click', () => {
      document.getElementById('city-modal')?.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

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
    const cityPillBtn = document.getElementById('city-pill-btn');
    if (cityPillBtn) cityPillBtn.setAttribute('aria-expanded', 'false');
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
    const skeletonMap = {
      'services-buyer': 'listings-services',
      'drivers': 'listings-drivers',
      'service-providers': 'listings-providers',
      'load-board': 'listings-load-board',
    };
    if (skeletonMap[moduleId]) {
      Listings.renderSkeletons(4, skeletonMap[moduleId]);
    }
    try {
      switch (moduleId) {
        case 'services-buyer': {
          const listings = await Listings.load(city, 'service');
          listings.forEach(l => { this._listingsCache[l.id] = l; });
          Listings.renderList(listings, 'listings-services');
          break;
        }
        case 'drivers': {
          const data = await Utils.api('GET', `/loads?city=${encodeURIComponent(city)}&status=open&limit=20`);
          const loads = data.loads || [];
          loads.forEach(l => { this._listingsCache[l.id] = l; });
          this.renderDriverGigs(loads, 'listings-drivers');
          break;
        }
        case 'service-providers': {
          const data = await Utils.api('GET', `/providers?city=${encodeURIComponent(city)}&limit=20`);
          const providers = data.providers || [];
          providers.forEach(p => { this._listingsCache[p.id] = p; });
          this.renderProviders(providers, 'listings-providers');
          break;
        }
        case 'load-board': {
          const data = await Utils.api('GET', `/loads?city=${encodeURIComponent(city)}&status=open&limit=20`);
          const loads = data.loads || [];
          loads.forEach(l => { this._listingsCache[l.id] = l; });
          this.renderLoadBoard(loads, 'listings-load-board');
          break;
        }
        case 'create': {
          this.initCreateForm();
          break;
        }
        case 'post-load': {
          this.initLoadForm();
          break;
        }
      }
    } catch (err) {
      const containerId = skeletonMap[moduleId];
      if (containerId) Listings.renderError(err.message, containerId);
      console.error(`Failed to load ${moduleId}:`, err);
    }
  },

  showSkeletons(containerId, count = 6) {
    Listings.renderSkeletons(count, containerId);
  },

  openDetailView(listingId) {
    const listing = this._listingsCache[listingId];
    if (!listing) {
      Utils.showToast('Listing not found', 'error');
      return;
    }
    const overlay = document.getElementById('listing-detail-overlay');
    const panel = document.getElementById('listing-detail-panel');
    if (!overlay || !panel) return;

    const photo = listing.photos?.[0] || '';
    const user = listing.users;
    const priceHtml = listing.price
      ? Utils.formatPrice(listing.price)
      : '';

    panel.innerHTML = `
      <button class="modal-close detail-close" onclick="App.closeDetailView()" aria-label="Close details">&times;</button>
      <div class="detail-header">
        ${photo ? `<img src="${photo}" alt="${Utils.escapeHtml(listing.title)}" class="detail-photo">` : `<div class="detail-photo-placeholder" aria-hidden="true">📦</div>`}
        <div class="detail-header-info">
          <h3 class="detail-title" id="detail-title">${Utils.escapeHtml(listing.title)}</h3>
          ${priceHtml ? `<div class="detail-price">${priceHtml}</div>` : ''}
          <div class="detail-meta">
            ${user ? `<span class="detail-seller">${Utils.escapeHtml(user.full_name || user.fullName || '')}</span>` : ''}
            <span class="detail-time">${Utils.timeAgo(listing.created_at)}</span>
          </div>
        </div>
      </div>
      <div class="detail-section">
        <h4 class="detail-section-title">Description</h4>
        <p class="detail-desc">${Utils.escapeHtml(listing.description || 'No description provided.')}</p>
      </div>
      ${listing.tags?.length ? `
      <div class="detail-section">
        <h4 class="detail-section-title">Tags</h4>
        <div class="detail-tags">
          ${listing.tags.map(t => `<span class="detail-tag">${Utils.escapeHtml(t)}</span>`).join('')}
        </div>
      </div>` : ''}
      <button class="detail-msg-btn" onclick="App.closeDetailView()">Contact Seller</button>
    `;

    overlay.classList.add('active');
    panel.classList.add('active');
    document.body.classList.add('scroll-lock');

    requestAnimationFrame(() => {
      const closeBtn = panel.querySelector('.detail-close');
      if (closeBtn) closeBtn.focus();
    });
  },

  closeDetailView() {
    const overlay = document.getElementById('listing-detail-overlay');
    const panel = document.getElementById('listing-detail-panel');
    if (overlay) overlay.classList.remove('active');
    if (panel) panel.classList.remove('active');
    document.body.classList.remove('scroll-lock');
  },

  async loadListingsForCurrentCity() {
    const trending = document.getElementById('trending-grid');
    if (!trending) return;

    this.showSkeletons('trending-grid', 6);

    try {
      const market = await Listings.load(this.currentCity, 'market');
      if (market.length > 0) {
        const sliced = market.slice(0, 6);
        sliced.forEach(l => { this._listingsCache[l.id] = l; });
        trending.innerHTML = sliced.map(l => Utils.renderListingCard(l)).join('');
      } else {
        trending.innerHTML = '<div class="empty-state"><p>No trending items yet. Be the first to post!</p></div>';
      }
    } catch (err) {
      Listings.renderError(err.message, 'trending-grid');
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
      <div class="listing-card" data-id="${load.id}" tabindex="0" role="button" onclick="App.openLoadDetail('${load.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openLoadDetail('${load.id}')}">
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
      <div class="load-row" data-id="${load.id}" tabindex="0" role="button" onclick="App.openLoadDetail('${load.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openLoadDetail('${load.id}')}">
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
          <span class="load-status">${Utils.escapeHtml(load.status || 'open')}</span>
        </div>
        <div class="load-price">${Utils.formatPrice(load.offered_price)}</div>
        <div class="load-time">${Utils.timeAgo(load.created_at)}</div>
      </div>
    `).join('');
  },

  async openLoadDetail(loadId) {
    try {
      const data = await Utils.api('GET', `/loads/${encodeURIComponent(loadId)}`);
      const load = data.load;
      this._listingsCache[load.id] = load;
      const panel = document.getElementById('listing-detail-panel');
      const overlay = document.getElementById('listing-detail-overlay');
      if (!panel || !overlay) return;
      const isOwner = Auth.currentUser?.id === load.poster_id;
      const poster = load.users?.full_name || 'Load poster';
      panel.innerHTML = `
        <button class="modal-close detail-close" onclick="App.closeDetailView()" aria-label="Close details">&times;</button>
        <div class="detail-header"><div class="detail-photo-placeholder" aria-hidden="true">${CONFIG.CARGO_TIERS[load.cargo_tier]?.icon || '📦'}</div><div class="detail-header-info"><h3 class="detail-title">${Utils.escapeHtml(load.title)}</h3><div class="detail-price">${Utils.formatPrice(load.offered_price)}</div><div class="detail-meta"><span>${Utils.escapeHtml(poster)}</span><span>${Utils.timeAgo(load.created_at)}</span></div></div></div>
        <div class="detail-section"><h4 class="detail-section-title">Route</h4><p class="detail-desc"><strong>Pickup:</strong> ${Utils.escapeHtml(load.pickup_address)}<br><strong>Drop-off:</strong> ${Utils.escapeHtml(load.dropoff_address)}</p></div>
        <div class="detail-section"><h4 class="detail-section-title">Load details</h4><p class="detail-desc">${Utils.escapeHtml(load.description || 'No description provided.')}<br><strong>Cargo:</strong> ${Utils.escapeHtml(CONFIG.CARGO_TIERS[load.cargo_tier]?.label || load.cargo_tier)}${load.weight_kg ? ` · ${Utils.escapeHtml(String(load.weight_kg))} kg` : ''}${load.dimensions ? ` · ${Utils.escapeHtml(load.dimensions)}` : ''}<br><strong>Status:</strong> ${Utils.escapeHtml(load.status)}</p></div>
        ${isOwner && load.status === 'open' ? `<div class="flex gap-3"><button class="detail-msg-btn" onclick="App.editLoad('${load.id}')">Edit load</button><button class="detail-msg-btn" style="background:#da3633" onclick="App.cancelLoad('${load.id}')">Cancel load</button></div>` : ''}
      `;
      overlay.classList.add('active'); panel.classList.add('active'); document.body.classList.add('scroll-lock');
    } catch (err) { Utils.showToast(err.message, 'error'); }
  },

  async cancelLoad(loadId) {
    if (!window.confirm('Cancel this load? It will no longer appear as open.')) return;
    try {
      await Utils.api('DELETE', `/loads/${encodeURIComponent(loadId)}`);
      this.closeDetailView();
      Utils.showToast('Load cancelled', 'success');
      this.loadModuleData('load-board');
    } catch (err) { Utils.showToast(err.message, 'error'); }
  },

  editLoad(loadId) {
    const load = this._listingsCache[loadId];
    if (!load) return;
    this.closeDetailView();
    this.openModule('post-load');
    setTimeout(() => {
      const form = document.getElementById('post-load-form');
      if (!form) return;
      form.dataset.loadId = load.id;
      Object.entries({ title: load.title, description: load.description, pickupAddress: load.pickup_address, dropoffAddress: load.dropoff_address, cargoTier: load.cargo_tier, weightKg: load.weight_kg, dimensions: load.dimensions, offeredPrice: load.offered_price }).forEach(([name, value]) => {
        const field = form.elements[name]; if (field && value != null) field.value = value;
      });
      document.getElementById('post-load-submit').textContent = 'Save changes';
    }, 0);
  },

  initLoadForm() {
    const form = document.getElementById('post-load-form');
    if (!form) return;
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (!Auth.isLoggedIn()) { Utils.showToast('Please sign in to post a load', 'error'); return; }
      const submit = document.getElementById('post-load-submit');
      submit.disabled = true;
      const data = Object.fromEntries(new FormData(form));
      data.city = this.currentCity;
      try {
        const endpoint = form.dataset.loadId ? `/loads/${encodeURIComponent(form.dataset.loadId)}` : '/loads';
        await Utils.api(form.dataset.loadId ? 'PUT' : 'POST', endpoint, data);
        Utils.showToast(form.dataset.loadId ? 'Load updated' : 'Load posted', 'success');
        delete form.dataset.loadId; form.reset(); this.openModule('load-board');
      } catch (err) { Utils.showToast(err.message, 'error'); }
      finally { submit.disabled = false; }
    };
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

  const detailOverlay = document.getElementById('listing-detail-overlay');
  if (detailOverlay) {
    detailOverlay.addEventListener('click', (e) => {
      if (e.target === detailOverlay) App.closeDetailView();
    });
  }

  const cityPillBtn = document.getElementById('city-pill-btn');
  if (cityPillBtn) {
    cityPillBtn.addEventListener('click', () => {
      const expanded = cityPillBtn.getAttribute('aria-expanded') === 'true';
      cityPillBtn.setAttribute('aria-expanded', !expanded);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') App.closeDetailView();
  });
});

window.addEventListener('unhandledrejection', (e) => {
  console.warn('Unhandled promise rejection:', e.reason);
  Utils.showToast('Something went wrong. Please try again.', 'error');
});
