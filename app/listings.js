const Listings = {
  cache: {},

  async load(city, type = null) {
    const key = `${city}-${type || 'all'}`;
    if (this.cache[key] && Date.now() - this.cache[key].ts < 30000) {
      return this.cache[key].data;
    }

    let path = `/listings?city=${encodeURIComponent(city)}&limit=50`;
    if (type) path += `&type=${type}`;

    const data = await Utils.api('GET', path);
    this.cache[key] = { data: data.listings, ts: Date.now() };
    return data.listings;
  },

  async search(query, city, type = null) {
    let path = `/listings/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&limit=50`;
    if (type) path += `&type=${type}`;

    const data = await Utils.api('GET', path);
    return data.listings;
  },

  async create(listingData) {
    const data = await Utils.api('POST', '/listings', listingData);
    this.clearCache();
    return data.listing;
  },

  async update(id, updates) {
    const data = await Utils.api('PUT', `/listings/${id}`, updates);
    this.clearCache();
    return data.listing;
  },

  async remove(id) {
    await Utils.api('DELETE', `/listings/${id}`);
    this.clearCache();
  },

  clearCache() {
    this.cache = {};
  },

  renderList(listings, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!listings || listings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No listings found. Be the first to post!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = listings.map(l => Utils.renderListingCard(l)).join('');
  },
};

window.Listings = Listings;
