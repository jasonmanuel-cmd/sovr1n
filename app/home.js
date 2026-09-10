// ============================================================
// HOME.JS — Hamburger drawer, interactive city map, and the
// conditional routing flow: pick a city -> auth gateway ->
// role selection -> land in the matching module.
//
// This file augments the App/Auth objects defined in app.js and
// app/auth.js (loaded before this file), following the same
// "extend after load" pattern already used elsewhere in this app.
// ============================================================
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

  // ---------------- Map ----------------
  App.initHomeMap = function () {
    const el = document.getElementById('city-map');
    if (!el || typeof L === 'undefined' || App._leafletMap) return;

    App._leafletMap = L.map('city-map', {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([35.3733, -119.0187], 9); // Bakersfield-area center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(App._leafletMap);

    const current = (window.CRAIGSLIST_CITIES || []).find(c => c.name === App.currentCity);
    if (current) App.flyToCity(current);
  };

  App.flyToCity = function (cityObj) {
    if (!App._leafletMap || !cityObj) return;
    App._leafletMap.flyTo([cityObj.lat, cityObj.lng], 11, { duration: 1.1 });
    if (App._cityMarker) App._leafletMap.removeLayer(App._cityMarker);
    App._cityMarker = L.marker([cityObj.lat, cityObj.lng]).addTo(App._leafletMap);
    App._cityMarker.bindPopup(`<strong>${cityObj.name}, ${cityObj.state}</strong>`).openPopup();
  };

  // ---------------- City list rendering (shared: drawer + homepage) ----------------
  App.renderCityList = function (cities, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!cities || cities.length === 0) {
      el.innerHTML = '<p class="text-sm text-center py-6" style="color:var(--dust);">No cities found</p>';
      return;
    }

    el.innerHTML = cities.map(c => {
      const isCurrent = c.name === App.currentCity;
      const safeName = c.name.replace(/'/g, "\\'");
      return `
        <button type="button" class="w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all mb-1.5"
          style="background:${isCurrent ? 'rgba(124,92,255,0.16)' : 'var(--warm-white)'}; border:1px solid ${isCurrent ? 'rgba(124,92,255,0.55)' : 'var(--border)'}; box-shadow:${isCurrent ? '0 0 24px rgba(124,92,255,0.18)' : 'none'};"
          onclick="App.selectCity('${safeName}')">
          <span>
            <span class="font-display font-semibold text-sm" style="color:var(--mesquite);">${Utils.escapeHtml(c.name)}</span>
            <span class="text-xs ml-2" style="color:var(--dust);">${Utils.escapeHtml(c.state)}</span>
          </span>
          ${isCurrent ? '<span class="text-xs font-bold" style="color:var(--clay);">Current</span>' : ''}
        </button>
      `;
    }).join('');
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

  // ---------------- Hamburger drawer ----------------
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

  // ---------------- City selection -> auth gateway -> role routing ----------------
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

  // ---------------- Role selection ----------------
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

  // ---------------- Auth hooks (fired by app/auth.js) ----------------
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

  // ---------------- Init ----------------
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
