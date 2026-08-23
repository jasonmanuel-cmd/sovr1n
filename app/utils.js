const Utils = {
  getHeaders() {
    const session = JSON.parse(localStorage.getItem('sourcn_session') || 'null');
    const headers = { 'Content-Type': 'application/json' };
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return headers;
  },

  async api(method, path, body = null) {
    const opts = {
      method,
      headers: this.getHeaders(),
    };
    if (body) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(`${CONFIG.API_BASE}${path}`, opts);
    } catch (_) {
      throw new Error('Unable to reach the server. Please try again.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed. Please try again.');
    return data;
  },

  timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  },

  formatPrice(price) {
    if (!price) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  truncate(text, maxLen = 100) {
    if (!text || text.length <= maxLen) return text || '';
    return text.substring(0, maxLen) + '...';
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: ${type === 'error' ? '#F85149' : type === 'success' ? '#58A6FF' : '#58A6FF'};
      color: #fff; padding: 12px 24px; border-radius: 8px; z-index: 10000;
      font-size: 14px; font-weight: 500; animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  renderStars(rating, count = 0) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = '<span class="stars">';
    for (let i = 0; i < full; i++) html += '<span class="star filled">★</span>';
    if (half) html += '<span class="star filled">★</span>';
    for (let i = 0; i < empty; i++) html += '<span class="star">★</span>';
    html += `</span>`;
    if (count > 0) html += `<span class="rating-count">(${count})</span>`;
    return html;
  },

  renderListingCard(listing) {
    const user = listing.users;
    const photo = listing.photos?.[0] || '';
    const priceHtml = listing.price
      ? `<div class="listing-price">${this.formatPrice(listing.price)}</div>`
      : '';

    return `
      <div class="listing-card" data-id="${listing.id}" tabindex="0" role="button" onclick="App.openDetailView('${listing.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openDetailView('${listing.id}')}" aria-label="View details for ${this.escapeHtml(listing.title)}">
        <div class="listing-photo">
          ${photo ? `<img src="${photo}" alt="${this.escapeHtml(listing.title)}" loading="lazy">` : `<div class="listing-photo-placeholder" aria-hidden="true">📦</div>`}
        </div>
        <div class="listing-info">
          <h4 class="listing-title">${this.escapeHtml(listing.title)}</h4>
          <p class="listing-desc">${this.escapeHtml(this.truncate(listing.description, 60))}</p>
          ${priceHtml}
          <div class="listing-meta">
            ${user ? `<span class="listing-seller">${this.escapeHtml(user.full_name)}</span>` : ''}
            <span class="listing-time">${this.timeAgo(listing.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  },
};

window.Utils = Utils;
