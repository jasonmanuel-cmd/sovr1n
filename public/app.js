const App = {
  currentCity: CONFIG.DEFAULT_CITY,
  activeModule: null,
  _listingsCache: {},

  init() {
    this.loadCity();
    Auth.init();
    Search.init();
    this.loadListingsForCurrentCity();

    document.getElementById('city-select')?.addEventListener('change', (e) => {
      this.setCity(e.target.value);
    });

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
    const overlay = document.getElementById('detail-overlay');
    const panel = document.getElementById('detail-panel');
    if (!overlay || !panel) return;

    const photo = listing.photos?.[0] || '';
    const user = listing.users;
    const priceHtml = listing.price ? Utils.formatPrice(listing.price) : '';

    panel.innerHTML = `
      <button class="modal-close detail-close" onclick="App.closeDetailView()" aria-label="Close details">&times;</button>
      <div class="detail-hero">
        ${photo ? `<img src="${Utils.escapeHtml(photo)}" alt="${Utils.escapeHtml(listing.title)}" class="detail-photo">` : `<div class="detail-photo-placeholder" aria-hidden="true">${svgIcon('box', 36)}</div>`}
        <div style="display:flex;flex-direction:column;justify-content:center;gap:4px;min-width:0;">
          <span class="badge badge-amber" style="width:fit-content;">${listing.type === 'service' ? 'Service' : 'Item'}</span>
          <h3 class="detail-title" id="detail-title">${Utils.escapeHtml(listing.title)}</h3>
          ${priceHtml ? `<div class="detail-price">${Utils.escapeHtml(priceHtml)}</div>` : ''}
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0;">
        ${user ? `<span class="badge badge-dim">${svgIcon('user', 12)} ${Utils.escapeHtml(user.full_name || user.fullName || 'Unknown')}</span>` : ''}
        <span class="badge badge-dim">${svgIcon('clock', 12)} ${Utils.timeAgo(listing.created_at)}</span>
        ${listing.city ? `<span class="badge badge-dim">${svgIcon('mapPin', 12)} ${Utils.escapeHtml(listing.city)}</span>` : ''}
      </div>
      <div class="detail-section">
        <h4 class="detail-section-title">${svgIcon('file', 14)} Description</h4>
        <p class="detail-desc">${Utils.escapeHtml(listing.description || 'No description provided.')}</p>
      </div>
      ${listing.tags?.length ? `
      <div class="detail-section">
        <h4 class="detail-section-title">${svgIcon('tag', 14)} Tags</h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${listing.tags.map(t => `<span class="badge badge-dim">${Utils.escapeHtml(t)}</span>`).join('')}
        </div>
      </div>` : ''}
      <button class="btn-primary" style="width:100%;margin-top:16px;" onclick="App.closeDetailView()">${svgIcon('messaging', 16)} Contact Seller</button>
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
    const overlay = document.getElementById('detail-overlay');
    const panel = document.getElementById('detail-panel');
    if (overlay) overlay.classList.remove('active');
    if (panel) panel.classList.remove('active');
    document.body.classList.remove('scroll-lock');
  },

  closeDetail() {
    this.closeDetailView();
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
        trending.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + svgIcon('box', 28) + '</div><p>No trending items yet. Be the first to post!</p></div>';
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
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + svgIcon('truck', 28) + '</div><p>No delivery jobs available right now.</p></div>';
      return;
    }

    container.innerHTML = loads.map(load => `
      <div class="load-row" data-id="${load.id}" tabindex="0" role="button" onclick="App.openLoadDetail('${load.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openLoadDetail('${load.id}')}">
        <div class="load-icon">${svgIcon('truck', 20)}</div>
        <div class="load-info">
          <h4 class="load-title">${Utils.escapeHtml(load.title)}</h4>
          <div class="load-route">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(load.pickup_address || 'Pickup')}</span>
            <span style="color:var(--warm);">&rarr;</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(load.dropoff_address || 'Dropoff')}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <span class="badge badge-${load.cargo_tier}">${svgIcon(CONFIG.CARGO_TIERS[load.cargo_tier]?.icon || 'box', 12)} ${CONFIG.CARGO_TIERS[load.cargo_tier]?.label || load.cargo_tier}</span>
          <div class="load-price">${Utils.formatPrice(load.offered_price)}</div>
          <span class="load-time">${svgIcon('clock', 10)} ${Utils.timeAgo(load.created_at)}</span>
        </div>
      </div>
    `).join('');
  },

  renderProviders(providers, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (providers.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + svgIcon('users', 28) + '</div><p>No service providers registered yet.</p></div>';
      return;
    }

    container.innerHTML = providers.map(p => `
      <div class="card card-interactive" data-id="${p.id}" onclick="App.openProviderDetail('${p.id}')">
        <div style="display:flex;align-items:center;gap:14px;padding:16px;">
          <div style="width:48px;height:48px;border-radius:var(--rad-md);background:linear-gradient(135deg,rgba(232,164,56,0.15),rgba(45,175,163,0.1));border:1px solid rgba(232,164,56,0.25);display:grid;place-items:center;color:var(--warm);flex:none;">
            ${svgIcon('users', 22)}
          </div>
          <div style="flex:1;min-width:0;">
            <h4 class="listing-title" style="margin-bottom:2px;">${Utils.escapeHtml(p.business_name)}</h4>
            <p class="listing-desc" style="margin-bottom:4px;">${Utils.escapeHtml(Utils.truncate(p.description, 60))}</p>
            <div style="display:flex;align-items:center;gap:8px;">
              ${Utils.renderStars(p.rating_avg || 0, p.rating_count || 0)}
              ${p.category ? `<span class="badge badge-teal">${Utils.escapeHtml(p.category)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderLoadBoard(loads, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (loads.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + svgIcon('route', 28) + '</div><p>No loads posted yet. Post your first load!</p></div>';
      return;
    }

    container.innerHTML = loads.map(load => `
      <div class="load-row" data-id="${load.id}" tabindex="0" role="button" onclick="App.openLoadDetail('${load.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openLoadDetail('${load.id}')}">
        <div class="load-icon">${svgIcon('route', 20)}</div>
        <div class="load-info">
          <h4 class="load-title">${Utils.escapeHtml(load.title)}</h4>
          <div class="load-route">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(load.pickup_address || 'Pickup')}</span>
            <span style="color:var(--warm);">&rarr;</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(load.dropoff_address || 'Dropoff')}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <span class="badge badge-${load.cargo_tier}">${svgIcon(CONFIG.CARGO_TIERS[load.cargo_tier]?.icon || 'box', 12)} ${CONFIG.CARGO_TIERS[load.cargo_tier]?.label || load.cargo_tier}</span>
          <div class="load-price">${Utils.formatPrice(load.offered_price)}</div>
          <span class="load-time">${svgIcon('clock', 10)} ${Utils.timeAgo(load.created_at)}</span>
        </div>
      </div>
    `).join('');
  },

  async openLoadDetail(loadId) {
    try {
      const data = await Utils.api('GET', `/loads/${encodeURIComponent(loadId)}`);
      const load = data.load;
      this._listingsCache[load.id] = load;
      const panel = document.getElementById('detail-panel');
      const overlay = document.getElementById('detail-overlay');
      if (!panel || !overlay) return;
      const isOwner = Auth.currentUser?.id === load.poster_id;
      const poster = load.users?.full_name || 'Load poster';
      const tier = CONFIG.CARGO_TIERS[load.cargo_tier] || { label: load.cargo_tier, icon: 'box' };
      const status = load.status === 'cancelled' ? 'cancelled' : (load.status === 'in_transit' ? 'in transit' : 'open');
      const statusClass = load.status === 'cancelled' ? 'badge-dim' : 'badge-amber';

      panel.innerHTML = `
        <button class="modal-close detail-close" onclick="App.closeDetailView()" aria-label="Close details">&times;</button>
        <div class="detail-hero">
          <div class="detail-photo-placeholder" aria-hidden="true">${svgIcon('truck', 38)}</div>
          <div style="display:flex;flex-direction:column;justify-content:center;gap:4px;min-width:0;">
            <span class="badge ${statusClass}" style="width:fit-content;">${Utils.escapeHtml(status)}</span>
            <h3 class="detail-title" id="detail-title">${Utils.escapeHtml(load.title)}</h3>
            <div class="detail-price">${Utils.formatPrice(load.offered_price)}</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0;">
          <span class="badge badge-dim">${svgIcon('user', 12)} ${Utils.escapeHtml(poster)}</span>
          <span class="badge badge-dim">${svgIcon('clock', 12)} ${Utils.timeAgo(load.created_at)}</span>
          <span class="badge badge-dim">${svgIcon('mapPin', 12)} ${Utils.escapeHtml(load.city || 'Local')}</span>
        </div>
        <div style="border-radius:var(--rad-md);padding:14px;background:var(--surface-2);border:1px solid var(--border);margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:32px;height:32px;border-radius:var(--rad-sm);background:rgba(232,164,56,0.12);border:1px solid rgba(232,164,56,0.25);display:grid;place-items:center;color:var(--warm);">${svgIcon('mapPin', 16)}</div>
            <div><div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dim);">Pickup</div><div style="font-size:13px;font-weight:500;color:var(--cream);">${Utils.escapeHtml(load.pickup_address)}</div></div>
          </div>
          <div style="width:1px;height:12px;background:var(--border);margin-left:15px;margin-bottom:4px;"></div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:var(--rad-sm);background:rgba(45,175,163,0.12);border:1px solid rgba(45,175,163,0.25);display:grid;place-items:center;color:var(--teal);">${svgIcon('mapPin', 16)}</div>
            <div><div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dim);">Drop-off</div><div style="font-size:13px;font-weight:500;color:var(--cream);">${Utils.escapeHtml(load.dropoff_address)}</div></div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">${svgIcon('file', 14)} Load details</h4>
          <p class="detail-desc">${Utils.escapeHtml(load.description || 'No description provided.')}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <span class="badge badge-amber">${svgIcon(tier.icon, 13)} ${Utils.escapeHtml(tier.label)}</span>
            ${load.weight_kg ? `<span class="badge badge-dim">${svgIcon('weight', 12)} ${Utils.escapeHtml(String(load.weight_kg))} kg</span>` : ''}
            ${load.dimensions ? `<span class="badge badge-dim">${Utils.escapeHtml(load.dimensions)}</span>` : ''}
          </div>
        </div>
        ${isOwner && load.status === 'open' ? `<div style="display:flex;gap:8px;margin-top:16px;"><button class="btn-secondary" style="flex:1;" onclick="App.editLoad('${load.id}')">${svgIcon('file', 14)} Edit</button><button class="btn-secondary" style="flex:1;color:var(--error);border-color:rgba(248,113,113,0.3);" onclick="App.cancelLoad('${load.id}')">${svgIcon('x', 14)} Cancel</button></div>` : ''}
        ${!isOwner ? `<button class="btn-primary" style="width:100%;margin-top:16px;" onclick="App.closeDetailView()">${svgIcon('messaging', 16)} Contact driver</button>` : ''}
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

  // CONTRACT GENERATION (Phase 2)
  generateContract(loadData, driverData, agreedfPrice) {
    const contractId = `CONTRACT-${Date.now()}`;
    const contractDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const contract = {
      id: contractId,
      date: contractDate,
      partyA: {
        name: loadData.postedBy || 'Party A',
        role: 'Load Poster (Buyer)',
        email: loadData.email || 'Not provided'
      },
      partyB: {
        name: driverData.name || 'Party B',
        role: 'Driver',
        email: driverData.email || 'Not provided',
        vehicleClass: loadData.vehicleTypeNeeded || 'Not specified'
      },
      load: {
        title: loadData.title,
        description: loadData.description,
        priorDamage: loadData.priorDamage || 'None reported',
        pickupLocation: loadData.pickupAddress,
        dropoffLocation: loadData.dropoffAddress,
        timeframe: loadData.timeframe,
        dimensions: loadData.dimensions || 'Not specified',
        weight: loadData.weightKg || 'Not specified'
      },
      pricing: {
        agreedPrice: agreedfPrice,
        platformFee: (agreedfPrice * 0.10).toFixed(2),
        driverEarnings: (agreedfPrice * 0.90).toFixed(2),
        note: 'Driver receives 100% of delivery fee. Platform fee is 10% of transaction.'
      },
      terms: [
        '1. Driver will inspect load and take photographic documentation before pickup.',
        '2. Buyer confirms any prior damage in writing before load pickup.',
        '3. Driver agrees to deliver load by the agreed timeframe.',
        '4. Delivery is considered complete upon buyer confirmation of condition.',
        '5. Both parties agree to the terms outlined in this contract.',
        '6. Drivers remain responsible for all local laws, regulations, and vehicle weight limits.',
        '7. Delivery price is guaranteed and non-refundable upon completion.'
      ]
    };

    return this.formatContractAsDocument(contract);
  },

  formatContractAsDocument(contract) {
    const document = `
DELIVERY CONTRACT
Contract ID: ${contract.id}
Date: ${contract.date}

PARTIES:
Party A (Load Poster):  ${contract.partyA.name}
                        Role: ${contract.partyA.role}
                        Email: ${contract.partyA.email}

Party B (Driver):       ${contract.partyB.name}
                        Role: ${contract.partyB.role}
                        Email: ${contract.partyB.email}
                        Vehicle Class: ${contract.partyB.vehicleClass}

LOAD DETAILS:
Title:                  ${contract.load.title}
Description:            ${contract.load.description}
Prior Damage:           ${contract.load.priorDamage}
Pickup Location:        ${contract.load.pickupLocation}
Dropoff Location:       ${contract.load.dropoffLocation}
Required Delivery By:   ${contract.load.timeframe}
Dimensions:             ${contract.load.dimensions}
Weight:                 ${contract.load.weight} kg

PRICING & FEES:
Total Agreed Price:     $${contract.pricing.agreedPrice}
Platform Fee (10%):     $${contract.pricing.platformFee}
Driver Earnings:        $${contract.pricing.driverEarnings}

Note: ${contract.pricing.note}

TERMS & CONDITIONS:
${contract.terms.map((term, i) => `  ${term}`).join('\n')}

ACKNOWLEDGMENT:
By accepting this contract, both parties agree to the terms above.
This contract is legally binding.

---
Driver Name (Print):    _________________________
Driver Signature:       _________________________
Date:                   _________________________

Buyer Name (Print):     _________________________
Buyer Signature:        _________________________
Date:                   _________________________
    `;
    return document;
  },

  downloadContract(contractText) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contractText));
    element.setAttribute('download', `contract-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    Utils.showToast('Contract downloaded!', 'success');
  },

  // DRIVER VERIFICATION
  setupDriverVerification(userId) {
    const verificationModal = `
      <div style="padding:20px;">
        <h3 style="color:var(--cream);margin-bottom:12px;">Driver Verification Required</h3>
        <p style="color:var(--dim);margin-bottom:16px;">To become a driver, we need to verify your credentials.</p>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="padding:12px;background:var(--surface-2);border-radius:var(--rad-md);border-left:2px solid var(--warm);">
            <p style="font-weight:600;color:var(--cream);font-size:13px;margin-bottom:4px;">1. Driver's License</p>
            <p style="font-size:12px;color:var(--dim);">Provide a valid driver's license. We'll verify it's current and valid.</p>
            <input type="file" class="input-base" id="license-upload" accept="image/*" style="margin-top:8px;">
          </div>

          <div style="padding:12px;background:var(--surface-2);border-radius:var(--rad-md);border-left:2px solid var(--teal);">
            <p style="font-weight:600;color:var(--cream);font-size:13px;margin-bottom:4px;">2. Proof of Insurance</p>
            <p style="font-size:12px;color:var(--dim);">Upload proof that your vehicle is insured for commercial load carrying.</p>
            <input type="file" class="input-base" id="insurance-upload" accept="image/*" style="margin-top:8px;">
          </div>
        </div>

        <p style="font-size:11px;color:var(--dim);margin-top:16px;padding:10px;background:rgba(45,175,163,0.08);border-radius:var(--rad-md);">
          <strong style="color:var(--teal);">Note:</strong> You're responsible for knowing and following all local, state, and federal transportation regulations. Any violations are your legal responsibility.
        </p>
      </div>
    `;
    return verificationModal;
  },

  // GEOGRAPHIC FILTERING
  getKernCountyRadius() {
    const radiusMap = {
      'Bakersfield': { lat: 35.3733, lng: -119.0187, radius: 30 },
      'Shafter': { lat: 35.5036, lng: -119.2784, radius: 30 },
      'Lamont': { lat: 35.3675, lng: -119.0187, radius: 20 },
      'Oildale': { lat: 35.3931, lng: -119.1175, radius: 15 },
      'Arvin': { lat: 35.2044, lng: -119.1775, radius: 25 }
    };
    return radiusMap;
  },

  filterByRadius(listings, city, maxMiles = 30) {
    const radiusMap = this.getKernCountyRadius();
    const cityData = radiusMap[city];
    if (!cityData) return listings;

    return listings.filter(listing => {
      if (!listing.lat || !listing.lng) return true;
      const distance = this.calculateDistance(
        cityData.lat, cityData.lng,
        listing.lat, listing.lng
      );
      return distance <= (listing.maxRadius || maxMiles);
    });
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // SOCIAL SHARING
  shareVia(platform) {
    const url = window.location.href;
    const text = 'Check out sovr1n - Local marketplace for Kern County! Independent resources, local confidence.';

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent('Sovr1n - Local Marketplace')}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  },

  // PRICING CONFIGURATION
  getPricing() {
    return {
      profileFree: true,
      customerFree: true,
      shopOwnerMonthly: 2,
      shopOwnerAnnual: 20,
      driverMonthly: 2,
      driverAnnual: 20,
      platformFeePercent: 10,
      hotShotFeePercent: 2,
      classAFeePercent: 2
    };
  },

  // API INTEGRATION - CONTRACT GENERATION
  async generateContractAPI(contractData) {
    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: JSON.stringify(contractData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Contract generation failed');
      }

      const result = await response.json();
      Utils.showToast('Contract generated successfully!', 'success');
      return result;
    } catch (error) {
      console.error('Contract generation error:', error);
      Utils.showToast(error.message || 'Failed to generate contract', 'error');
      throw error;
    }
  },

  // API INTEGRATION - DRIVER VERIFICATION
  async submitDriverVerificationAPI(verificationData) {
    try {
      const response = await fetch('/api/driver/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: JSON.stringify(verificationData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification submission failed');
      }

      const result = await response.json();
      Utils.showToast('Driver verification submitted! Check your email for updates.', 'success');
      return result;
    } catch (error) {
      console.error('Driver verification error:', error);
      Utils.showToast(error.message || 'Failed to submit verification', 'error');
      throw error;
    }
  },

  // API INTEGRATION - UPDATE LOAD STATUS
  async updateLoadStatusAPI(loadId, newStatus, additionalData = {}) {
    try {
      const response = await fetch(`/api/loads/update-status?id=${loadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: JSON.stringify({
          loadId,
          status: newStatus,
          ...additionalData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Status update failed');
      }

      const result = await response.json();
      Utils.showToast(result.message, 'success');
      return result;
    } catch (error) {
      console.error('Load status update error:', error);
      Utils.showToast(error.message || 'Failed to update status', 'error');
      throw error;
    }
  },

  // FRONTEND - INITIATE CONTRACT FLOW
  async initiateContractFlow(loadData, driverData) {
    try {
      // Prepare contract data
      const contractData = {
        loadId: loadData.id,
        buyerId: loadData.poster_id,
        driverId: driverData.id,
        buyerName: loadData.poster_name || 'Buyer',
        buyerEmail: loadData.poster_email || '',
        buyerPhone: loadData.poster_phone || '',
        buyerCity: loadData.city,
        driverName: driverData.full_name || 'Driver',
        driverEmail: driverData.email || '',
        driverPhone: driverData.phone || '',
        licenseNumber: driverData.license_number || '',
        vehicleClass: loadData.vehicle_type_required || 'Not specified',
        loadTitle: loadData.title,
        loadDescription: loadData.description,
        priorDamage: loadData.prior_damage || 'None reported',
        pickupAddress: loadData.pickup_address,
        dropoffAddress: loadData.dropoff_address,
        timeframe: loadData.delivery_timeframe,
        cargoSize: loadData.cargo_tier,
        weightKg: loadData.weight_kg,
        dimensions: loadData.dimensions,
        agreedPrice: loadData.offered_price
      };

      // Generate contract via API
      const contractResult = await this.generateContractAPI(contractData);

      // Update load status to contracted
      await this.updateLoadStatusAPI(loadData.id, 'contracted', {
        contractId: contractResult.contractId,
        driverId: driverData.id
      });

      // Show contract and download option
      this.showContractModal(contractResult);

      return contractResult;
    } catch (error) {
      console.error('Contract flow error:', error);
    }
  },

  // FRONTEND - SHOW CONTRACT MODAL
  showContractModal(contractResult) {
    const modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.innerHTML = `
      <div class="modal-panel" style="max-width:600px;max-height:80vh;overflow-y:auto;">
        <button class="modal-close" onclick="this.closest('.modal-bg').remove()">&times;</button>
        <h2 class="font-display" style="font-size:18px;margin-bottom:12px;">Contract Generated</h2>
        <div style="background:var(--surface-1);padding:12px;border-radius:var(--rad-md);margin-bottom:16px;border-left:2px solid var(--warm);">
          <p style="font-size:12px;color:var(--dim);margin:0;">
            <strong>Contract ID:</strong> ${contractResult.contractId}
          </p>
          <p style="font-size:12px;color:var(--dim);margin:4px 0 0 0;">
            <strong>Total Price:</strong> $${contractResult.agreedPrice}
          </p>
          <p style="font-size:12px;color:var(--dim);margin:4px 0 0 0;">
            <strong>Platform Fee:</strong> $${contractResult.platformFee} (Driver keeps: $${contractResult.driverEarnings})
          </p>
        </div>
        <details style="margin-bottom:16px;">
          <summary style="cursor:pointer;color:var(--cream);font-weight:600;">View Full Contract</summary>
          <pre style="background:var(--surface-1);padding:12px;border-radius:var(--rad-md);font-size:11px;overflow-x:auto;max-height:300px;margin-top:8px;">
${contractResult.contractText}
          </pre>
        </details>
        <div style="display:flex;gap:8px;flex-direction:column;">
          <button class="btn-primary" onclick="App.downloadContractText('${contractResult.contractId}')" style="width:100%;">Download Contract</button>
          <button class="btn-secondary" onclick="this.closest('.modal-bg').remove()" style="width:100%;">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // DOWNLOAD CONTRACT AS TEXT FILE
  downloadContractText(contractId) {
    const modal = event.target.closest('.modal-bg');
    const contractText = modal.querySelector('pre')?.textContent || '';

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contractText));
    element.setAttribute('download', `${contractId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    Utils.showToast('Contract downloaded!', 'success');
  },

  // FRONTEND - DRIVER VERIFICATION FLOW
  async initiateDriverVerification() {
    if (!Auth.isLoggedIn()) {
      Auth.openModal('login-modal');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.innerHTML = `
      <div class="modal-panel" style="max-width:500px;">
        <button class="modal-close" onclick="this.closest('.modal-bg').remove()">&times;</button>
        <h2 class="font-display" style="font-size:18px;margin-bottom:12px;">Driver Verification</h2>
        <form id="driver-verify-form" style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <label class="field-label">Driver's License Number</label>
            <input type="text" name="licenseNumber" class="input-base" placeholder="e.g. A12345678" required>
          </div>
          <div>
            <label class="field-label">License State</label>
            <input type="text" name="licenseState" class="input-base" placeholder="CA" maxlength="2" pattern="[A-Z]{2}" required>
          </div>
          <div>
            <label class="field-label">Vehicle Class</label>
            <select name="vehicleClass" class="input-base" required>
              <option value="">Select vehicle class...</option>
              <option value="car-pickup">Car/Pickup (sedan, SUV, truck)</option>
              <option value="hotshot">Hot Shot (F250/350 + flatbed)</option>
              <option value="class-a">Class A (semi truck)</option>
            </select>
          </div>
          <div>
            <label class="field-label">Insurance Provider</label>
            <input type="text" name="insuranceProvider" class="input-base" placeholder="e.g. State Farm" required>
          </div>
          <div>
            <label class="field-label">Insurance Policy Number</label>
            <input type="text" name="insurancePolicy" class="input-base" placeholder="Policy #" required>
          </div>
          <div style="padding:12px;background:rgba(232,164,56,0.08);border-radius:var(--rad-md);border-left:2px solid var(--warm);">
            <p style="font-size:12px;color:var(--dim);margin:0;">
              <strong style="color:var(--warm);">Note:</strong> You'll be able to upload your license and insurance images after submitting this form. Verification typically takes 24-48 hours.
            </p>
          </div>
          <button type="submit" class="btn-primary" style="width:100%;">Submit Verification</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('driver-verify-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);

      try {
        await this.submitDriverVerificationAPI(data);
        modal.remove();
      } catch (error) {
        // Error already shown via toast
      }
    });
  }
};

window.currentCity = CONFIG.DEFAULT_CITY;

document.addEventListener('DOMContentLoaded', () => {
  App.init();

  const detailOverlay = document.getElementById('detail-overlay');
  if (detailOverlay) {
    detailOverlay.addEventListener('click', (e) => {
      if (e.target === detailOverlay) App.closeDetailView();
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
