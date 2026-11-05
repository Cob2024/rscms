import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Load .env if present
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  console.warn("Could not load .env file directly:", e);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceRoleKey || !anonKey) {
  console.error("Missing Supabase configuration in environment variables.");
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supabaseClient = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

async function createOrUpdateAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_EMAIL || "admin@rscms.local";
  const password = args[1] || process.env.ADMIN_PASSWORD || "Admin@RSCMS2025!";
  const fullName = args[2] || "System Administrator";

  console.log(`\n========================================`);
  console.log(`RSCMS Administrator Account Provisioning`);
  console.log(`========================================`);
  console.log(`Target Email: ${email}`);
  console.log(`Full Name:    ${fullName}`);

  try {
    // 1. Check if user already exists in Supabase Auth
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list Supabase users: ${listError.message}`);
    }

    let authUser = usersList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (authUser) {
      console.log(`\nUser exists in Supabase Auth (UUID: ${authUser.id}).`);
      console.log(`Updating password and auto-confirming email...`);
      const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        }
      );
      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      authUser = updated.user;
      console.log(`✓ Password updated successfully.`);
    } else {
      console.log(`\nCreating user in Supabase Auth...`);
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError) {
        throw new Error(`Failed to create Supabase Auth user: ${createError.message}`);
      }
      authUser = created.user;
      console.log(`✓ User created successfully in Supabase Auth (UUID: ${authUser.id}).`);
    }

    // 2. Link UUID into admin_users table in PostgreSQL
    console.log(`\nLinking administrator in PostgreSQL database (admin_users table)...`);
    const dbAdmin = await prisma.adminUser.upsert({
      where: { email },
      update: {
        supabaseId: authUser.id,
        fullName,
      },
      create: {
        supabaseId: authUser.id,
        email,
        fullName,
      },
    });

    console.log(`✓ Admin record linked:`);
    console.log(`  - Database ID:  ${dbAdmin.id}`);
    console.log(`  - Supabase ID:  ${dbAdmin.supabaseId}`);
    console.log(`  - Email:        ${dbAdmin.email}`);

    // 3. Verify credentials with standard sign-in
    console.log(`\nVerifying sign-in with Supabase Auth...`);
    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.warn(`! Sign-in verification warning: ${signInError.message}`);
    } else if (sessionData.user) {
      console.log(`✓ Sign-in verified successfully! User ID matches: ${sessionData.user.id}`);
    }

    console.log(`\n========================================`);
    console.log(`Admin credentials ready for login:`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`========================================\n`);
  } catch (error: any) {
    console.error(`\n✖ Error provisioning admin:`, error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createOrUpdateAdmin();

