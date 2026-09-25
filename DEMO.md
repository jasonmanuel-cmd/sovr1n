# SOVR1N — Demo Walkthrough

**Live URL:** https://sovr1n.vercel.app  
**Demo login:** `demo@sovr1n.app` / `demo123456`

---

## What to Show (2-3 minutes)

### 1. First Impression — Homepage (10 seconds)
- Open the URL. Show the aurora dark theme, gradient brand mark, hero tagline.
- Point out the city selector (Bakersfield pre-selected) and the Leaflet map centered on Bakersfield.
- Scroll down to see role cards (Marketplace, Services, Transportation).

### 2. Browse Listings (20 seconds)
- Click the **Marketplace** card → shows 3 listings (Samsung TV, leather recliner, moving help).
- Point out: listing type chips (Item/Service), price badges, seller avatars, gradient styling.
- Click any listing → detail panel slides in with rich layout: hero area, price, seller info, action buttons.

### 3. Load Board (20 seconds)
- Click **Post a load or job** → loads board with 5 demo loads.
- Show: cargo tier badges (small/medium/large/heavy with icons), route dots (pickup → dropoff), price, time posted.
- Click a load → detail panel with route card, cargo info, "Contact poster" and "Apply to haul" buttons.

### 4. Service Providers (15 seconds)
- Click **Services** → shows "Demo Hauling & Delivery" provider card.
- Point out: category badge, city, rating display.
- Click → provider detail with description, contact options.

### 5. Navigation & Search (15 seconds)
- Show the **hamburger menu** (top right) — opens city drawer with all Kern County cities.
- Show the **search bar** — type "tv" or "piano" and hit enter → filtered results.
- Show the **share modal** (footer "Share sovr1n" link).

### 6. Auth Flow (20 seconds)
- Click **Sign in** → modal with email/password fields.
- Click **Create account** → register form with full name, email, password, city.
- Register with any email → auto-redirects to profile.
- Show profile page with roles, city info.

### 7. Create Listing (15 seconds, logged in)
- Click **Create listing** → form with title, description, type (market/service), price, tags.
- Fill in and submit → listing appears in the marketplace.
- Show owner-only edit/delete controls on your own listing.

### 8. Driver Dashboard (10 seconds)
- Click **Drivers** → driver dashboard with available loads to bid on.

---

## Key Points to Emphasize

| Feature | Status | Notes |
|---------|--------|-------|
| Aurora dark UI | ✅ | Custom CSS, gradient accents, glass morphism |
| City-based filtering | ✅ | 14 Kern County cities, Leaflet map |
| Marketplace listings | ✅ | Create, browse, detail view, owner controls |
| Load board | ✅ | Post loads, cargo tiers, route visualization |
| Service providers | ✅ | Provider profiles, categories, ratings |
| Search | ✅ | Tag-based search across listings |
| Auth | ✅ | Register, login, profile, role-based access |
| Share modal | ✅ | Copy link, social sharing |
| Mobile responsive | ✅ | Works on phone/tablet |
| API layer | ✅ | 8 endpoints, rate limiting, security headers |
| Database | ✅ | 12 tables, RLS policies, triggers |

---

## Not Yet Built (Phase 2+)
- Real-time chat (tables exist, UI stubbed)
- Load bidding / driver matching
- Reviews & ratings
- Photo uploads
- Payment integration (Stripe tables ready)

---

## Technical Highlights
- **Stack:** Vanilla JS + Tailwind + Supabase + Leaflet
- **Hosting:** Vercel (serverless functions)
- **Database:** Supabase PostgreSQL with RLS
- **Security:** Rate limiting, CSP headers, input sanitization
- **Design:** Aurora dark theme, Space Grotesk + Inter fonts, custom SVG icon system
