const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://xtabtnnnxdnwhbttyfdq.supabase.co';
const supabaseKey = 'sb_publishable_DNfQMI1Ndj55iV9PIg7z_g_COLWsUY7';

const supabase = createClient(supabaseUrl, supabaseKey);

const accounts = [
  { email: 'testcomun@test.com', password: 'comun123', firstName: 'Usuario', lastName: 'Común', category: 'bronze' },
  { email: 'testoro@test.com', password: 'oro12345', firstName: 'Usuario', lastName: 'Oro', category: 'gold' },
  { email: 'testplatino@test.com', password: 'platino', firstName: 'Usuario', lastName: 'Platino', category: 'platinum' }
];

async function createAccounts() {
  for (const acc of accounts) {
    console.log(`Creando cuenta para ${acc.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: acc.email,
      password: acc.password,
    });
    
    if (error) {
      console.error(`Error creando ${acc.email}:`, error.message);
      // Intentar actualizar el perfil de todas formas si ya existe
      const { data: userData } = await supabase.from('profiles').select('id').eq('email', acc.email).single();
      if (userData) {
          console.log(`Actualizando perfil de ${acc.email}...`);
          await updateProfile(userData.id, acc);
      }
    } else {
      console.log(`Cuenta creada para ${acc.email}! UUID: ${data.user.id}`);
      await updateProfile(data.user.id, acc);
    }
  }
}

async function updateProfile(userId, acc) {
  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: acc.firstName,
      last_name: acc.lastName,
      category: acc.category,
      is_approved: true,
      guarantee_balance: 100000.00
    })
    .eq('id', userId);
    
  if (error) {
    console.error(`Error actualizando perfil para ${acc.email}:`, error.message);
  } else {
    console.log(`Perfil actualizado para ${acc.email}!`);
    // Insertar tarjeta preaprobada
    await supabase.from('payment_methods').insert({
        user_id: userId,
        provider: 'Visa Black',
        card_number: '**** **** **** 9999',
        type: 'CARD'
    });
    console.log(`Tarjeta añadida para ${acc.email}!`);
  }
}

createAccounts().then(() => console.log('Proceso finalizado.'));
