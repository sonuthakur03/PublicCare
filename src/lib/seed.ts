import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.includes('placeholder')) {
  console.error('ERROR: DATABASE_URL is not set or invalid in .env file.');
  console.error('Please set your Neon DATABASE_URL in .env before running database seed.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigrationsAndSeed() {
  console.log('🚀 Connecting to Neon Postgres Database...');

  try {
    // 1. Create Tables
    console.log('📦 Creating database tables (DDL Migrations)...');

    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(30) DEFAULT 'user' CHECK (role IN ('user', 'municipality_admin', 'ngo')),
          organization_name VARCHAR(255),
          registration_number VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS issues (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          location_lat DOUBLE PRECISION NOT NULL,
          location_lng DOUBLE PRECISION NOT NULL,
          address TEXT NOT NULL,
          image_url TEXT,
          status VARCHAR(20) DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'CRITICAL', 'IN_PROGRESS', 'RESOLVED')),
          net_upvotes INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          escalated_at TIMESTAMP WITH TIME ZONE,
          resolved_at TIMESTAMP WITH TIME ZONE,
          resolution_notes TEXT,
          reporter_name VARCHAR(100),
          reporter_contact VARCHAR(100)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS issue_votes (
          id VARCHAR(64) PRIMARY KEY,
          issue_id VARCHAR(64) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
          user_id VARCHAR(64) NOT NULL,
          vote_type VARCHAR(10) CHECK (vote_type IN ('UP', 'DOWN')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_user_issue_vote UNIQUE(issue_id, user_id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ngo_api_keys (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          org_name VARCHAR(255) NOT NULL,
          api_key VARCHAR(128) UNIQUE NOT NULL,
          tier VARCHAR(20) DEFAULT 'COMMUNITY' CHECK (tier IN ('COMMUNITY', 'ENTERPRISE')),
          rate_limit INT DEFAULT 5000,
          subscription_cost_npr NUMERIC(10,2) DEFAULT 0.00,
          request_count INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('✅ Database Schema & Migration complete.');

    // 2. Seed Initial User Accounts
    console.log('🌱 Seeding initial user accounts for Lalitpur...');
    
    await sql`
      INSERT INTO users (id, name, email, password_hash, role, organization_name, registration_number)
      VALUES 
        ('usr-citizen-1', 'Aayush Shrestha', 'citizen@lalitpur.gov.np', 'pass123', 'user', NULL, NULL),
        ('usr-admin-1', 'Er. Rajesh Maharjan', 'officer@lalitpur.gov.np', 'admin123', 'municipality_admin', 'Lalitpur Sanitation Dept', 'GOV-LPT-001'),
        ('usr-ngo-1', 'Sujata Thapa', 'ngo@cleanworld.org', 'ngo123', 'ngo', 'Himalayan Climate Alliance', 'NGO-LPT-2026-042')
      ON CONFLICT (email) DO NOTHING;
    `;

    // 3. Seed Initial Lalitpur Civic Reports
    console.log('🌱 Seeding initial Lalitpur Municipality civic reports...');

    await sql`
      INSERT INTO issues (id, user_id, title, category, description, location_lat, location_lng, address, image_url, status, net_upvotes, reporter_name)
      VALUES 
        ('iss-lpt-101', 'usr-citizen-1', 'Uncollected Solid Waste Heap near Patan Durbar Square', 'GARBAGE_DUMP', 'Accumulation of unmanaged plastic bottles, bio-waste, and ritual debris near the heritage temple walkway.', 27.6727, 85.3253, 'Mangal Bazar Heritage Walk, Patan Ward 16', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80', 'CRITICAL', 5, 'Aayush Shrestha'),
        ('iss-lpt-102', 'usr-admin-1', 'Clogged Drainage & Sewage Spill at Jawalakhel Roundabout', 'SEWAGE_OVERFLOW', 'Heavy rain runoff causing storm drain overflow near Central Zoo entrance.', 27.6740, 85.3170, 'Jawalakhel Chowk, Lalitpur Ward 4', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'IN_PROGRESS', 4, 'Rabindra Maharjan'),
        ('iss-lpt-103', 'usr-ngo-1', 'Illegal Chemical Runoff Dumping near Bagmati River Corridor', 'ILLEGAL_DUMPING', 'Unidentified commercial vehicle dumped barrels of industrial wash fluid under Kupondole Bridge overnight.', 27.6850, 85.3180, 'Kupondole Bagmati Bridge Corridor, Ward 1', 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=800&q=80', 'CRITICAL', 6, 'Sujata Thapa')
      ON CONFLICT (id) DO NOTHING;
    `;

    // 4. Seed Initial NGO API Keys
    console.log('🌱 Seeding initial NGO API keys...');

    await sql`
      INSERT INTO ngo_api_keys (id, user_id, org_name, api_key, tier, rate_limit, subscription_cost_npr)
      VALUES 
        ('key-1', 'usr-ngo-1', 'Himalayan Climate Alliance', 'cp_lpt_himalayan_984102934', 'ENTERPRISE', 50000, 5000.00)
      ON CONFLICT (api_key) DO NOTHING;
    `;

    console.log('🎉 Neon Database successfully initialized and seeded!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

runMigrationsAndSeed();
