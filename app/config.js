const CONFIG = {
  SUPABASE_URL: 'https://pebqmuumwygrpjofdwfy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ2MjI4OTQzLCJleHAiOjE5MDQwMDUxNDN9 placeholder', // REPLACE WITH REAL KEY
  API_BASE: '/api',
  DEFAULT_CITY: 'Bakersfield',
  CITIES: [
    'Bakersfield', 'Oildale', 'Lamont', 'Arvin', 'Shafter',
    'Wasco', 'Delano', 'McFarland', 'Taft', 'Maricopa',
    'Tehachapi', 'Frazier Park', 'California City', 'Mojave', 'Ridgecrest'
  ],
  CARGO_TIERS: {
    small: { label: 'Small', desc: 'Fits in a sedan trunk', icon: 'box' },
    medium: { label: 'Medium', desc: 'Fits in an SUV/crossover', icon: 'boxOpen' },
    large: { label: 'Large', desc: 'Needs a pickup or van', icon: 'truck' },
    heavy: { label: 'Heavy/XL', desc: 'Needs a box truck or flatbed', icon: 'container' },
  },
  CATEGORIES: [
    'Furniture', 'Electronics', 'Appliances', 'Vehicles', 'Produce',
    'Livestock', 'Tools', 'Building Materials', 'Household', 'Other'
  ],
};

window.CONFIG = CONFIG;
