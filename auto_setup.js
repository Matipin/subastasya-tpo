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

    // 3. Create Auctions (2 Active now + 3 Upcoming)
    console.log('Creating auctions...');
    const now1 = new Date(Date.now() - 30 * 60 * 1000);
    const end1 = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const now2 = new Date(Date.now() - 15 * 60 * 1000);
    const end2 = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const start3 = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end3 = new Date(Date.now() + 27 * 60 * 60 * 1000);

    const { data: a1 } = await supabase.from('auctions').insert({
      title: 'Subasta Exclusiva de Lujo en Vivo',
      start_date: now1.toISOString(),
      end_date: end1.toISOString(),
      minimum_category: 'bronze',
      status: 'active'
    }).select().single();

    const { data: a2 } = await supabase.from('auctions').insert({
      title: 'Gran Subasta de Autos Clásicos y Arte',
      start_date: now2.toISOString(),
      end_date: end2.toISOString(),
      minimum_category: 'bronze',
      status: 'active'
    }).select().single();

    const { data: a3 } = await supabase.from('auctions').insert({
      title: 'Subasta de Alta Joyería y Gemas Preciosas',
      start_date: start3.toISOString(),
      end_date: end3.toISOString(),
      minimum_category: 'bronze',
      status: 'upcoming'
    }).select().single();

    // 4. Create Items with working images
    console.log('Creating items...');
    await supabase.from('items').insert([
      {
        auction_id: a1.id,
        owner_id: userIds['testplatino@test.com'],
        title: 'Reloj Rolex Vintage 1965',
        description: 'Reloj de colección Oyster Perpetual en excelente estado.',
        starting_price: 10000,
        status: 'in_auction',
        images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800']
      },
      {
        auction_id: a2.id,
        owner_id: userIds['testplatino@test.com'],
        title: 'Ford Mustang 1969 Fastback',
        description: 'Clásico americano restaurado a nuevo.',
        starting_price: 50000,
        status: 'in_auction',
        images: ['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=800']
      },
      {
        auction_id: a2.id,
        owner_id: userIds['testcomun@test.com'],
        title: 'Cuadro Abstracto Moderno - Óleo',
        description: 'Obra de artista contemporáneo.',
        starting_price: 5000,
        status: 'in_auction',
        images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800']
      },
      {
        auction_id: a3.id,
        owner_id: userIds['admin@subastasya.com'],
        title: 'Gargantilla de Diamantes y Oro Blanco',
        description: 'Alta joyería certificada.',
        starting_price: 25000,
        status: 'in_auction',
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800']
      }
    ]);

    // 5. Register users to auction: Usuario Oro solo a las 2 activas
    console.log('Registering users to auctions...');
    await supabase.from('auction_participants').insert([
      { user_id: userIds['testoro@test.com'], auction_id: a1.id },
      { user_id: userIds['testoro@test.com'], auction_id: a2.id },
      { user_id: userIds['testcomun@test.com'], auction_id: a1.id },
      { user_id: userIds['testplatino@test.com'], auction_id: a2.id }
    ]);

    console.log('✅ Setup completed successfully!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setup();
