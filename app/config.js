const CONFIG = {
  SUPABASE_URL: 'https://dmovtwgxdoxyxrmbgvgg.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtb3Z0d2d4ZG94eXhybWJndmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDUyMjUsImV4cCI6MjEwMDUyMTIyNX0.skdP9uYe1gkTYCbS0_eofjhCC8lOUXG2JZXCT83uP9A',
  API_BASE: '/api',
  DEFAULT_CITY: 'Bakersfield',
  CITIES: [
    'Bakersfield', 'Oildale', 'Lamont', 'Arvin', 'Shafter',
    'Wasco', 'Delano', 'McFarland', 'Taft', 'Maricopa',
    'Tehachapi', 'Frazier Park', 'California City', 'Mojave', 'Ridgecrest'
  ],
  CARGO_TIERS: {
    small: { label: 'Small', desc: 'Fits in a sedan trunk', icon: '📦' },
    medium: { label: 'Medium', desc: 'Fits in an SUV/crossover', icon: '📫' },
    large: { label: 'Large', desc: 'Needs a pickup or van', icon: '🚐' },
    heavy: { label: 'Heavy/XL', desc: 'Needs a box truck or flatbed', icon: '🚛' },
  },
  CATEGORIES: [
    'Furniture', 'Electronics', 'Appliances', 'Vehicles', 'Produce',
    'Livestock', 'Tools', 'Building Materials', 'Household', 'Other'
  ],
};

window.CONFIG = CONFIG;
