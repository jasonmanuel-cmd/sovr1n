const Search = {
  currentQuery: '',
  debounceTimer: null,

  init() {
    document.querySelectorAll('.search-input').forEach(input => {
      input.addEventListener('input', Utils.debounce((e) => {
        this.handleSearch(e.target.value, e.target.dataset.module);
      }, 400));
    });
  },

  async handleSearch(query, moduleType) {
    this.currentQuery = query.trim();
    const city = window.currentCity || CONFIG.DEFAULT_CITY;

    if (!this.currentQuery) {
      this.clearResults(moduleType);
      return;
    }

    try {
      const typeMap = {
        'services-buyer': 'service',
        'drivers': null,
        'load-board': null,
        'service-providers': 'service',
      };

      const listings = await Listings.search(this.currentQuery, city, typeMap[moduleType]);
      this.displayResults(listings, moduleType);
    } catch (err) {
      console.error('Search failed:', err);
    }
  },

  displayResults(listings, moduleType) {
    const container = document.getElementById(`search-results-${moduleType}`);
    if (!container) return;

    if (listings.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No results for "${Utils.escapeHtml(this.currentQuery)}"</p></div>`;
      return;
    }

    listings.forEach(l => { App._listingsCache[l.id] = l; });
    container.innerHTML = listings.map(l => Utils.renderListingCard(l)).join('');
  },

  clearResults(moduleType) {
    const container = document.getElementById(`search-results-${moduleType}`);
    if (container) container.innerHTML = '';
  },
};

window.Search = Search;
