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
    const select = document.getElementById('city-select');
    if (select) select.value = this.currentCity;
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
        case 'create': {
          this.initCreateForm();
          break;
        }
      }
    } catch (err) {
      console.error(`Failed to load ${moduleId}:`, err);
    }
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
