const Marketplace = {
  classes: {
    small: { name: 'Class A Economy', typical: 'Under 20 lbs, food and courier jobs' },
    medium: { name: 'Class B Pickup', typical: 'One- or two-person lift' },
    large: { name: 'Class C Hotshot', typical: 'Professional transport, cargo insurance, mobile equipment or mechanical lift' },
    heavy: { name: 'Class D Commercial', typical: 'Professional transport with cargo insurance' },
  },
  tier: null,
  page: 1,
  boardRequest: 0,
  profileRequest: 0,

  openTransportation() {
    document.querySelectorAll('[data-transport-city]').forEach(el => { el.textContent = App.currentCity; });
    const cards = document.getElementById('transport-classes');
    cards.replaceChildren(...Object.entries(this.classes).map(([tier, category]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'transport-class';
      button.innerHTML = '<strong></strong><span></span>';
      button.firstElementChild.textContent = category.name;
      button.lastElementChild.textContent = category.typical;
      button.addEventListener('click', () => this.openClass(tier));
      return button;
    }));
    App.openModule('transportation');
    cards.firstElementChild.focus();
  },

  openClass(tier) {
    this.tier = tier;
    this.page = 1;
    document.getElementById('transport-class-title').textContent = this.classes[tier].name;
    App.openModule('transportation-class');
    document.getElementById('transport-board-rows').closest('div').focus();
    this.loadBoard();
  },

  changePage(delta) {
    this.page += delta;
    this.loadBoard();
  },

  async loadBoard() {
    const request = ++this.boardRequest;
    const status = document.getElementById('transport-board-status');
    const rows = document.getElementById('transport-board-rows');
    const pagination = document.getElementById('transport-pagination');
    rows.replaceChildren();
    pagination.hidden = true;
    status.textContent = 'Loading listings…';
    const params = new URLSearchParams({
      city: App.currentCity, status: 'open', cargoTier: this.tier, page: this.page,
    });

    try {
      const data = await Utils.api('GET', '/loads?' + params);
      if (request !== this.boardRequest) return;
      status.textContent = data.loads.length ? '' : 'No open listings in this class.';
      rows.replaceChildren(...data.loads.map(load => this.loadRow(load)));
      document.getElementById('transport-prev').disabled = data.page <= 1;
      document.getElementById('transport-next').disabled = data.page * data.limit >= data.total;
      pagination.hidden = data.page <= 1 && data.limit >= data.total;
    } catch (error) {
      if (request === this.boardRequest) status.textContent = error.message;
    }
  },

  loadRow(load) {
    const row = document.createElement('tr');
    const zip = address => address?.match(/\b\d{5}(?:-\d{4})?\s*$/)?.[0].trim();
    const cells = [
      [load.title, load.description].filter(Boolean).join(' · '),
      zip(load.pickup_address), zip(load.dropoff_address), load.timeframe,
      Utils.formatPrice(load.offered_price), load.notes,
    ];
    cells.forEach(value => { row.insertCell().textContent = value || '—'; });
    row.insertCell().append(this.action('View details', () => App.openLoadDetail(load.id)));
    return row;
  },

  addLoad() {
    if (!Auth.isLoggedIn()) {
      Auth.openModal('login-modal');
      return;
    }
    App.openModule('post-load');
    const form = document.getElementById('post-load-form');
    form.reset();
    delete form.dataset.loadId;
    document.getElementById('post-load-submit').textContent = 'Post load';
    if (this.tier) form.elements.cargoTier.value = this.tier;
  },

  action(label, run) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-secondary btn-sm';
    button.textContent = label;
    button.addEventListener('click', run);
    return button;
  },

  async openProfile() {
    const userId = Auth.currentUser?.id;
    if (!userId) {
      Auth.openModal('login-modal');
      return;
    }
    const request = ++this.profileRequest;
    App.openModule('my-profile');
    const dashboard = document.getElementById('profile-dashboard');
    const status = document.getElementById('profile-status');
    dashboard.replaceChildren();
    status.textContent = 'Loading your profile…';

    try {
      const profile = await Utils.api('GET', '/auth/profile?view=dashboard');
      if (request !== this.profileRequest || Auth.currentUser?.id !== userId) return;
      status.textContent = '';
      this.renderProfile(profile, dashboard);
    } catch (error) {
      if (request === this.profileRequest) status.textContent = error.message;
    }
  },

  renderProfile(profile, dashboard) {
    const summary = document.createElement('div');
    summary.className = 'profile-summary';
    const avatar = document.createElement('img');
    avatar.alt = '';
    avatar.src = '/sovr1n-wordmark.png';
    if (/^https:\/\//i.test(profile.avatarUrl || '')) avatar.src = profile.avatarUrl;
    const details = document.createElement('dl');
    const createdAt = new Date(profile.createdAt || '');
    const fields = {
      'Business name': profile.business?.business_name,
      Name: profile.fullName,
      Rating: profile.business?.rating_count ? Number(profile.business.rating_avg).toFixed(1) + ' / 5' : 'No ratings yet',
      'Profile age': Number.isNaN(createdAt.getTime()) ? '—' : 'Member since ' + createdAt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      'City / area': profile.city,
    };
    Object.entries(fields).forEach(([label, value]) => {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value || '—';
      details.append(term, description);
    });
    summary.append(avatar, details);
    const heading = document.createElement('h2');
    heading.textContent = 'My listings';
    dashboard.append(summary, heading);
    const listings = profile.listings || [];
    for (const [type, title] of [['market', 'Market'], ['service', 'Services']]) {
      const add = this.action('Add listing', () => {
        App.openModule('create');
        document.querySelector('#create-listing-form [value="' + type + '"]').checked = true;
      });
      dashboard.append(this.profileGroup(title, listings.filter(item => item.type === type), add, item => this.editListing(item)));
    }
    dashboard.append(this.profileGroup('Rentals'));
    const addLoad = this.action('Add load', () => { this.tier = null; this.addLoad(); });
    dashboard.append(this.profileGroup('Transportation', profile.loads || [], addLoad, item => this.action('View details', () => App.openLoadDetail(item.id))));
    dashboard.append(this.profileGroup('Community calendar'));
  },

  profileGroup(title, items, action, renderAction) {
    const group = document.createElement('section');
    group.className = 'profile-group';
    const header = document.createElement('div');
    header.className = 'marketplace-screen-header';
    const heading = document.createElement('h3');
    heading.textContent = title;
    header.append(heading);
    if (action) header.append(action);
    group.append(header);
    if (!items?.length) {
      const notice = document.createElement('p');
      notice.textContent = items ? 'No listings yet.' : 'Not available yet.';
      group.append(notice);
      return group;
    }

    const list = document.createElement('ul');
    for (const item of items) {
      const row = document.createElement('li');
      const titleLine = document.createElement('strong');
      const price = item.price ?? item.offered_price;
      titleLine.textContent = [item.title, price == null ? null : Utils.formatPrice(price), item.status, item.is_active === false ? 'Inactive' : null].filter(Boolean).join(' · ');
      const description = document.createElement('p');
      description.textContent = item.description || '';
      row.append(titleLine, description, renderAction(item));
      list.append(row);
    }
    group.append(list);
    return group;
  },

  editListing(item) {
    const disclosure = document.createElement('details');
    disclosure.className = 'profile-edit';
    disclosure.innerHTML = '<summary>Edit listing</summary><form><label>Title<input class="input-base" name="title" required></label><label>Description<textarea class="input-base" name="description"></textarea></label><label>Price<input class="input-base" name="price" type="number" min="0" step="0.01"></label><button class="btn-primary btn-sm" type="submit">Save changes</button></form>';
    const form = disclosure.querySelector('form');
    form.elements.title.value = item.title;
    form.elements.description.value = item.description || '';
    form.elements.price.value = item.price ?? '';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button');
      button.disabled = true;
      const changes = Object.fromEntries(new FormData(form));
      changes.title = changes.title.trim();
      changes.price = changes.price === '' ? null : Number(changes.price);
      try {
        if (!changes.title) throw new Error('Enter a listing title.');
        await Listings.update(item.id, changes);
        Utils.showToast('Listing updated', 'success');
        if (App.activeModule === 'my-profile') this.openProfile();
      } catch (error) {
        Utils.showToast(error.message, 'error');
      } finally {
        button.disabled = false;
      }
    });
    return disclosure;
  },
};

App.openProfileOrLogin = () => Marketplace.openProfile();

const updateMarketplaceAuthUI = Auth.updateUI.bind(Auth);
Auth.updateUI = function () {
  updateMarketplaceAuthUI();
  const label = this.isLoggedIn() ? 'My profile' : 'Sign in';
  document.querySelectorAll('#header-auth-label, [data-account-action]').forEach(el => { el.textContent = label; });
  if (!this.isLoggedIn() && App.activeModule === 'my-profile') {
    Marketplace.profileRequest++;
    document.getElementById('profile-dashboard').replaceChildren();
    App.closeAllModules();
  }
};
