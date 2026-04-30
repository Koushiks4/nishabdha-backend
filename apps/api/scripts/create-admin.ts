import { PrismaClient } from '@nishabdha/database';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface CreateAdminInput {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'ORDER_MANAGER' | 'STUDIO_MANAGER';
}

async function createAdmin({ email, password, name, role }: CreateAdminInput) {
  try {
    console.log(`\n🔐 Creating admin user: ${email}`);

    // Step 1: Check if admin already exists in database
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log(`❌ Admin with email ${email} already exists in database`);
      return;
    }

    // Step 2: Create user in Supabase Auth
    console.log('📝 Creating Supabase Auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role
      }
    });

    if (authError) {
      console.error('❌ Supabase Auth error:', authError.message);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user returned from Supabase');
    }

    console.log(`✅ Supabase user created with UID: ${authData.user.id}`);

    // Step 3: Create Admin record in database
    console.log('💾 Creating Admin record in database...');
    const admin = await prisma.admin.create({
      data: {
        supabaseUid: authData.user.id,
        email,
        name,
        role,
        isActive: true
      }
    });

    console.log(`✅ Admin created successfully!`);
    console.log(`\nAdmin Details:`);
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Supabase UID: ${admin.supabaseUid}`);
    console.log(`\n🎉 You can now login with:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Admin Dashboard: http://localhost:5173`);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  }
}

async function main() {
  try {
    // Get admin details from command line arguments or use defaults
    const email = process.argv[2] || 'admin@nishabdha.com';
    const password = process.argv[3] || 'Admin@123';
    const name = process.argv[4] || 'Super Admin';
    const role = (process.argv[5] as any) || 'SUPER_ADMIN';

    await createAdmin({ email, password, name, role });

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
