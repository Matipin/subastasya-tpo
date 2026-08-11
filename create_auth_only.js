require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://xtabtnnnxdnwhbttyfdq.supabase.co',
  process.env.SUPABASE_SECRET_KEY || 'YOUR_SUPABASE_SECRET_KEY',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  console.log('Creating user: testoro@test.com');
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'testoro@test.com',
    password: '123456',
    email_confirm: true
  });
  if (error) console.log('Error creating:', error.message);
  else console.log('Success:', data.user.id);
}
run();
