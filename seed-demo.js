const API = 'https://sovr1n.vercel.app/api';

async function api(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log('=== SOVR1N DEMO DATA SEED ===\n');

  // 1. Register demo account
  console.log('1. Registering demo account...');
  try {
    await api('POST', '/auth/register', {
      fullName: 'Demo User',
      email: 'demo@sovr1n.app',
      password: 'demo123456',
      city: 'Bakersfield',
    });
    console.log('   Account created');
  } catch (e) {
    if (e.message.includes('409')) console.log('   Account exists (ok)');
    else throw e;
  }

  // 2. Login
  console.log('2. Logging in...');
  const { session, user } = await api('POST', '/auth/login', {
    email: 'demo@sovr1n.app',
    password: 'demo123456',
  });
  const token = session.accessToken;
  console.log(`   Logged in as ${user.fullName} (${user.id})`);

  // 3. Set roles
  console.log('3. Setting roles...');
  await api('PUT', '/auth/profile', { addRole: 'customer' }, token);
  await api('PUT', '/auth/profile', { addRole: 'driver' }, token);
  await api('PUT', '/auth/profile', { addRole: 'service_provider' }, token);
  await api('PUT', '/auth/profile', { addRole: 'load_board' }, token);
  console.log('   Roles set: customer, driver, service_provider, load_board');

  // 4. Create market listings
  console.log('4. Creating market listings...');
  const listings = [
    { title: 'Moving help needed Saturday', description: 'Need help moving a couch and desk from downtown Bakersfield to Oildale. Should take about 2 hours. Water and snacks provided.', type: 'service', price: 75, tags: ['moving', 'furniture', 'urgent'], city: 'Bakersfield' },
    { title: 'Selling 55" Samsung TV', description: 'Works perfectly, upgrading to a bigger one.壁挂 mount included. Pick up only.', type: 'market', price: 180, tags: ['electronics', 'tv', 'samsung'], city: 'Bakersfield' },
    { title: 'House cleaning service', description: 'Professional house cleaning. Deep clean, regular maintenance, or move-in/move-out. Licensed and insured. Free estimates.', type: 'service', price: 120, tags: ['cleaning', 'home', 'professional'], city: 'Bakersfield' },
    { title: 'Vintage leather recliner', description: 'Beautiful brown leather recliner, minor wear. Very comfortable. Must pick up from garage in Lamont.', type: 'market', price: 95, tags: ['furniture', 'leather', 'vintage'], city: 'Lamont' },
    { title: 'Yard work & landscaping', description: 'Mowing, trimming, hedge cutting, debris removal. Same-day service available. Free quotes.', type: 'service', price: 60, tags: ['landscaping', 'yard', 'outdoor'], city: 'Arvin' },
  ];

  for (const l of listings) {
    const created = await api('POST', '/listings', l, token);
    console.log(`   + "${l.title}" (${l.type}, $${l.price})`);
  }

  // 5. Create loads
  console.log('5. Creating loads...');
  const loads = [
    { title: 'Piano move to Tehachapi', description: 'Upright piano, about 400 lbs. Need a truck with ramp. Ground floor to ground floor.', pickupAddress: '123 Main St, Bakersfield, CA', dropoffAddress: '456 Oak Ave, Tehachapi, CA', city: 'Bakersfield', cargoTier: 'heavy', offeredPrice: 250, weightKg: 180 },
    { title: 'Furniture delivery to Delano', description: 'IKEA bookshelf and desk, still in boxes. Fits in a pickup.', pickupAddress: 'IKEA, 8000 Peach Ave, Rosamond, CA', dropoffAddress: '789 Pine St, Delano, CA', city: 'Bakersfield', cargoTier: 'large', offeredPrice: 85, weightKg: 45 },
    { title: 'Appliance pickup', description: 'Refrigerator from Home Depot to my house. Need help loading.', pickupAddress: 'Home Depot, 3800 Rosedale Hwy, Bakersfield, CA', dropoffAddress: '321 Elm St, Shafter, CA', city: 'Bakersfield', cargoTier: 'large', offeredPrice: 60, weightKg: 90 },
    { title: 'Produce run to market', description: 'Weekly produce delivery from farm to farmers market. 5-6 crates of mixed vegetables.', pickupAddress: 'Baker Farm, 180000 Hwy 99, Bakersfield, CA', dropoffAddress: 'Kern County Fairgrounds, Bakersfield, CA', city: 'Bakersfield', cargoTier: 'medium', offeredPrice: 45, weightKg: 60 },
    { title: 'Multiple stops - office supplies', description: 'Pick up packages from 3 locations and deliver to office. All small boxes.', pickupAddress: 'FedEx, 2000 Wible Rd, Bakersfield, CA', dropoffAddress: '1200 Chester Ave, Bakersfield, CA', city: 'Bakersfield', cargoTier: 'small', offeredPrice: 35, weightKg: 12 },
  ];

  for (const l of loads) {
    const created = await api('POST', '/loads', l, token);
    console.log(`   + "${l.title}" (${l.cargoTier}, $${l.offeredPrice})`);
  }

  // 6. Create service provider
  console.log('6. Creating service provider profile...');
  try {
    await api('POST', '/providers', {
      businessName: 'Demo Hauling & Delivery',
      description: 'Reliable local hauling and delivery services. Same-day availability, competitive rates. Licensed, insured, and background-checked.',
      category: 'Delivery',
      city: 'Bakersfield',
    }, token);
    console.log('   + "Demo Hauling & Delivery" (Delivery)');
  } catch (e) {
    if (e.message.includes('409')) console.log('   Provider exists (ok)');
    else throw e;
  }

  console.log('\n=== SEED COMPLETE ===');
  console.log('\nDemo login: demo@sovr1n.app / demo123456');
  console.log('Visit: https://sovr1n.vercel.app');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
