require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://xtabtnnnxdnwhbttyfdq.supabase.co',
  process.env.SUPABASE_SECRET_KEY || 'YOUR_SUPABASE_SECRET_KEY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setup() {
  console.log('Starting automated setup...');

  const usersToCreate = [
    { email: 'admin@subastasya.com', pass: '123456', first: 'SubastasYa', last: 'Tesorería', cat: 'platinum', balance: 1000000000 },
    { email: 'testcomun@test.com', pass: '123456', first: 'Usuario', last: 'Comun', cat: 'bronze', balance: 100000 },
    { email: 'testoro@test.com', pass: '123456', first: 'Usuario', last: 'Oro', cat: 'gold', balance: 500000 },
    { email: 'testplatino@test.com', pass: '123456', first: 'Usuario', last: 'Platino', cat: 'platinum', balance: 1500000 }
  ];

  const userIds = {};

  try {
    // 1. Get existing users and delete them
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
    if (fetchError) throw fetchError;

    for (const u of usersToCreate) {
      const existing = users.find(x => x.email === u.email);
      if (existing) {
        console.log(`Deleting existing user: ${u.email}`);
        // First delete their items to avoid FK constraint
        await supabase.from('items').delete().eq('owner_id', existing.id);
        const { error: delError } = await supabase.auth.admin.deleteUser(existing.id);
        if (delError) console.error(`Error deleting user ${u.email}:`, delError.message);
      }
    }

    // 2. Create users
    for (const u of usersToCreate) {
      console.log(`Creating user: ${u.email}`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.pass,
        email_confirm: true,
        user_metadata: { first_name: u.first, last_name: u.last }
      });
      if (error) throw error;
      
      userIds[u.email] = data.user.id;
      
      // Update profile
      console.log(`Updating profile for: ${u.email}`);
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: u.email,
        first_name: u.first,
        last_name: u.last,
        category: u.cat,
        is_approved: true,
        guarantee_balance: u.balance
      });
    }

    console.log('Users and profiles created successfully.');

    // 3. Create Auction
    console.log('Creating auction...');
    const now = new Date();
    now.setHours(now.getHours() - 1); // Start an hour ago
    
    const end = new Date();
    end.setHours(end.getHours() + 2); // Ends in 2 hours
    
    const { data: auctionData, error: auctionError } = await supabase.from('auctions').insert({
      title: 'Gran Subasta de Verano (Prueba Automática)',
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      minimum_category: 'bronze',
      status: 'active'
    }).select().single();
    
    if (auctionError) throw auctionError;
    const auctionId = auctionData.id;

    // 4. Create Items
    console.log('Creating items...');
    await supabase.from('items').insert([
      {
        auction_id: auctionId,
        owner_id: userIds['testoro@test.com'],
        title: 'Reloj Rolex Vintage',
        description: 'Reloj de colección en excelente estado.',
        starting_price: 10000,
        status: 'in_auction',
        images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49']
      },
      {
        auction_id: auctionId,
        owner_id: userIds['testplatino@test.com'],
        title: 'Ford Mustang 1969',
        description: 'Clásico americano restaurado a nuevo.',
        starting_price: 50000,
        status: 'in_auction',
        images: ['https://images.unsplash.com/photo-1584345611124-277def598e3b']
      },
      {
        auction_id: auctionId,
        owner_id: userIds['testcomun@test.com'],
        title: 'Cuadro Abstracto Moderno',
        description: 'Obra de artista contemporáneo.',
        starting_price: 5000,
        status: 'in_auction',
        images: ['https://images.unsplash.com/photo-1579783902614-a3f14002a9e5']
      }
    ]);

    // 5. Register users to auction
    console.log('Registering users to auction...');
    await supabase.from('auction_participants').insert([
      { user_id: userIds['testcomun@test.com'], auction_id: auctionId },
      { user_id: userIds['testoro@test.com'], auction_id: auctionId },
      { user_id: userIds['testplatino@test.com'], auction_id: auctionId }
    ]);

    console.log('✅ Setup completed successfully!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setup();
