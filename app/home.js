(function () {
  const ROLE_MODULE_MAP = {
    customer: 'services-buyer',
    service_provider: 'service-providers',
    driver: 'drivers',
    load_board: 'load-board',
  };

  const ROLE_LABELS = {
    customer: 'Customer',
    service_provider: 'Service Provider',
    driver: 'Driver',
    load_board: 'Load Board',
  };

  App.pendingCityForRouting = null;
  App.currentRole = null;
  App._leafletMap = null;
  App._cityMarker = null;

  App.initHomeMap = function () {
    const el = document.getElementById('city-map');
    if (!el || typeof L === 'undefined' || App._leafletMap) return;

    App._leafletMap = L.map('city-map', {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([35.3733, -119.0187], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(App._leafletMap);

    const current = (window.CRAIGSLIST_CITIES || []).find(c => c.name === App.currentCity);
    if (current) App.flyToCity(current);
  };

  App.flyToCity = function (cityObj) {
    if (!App._leafletMap || !cityObj) return;
    App._leafletMap.flyTo([cityObj.lat, cityObj.lng], 11, { duration: 1.1 });
    if (App._cityMarker) App._leafletMap.removeLayer(App._cityMarker);
    App._cityMarker = L.marker([cityObj.lat, cityObj.lng]).addTo(App._leafletMap);
    App._cityMarker.bindPopup(`<strong>${Utils.escapeHtml(cityObj.name)}, ${Utils.escapeHtml(cityObj.state)}</strong>`).openPopup();
  };

  App.renderCityList = function (cities, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!cities || cities.length === 0) {
      el.innerHTML = '<p style="text-align:center;padding:20px;color:var(--dim);">No cities found</p>';
      return;
    }

    el.innerHTML = cities.map(c => {
      const isCurrent = c.name === App.currentCity;
      return `
        <button type="button" class="city-option" data-name="${Utils.escapeHtml(c.name)}"
          style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 14px;border-radius:var(--rad-md);border:1px solid ${isCurrent ? 'rgba(232,164,56,0.5)' : 'var(--border)'};background:${isCurrent ? 'rgba(232,164,56,0.08)' : 'var(--surface-1)'};color:var(--cream);font-size:13px;font-weight:500;cursor:pointer;transition:all var(--transition);margin-bottom:4px;">
          <span style="display:flex;align-items:center;gap:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isCurrent ? 'var(--warm)' : 'var(--dim)'}" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${Utils.escapeHtml(c.name)}
          </span>
          ${isCurrent ? '<span style="font-size:10px;font-weight:700;color:var(--warm);">Current</span>' : ''}
        </button>
      `;
    }).join('');

    el.querySelectorAll('.city-option').forEach(btn => {
      btn.addEventListener('click', () => {
        App.selectCity(btn.dataset.name);
      });
    });
  };

  App.filterCitiesIn = function (inputId, containerId) {
    const input = document.getElementById(inputId);
    const q = (input?.value || '').toLowerCase().trim();
    const list = window.CRAIGSLIST_CITIES || [];
    const filtered = q
      ? list.filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
      : list;
    App.renderCityList(filtered, containerId);
  };

  App.openHamburgerDrawer = function () {
    document.getElementById('hamburger-drawer')?.classList.add('open');
    document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'true');
    App.renderCityList(window.CRAIGSLIST_CITIES || [], 'drawer-city-list');
    App.updateDrawerAuthUI();
  };

  App.closeHamburgerDrawer = function () {
    document.getElementById('hamburger-drawer')?.classList.remove('open');
    document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'false');
  };

  App.updateDrawerAuthUI = function () {
    const authBtns = document.getElementById('drawer-auth-buttons');
    const userMenu = document.getElementById('drawer-user-menu');
    const userName = document.getElementById('drawer-user-name');

    if (Auth.isLoggedIn()) {
      if (authBtns) authBtns.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
      if (userName) userName.textContent = Auth.currentUser.fullName || Auth.currentUser.email || '';
    } else {
      if (authBtns) authBtns.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
    }
  };

  App.selectCity = function (name) {
    const cityObj = (window.CRAIGSLIST_CITIES || []).find(c => c.name === name);

    App.setCity(name);
    document.querySelectorAll('.module-city').forEach(el => { el.textContent = name; });
    const label = document.getElementById('current-city-label');
    if (label) label.textContent = name;

    if (cityObj) App.flyToCity(cityObj);

    App.closeHamburgerDrawer();
    App.renderCityList(window.CRAIGSLIST_CITIES || [], 'home-city-list');
    App.renderCityList(window.CRAIGSLIST_CITIES || [], 'drawer-city-list');

    if (!Auth.isLoggedIn()) {
      App.pendingCityForRouting = name;
      Utils.showToast(`Sign in to continue exploring ${name}`, 'info');
      Auth.openModal('login-modal');
      return;
    }

    App.pendingCityForRouting = name;
    App.openRoleModal();
  };

  App.openRoleModal = function () {
    const cityLabel = document.getElementById('role-modal-city');
    if (cityLabel) cityLabel.textContent = App.currentCity;
    document.getElementById('role-modal')?.classList.add('open');
  };

  App.closeRoleModal = function () {
    document.getElementById('role-modal')?.classList.remove('open');
  };

  App.selectRole = async function (role) {
    if (!ROLE_MODULE_MAP[role]) return;

    try {
      await Utils.api('PUT', '/auth/profile', { addRole: role });
    } catch (err) {
      console.warn('Failed to save role to profile:', err.message);
    }

    App.currentRole = role;
    App.pendingCityForRouting = null;
    App.closeRoleModal();
    Utils.showToast(`Welcome, ${ROLE_LABELS[role]}!`, 'success');
    App.openModule(ROLE_MODULE_MAP[role]);
  };

  Auth.onAuthSuccess = function () {
    App.updateDrawerAuthUI();
    if (App.pendingCityForRouting) {
      App.openRoleModal();
    }
  };

  Auth.onLogout = function () {
    App.pendingCityForRouting = null;
    App.currentRole = null;
    App.updateDrawerAuthUI();
    App.closeRoleModal();
  };

  document.addEventListener('DOMContentLoaded', () => {
    App.initHomeMap();
    App.renderCityList(window.CRAIGSLIST_CITIES || [], 'home-city-list');
    App.updateDrawerAuthUI();

    const label = document.getElementById('current-city-label');
    if (label) label.textContent = App.currentCity;

    document.getElementById('hamburger-btn')?.addEventListener('click', () => {
      App.openHamburgerDrawer();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      App.closeHamburgerDrawer();
      App.closeRoleModal();
    }
  });
})();
