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
          role VARCHAR(30) DEFAULT 'user',
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
          status VARCHAR(20) DEFAULT 'REPORTED',
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
          vote_type VARCHAR(10) DEFAULT 'UP',
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
          tier VARCHAR(20) DEFAULT 'COMMUNITY',
          rate_limit INT DEFAULT 5000,
          subscription_cost_npr NUMERIC(10,2) DEFAULT 0.00,
          request_count INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
          sender_name VARCHAR(255) NOT NULL,
          is_anonymous BOOLEAN DEFAULT true,
          text TEXT NOT NULL,
          room_key VARCHAR(255) NOT NULL,
          ip_subnet VARCHAR(100) NOT NULL,
          location_lat DOUBLE PRECISION,
          location_lng DOUBLE PRECISION,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // ─── New Vendor System Tables ────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS vendors (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          company_name VARCHAR(255) NOT NULL,
          business_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          contact_phone VARCHAR(50),
          website VARCHAR(255),
          logo_url TEXT,
          location_lat DOUBLE PRECISION NOT NULL,
          location_lng DOUBLE PRECISION NOT NULL,
          address TEXT NOT NULL,
          service_radius DOUBLE PRECISION DEFAULT 5.0,
          is_approved BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ads (
          id VARCHAR(64) PRIMARY KEY,
          vendor_id VARCHAR(64) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          image_url TEXT,
          link_url TEXT,
          placement VARCHAR(20) DEFAULT 'FEED',
          is_active BOOLEAN DEFAULT true,
          is_approved BOOLEAN DEFAULT false,
          impressions INT DEFAULT 0,
          clicks INT DEFAULT 0,
          start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          end_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tenders (
          id VARCHAR(64) PRIMARY KEY,
          vendor_id VARCHAR(64) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
          issue_id VARCHAR(64) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
          proposal_text TEXT NOT NULL,
          estimated_cost_npr DOUBLE PRECISION NOT NULL,
          estimated_days INT NOT NULL,
          status VARCHAR(20) DEFAULT 'SUBMITTED',
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          responded_at TIMESTAMP WITH TIME ZONE,
          response_notes TEXT
      );
    `;

    console.log('✅ Database Schema & Migration complete.');

    // ─── Drop role constraint if exists (to allow new roles) ────────────────────────
    try {
      await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`;
    } catch (e) {
      // Constraint may not exist, that's fine
    }

    // 2. Seed Initial User Accounts
    console.log('🌱 Seeding user accounts for Lalitpur...');
    
    await sql`
      INSERT INTO users (id, name, email, password_hash, role, organization_name, registration_number)
      VALUES 
        ('usr-superadmin-1', 'System Administrator', 'superadmin@PublicCare.np', 'admin123', 'superadmin', 'PublicCare Platform', 'SYS-001'),
        ('usr-citizen-1', 'Aayush Shrestha', 'citizen@lalitpur.gov.np', 'pass123', 'user', NULL, NULL),
        ('usr-admin-1', 'Er. Rajesh Maharjan', 'officer@lalitpur.gov.np', 'admin123', 'municipality_admin', 'Lalitpur Sanitation Dept', 'GOV-LPT-001'),
        ('usr-ngo-1', 'Sujata Thapa', 'ngo@cleanworld.org', 'ngo123', 'ngo', 'Himalayan Climate Alliance', 'NGO-LPT-2026-042'),
        ('usr-vendor-1', 'Ram Shrestha', 'vendor@cleanlalitpur.com', 'vendor123', 'vendor', 'Clean Lalitpur Pvt Ltd', 'VND-LPT-001'),
        ('usr-vendor-2', 'Sita Maharjan', 'vendor@greenvalley.com', 'vendor123', 'vendor', 'Green Valley Sanitation', 'VND-LPT-002'),
        ('usr-vendor-3', 'Binod Tamang', 'vendor@safewaste.com', 'vendor123', 'vendor', 'Safe Waste Solutions', 'VND-LPT-003'),
        ('usr-vendor-4', 'Priya Dangol', 'vendor@fixitfast.com', 'vendor123', 'vendor', 'FixIt Fast Services', 'VND-LPT-004'),
        ('usr-vendor-5', 'Kiran Joshi', 'vendor@pipemaster.com', 'vendor123', 'vendor', 'Pipe Master Plumbing', 'VND-LPT-005')
      ON CONFLICT (email) DO NOTHING;
    `;

    // 3. Seed Initial Lalitpur Civic Reports
    console.log('🌱 Seeding Lalitpur Municipality civic reports...');

    await sql`
      INSERT INTO issues (id, user_id, title, category, description, location_lat, location_lng, address, image_url, status, net_upvotes, reporter_name)
      VALUES 
        ('iss-lpt-101', 'usr-citizen-1', 'Uncollected Solid Waste Heap near Patan Durbar Square', 'GARBAGE_DUMP', 'Accumulation of unmanaged plastic bottles, bio-waste, and ritual debris near the heritage temple walkway.', 27.6727, 85.3253, 'Mangal Bazar Heritage Walk, Patan Ward 16', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80', 'CRITICAL', 5, 'Aayush Shrestha'),
        ('iss-lpt-102', 'usr-admin-1', 'Clogged Drainage & Sewage Spill at Jawalakhel Roundabout', 'SEWAGE_OVERFLOW', 'Heavy rain runoff causing storm drain overflow near Central Zoo entrance.', 27.6740, 85.3170, 'Jawalakhel Chowk, Lalitpur Ward 4', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'IN_PROGRESS', 4, 'Rabindra Maharjan'),
        ('iss-lpt-103', 'usr-ngo-1', 'Illegal Chemical Runoff Dumping near Bagmati River Corridor', 'ILLEGAL_DUMPING', 'Unidentified commercial vehicle dumped barrels of industrial wash fluid under Kupondole Bridge overnight.', 27.6850, 85.3180, 'Kupondole Bagmati Bridge Corridor, Ward 1', 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=800&q=80', 'CRITICAL', 6, 'Sujata Thapa'),
        ('iss-lpt-104', 'usr-citizen-1', 'Overflowing Public Toilet at Lagankhel Bus Park', 'PUBLIC_TOILET', 'The public restroom at the main bus terminal has blocked drainage causing overflow onto the sidewalk.', 27.6680, 85.3240, 'Lagankhel Bus Park, Ward 14', 'https://images.unsplash.com/photo-1585559604959-6388fe69c92a?auto=format&fit=crop&w=800&q=80', 'REPORTED', 2, 'Aayush Shrestha'),
        ('iss-lpt-105', 'usr-citizen-1', 'Contaminated Water Supply in Kumaripati', 'WATER_CONTAMINATION', 'Residents reporting brown-colored water from municipality supply taps, suspected pipe corrosion.', 27.6700, 85.3200, 'Kumaripati Main Road, Ward 12', 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=800&q=80', 'REPORTED', 1, 'Sunita Maharjan'),
        ('iss-lpt-106', 'usr-admin-1', 'Garbage Pileup at Pulchowk Engineering Campus Gate', 'GARBAGE_DUMP', 'Large accumulation of construction debris and household waste near the campus main entrance.', 27.6780, 85.3190, 'Pulchowk Campus Gate, Ward 5', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=800&q=80', 'IN_PROGRESS', 3, 'Er. Rajesh Maharjan'),
        ('iss-lpt-107', 'usr-citizen-1', 'Dead Animal Hazard near Satdobato Market', 'DEAD_ANIMAL', 'Dead stray dog carcass left unattended near the fresh produce market area causing hygiene concerns.', 27.6620, 85.3280, 'Satdobato Market Lane, Ward 18', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80', 'REPORTED', 1, 'Anonymous Citizen'),
        ('iss-lpt-108', 'usr-ngo-1', 'Sewage Leak at Imadol Residential Area', 'SEWAGE_OVERFLOW', 'Raw sewage leaking from broken pipe into residential colony drainage channel.', 27.6580, 85.3400, 'Imadol Residential Colony, Ward 20', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'RESOLVED', 4, 'Sujata Thapa'),
        ('iss-lpt-109', 'usr-admin-1', 'Massive Sinkhole on Main Ring Road', 'INFRASTRUCTURE', 'A 10-foot wide sinkhole has opened up in the middle of the road causing massive traffic jams and safety risks. Needs immediate contractor intervention.', 27.6650, 85.3300, 'Gwarko Ring Road, Ward 17', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80', 'CRITICAL', 12, 'Traffic Police Unit')
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, net_upvotes = EXCLUDED.net_upvotes;
    `;

    // 4. Seed Initial NGO API Keys
    console.log('🌱 Seeding NGO API keys...');

    await sql`
      INSERT INTO ngo_api_keys (id, user_id, org_name, api_key, tier, rate_limit, subscription_cost_npr)
      VALUES 
        ('key-1', 'usr-ngo-1', 'Himalayan Climate Alliance', 'cp_lpt_himalayan_984102934', 'ENTERPRISE', 50000, 5000.00)
      ON CONFLICT (api_key) DO NOTHING;
    `;

    // 5. Seed Vendor Profiles
    console.log('🌱 Seeding vendor profiles...');

    await sql`
      INSERT INTO vendors (id, user_id, company_name, business_type, description, contact_phone, website, logo_url, location_lat, location_lng, address, service_radius, is_approved, created_at, updated_at)
      VALUES 
        ('vnd-001', 'usr-vendor-1', 'Clean Lalitpur Pvt Ltd', 'WASTE_MANAGEMENT', 'Professional waste collection, recycling, and disposal services for Lalitpur metropolitan area. Operating since 2020 with fleet of 12 vehicles.', '+977-9841234567', 'https://cleanlalitpur.com', NULL, 27.6730, 85.3250, 'Mangal Bazar, Patan Ward 16', 8.0, true, NOW(), NOW()),
        ('vnd-002', 'usr-vendor-2', 'Green Valley Sanitation', 'SANITATION', 'Complete sanitation solutions including septic tank cleaning, drain unblocking, and sewage system maintenance across Lalitpur.', '+977-9851234568', 'https://greenvalley.com.np', NULL, 27.6750, 85.3170, 'Jawalakhel, Lalitpur Ward 4', 6.0, true, NOW(), NOW()),
        ('vnd-003', 'usr-vendor-3', 'Safe Waste Solutions', 'ENVIRONMENTAL', 'Hazardous waste handling, chemical waste disposal, and environmental cleanup specialists certified by Nepal EPA.', '+977-9861234569', 'https://safewaste.com.np', NULL, 27.6850, 85.3200, 'Kupondole, Lalitpur Ward 1', 10.0, true, NOW(), NOW()),
        ('vnd-004', 'usr-vendor-4', 'FixIt Fast Services', 'CONSTRUCTION', 'General construction, road repair, infrastructure maintenance, and public facility restoration services.', '+977-9871234570', 'https://fixitfast.com.np', NULL, 27.6680, 85.3240, 'Lagankhel, Lalitpur Ward 14', 5.0, false, NOW(), NOW()),
        ('vnd-005', 'usr-vendor-5', 'Pipe Master Plumbing', 'PLUMBING', 'Water supply pipe repair, drainage installation, and sewage line maintenance for residential and commercial properties.', '+977-9881234571', 'https://pipemaster.com.np', NULL, 27.6700, 85.3190, 'Pulchowk, Lalitpur Ward 5', 7.0, true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    // 6. Seed Ads
    console.log('🌱 Seeding vendor advertisements...');

    await sql`
      INSERT INTO ads (id, vendor_id, title, description, image_url, link_url, placement, is_active, is_approved, impressions, clicks)
      VALUES 
        ('ad-001', 'vnd-001', 'Professional Waste Collection at Your Doorstep', 'Clean Lalitpur offers daily scheduled waste pickup for residential and commercial properties. First month 50% off! Call now for a free assessment.', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80', 'https://cleanlalitpur.com/services', 'FEED', true, true, 1245, 89),
        ('ad-002', 'vnd-002', 'Emergency Drain Unblocking - 24/7 Service', 'Clogged drains? Sewage backup? Green Valley Sanitation provides round-the-clock emergency drain clearing services across Lalitpur. Response within 1 hour!', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80', 'https://greenvalley.com.np/emergency', 'FEED', true, true, 856, 67),
        ('ad-003', 'vnd-003', 'Certified Hazardous Waste Disposal', 'Safe Waste Solutions is your EPA-certified partner for chemical and industrial waste disposal. Protecting Lalitpur''s rivers and groundwater since 2018.', 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80', 'https://safewaste.com.np', 'SIDEBAR', true, true, 432, 28),
        ('ad-004', 'vnd-005', 'Pipe Repair & Water Line Installation', 'Experienced plumbing team for water supply fixes, pipe replacement, and new installations. Licensed and insured. Free estimates for all Lalitpur residents.', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80', 'https://pipemaster.com.np/services', 'FEED', true, true, 621, 45),
        ('ad-005', 'vnd-001', 'Recycling Program - Turn Waste Into Value', 'Join our community recycling initiative. We provide free sorting bins and weekly pickups. Earn cashback rewards for recyclable materials!', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 'https://cleanlalitpur.com/recycling', 'BANNER', true, true, 2100, 156),
        ('ad-006', 'vnd-004', 'Road & Infrastructure Repair Services', 'FixIt Fast provides pothole repair, sidewalk restoration, and public facility maintenance. Government-approved contractor with competitive rates.', NULL, 'https://fixitfast.com.np', 'FEED', true, false, 0, 0)
      ON CONFLICT (id) DO NOTHING;
    `;

    // 7. Seed Tenders
    console.log('🌱 Seeding vendor tenders...');

    await sql`
      INSERT INTO tenders (id, vendor_id, issue_id, proposal_text, estimated_cost_npr, estimated_days, status)
      VALUES 
        ('tnd-001', 'vnd-001', 'iss-lpt-101', 'We propose a complete cleanup of the waste heap near Patan Durbar Square using our mechanized collection fleet. Includes waste sorting, recycling of recoverable materials, and safe disposal of remaining waste at the Sisdole landfill. Our team of 8 workers with 2 trucks can complete this within 2 days.', 45000, 2, 'ACCEPTED'),
        ('tnd-002', 'vnd-002', 'iss-lpt-102', 'Green Valley will deploy our specialized drain jetting equipment to clear the blocked drainage at Jawalakhel. The service includes CCTV pipe inspection, high-pressure water jetting, and installation of debris traps to prevent future blockages.', 35000, 1, 'ACCEPTED'),
        ('tnd-003', 'vnd-003', 'iss-lpt-103', 'Safe Waste Solutions will conduct soil and water testing at the Kupondole site, safely remove the dumped chemical barrels, and perform environmental remediation. Includes containment barriers to prevent further spread of contaminants.', 125000, 5, 'SUBMITTED'),
        ('tnd-004', 'vnd-005', 'iss-lpt-105', 'Pipe Master will inspect the water supply line in Kumaripati using fiber optic cameras, replace corroded sections (estimated 200m of pipe), and flush the system. Includes water quality testing post-repair.', 85000, 4, 'SUBMITTED'),
        ('tnd-005', 'vnd-004', 'iss-lpt-106', 'FixIt Fast proposes a comprehensive cleanup of construction debris at Pulchowk, followed by installation of proper waste collection bins and a concrete waste enclosure to prevent future dumping.', 55000, 3, 'REJECTED')
      ON CONFLICT (id) DO NOTHING;
    `;

    // 8. Create indexes for new tables
    console.log('🔧 Creating indexes...');

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_vendors_business_type ON vendors(business_type);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_vendors_approved ON vendors(is_approved);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ads_placement ON ads(placement);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ads_approved ON ads(is_approved);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_tenders_issue ON tenders(issue_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_tenders_vendor ON tenders(vendor_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_key);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);`;
    } catch (e) {
      // Indexes may already exist
    }

    console.log('🎉 Neon Database successfully initialized and seeded!');
    console.log('');
    console.log('📋 Test Accounts:');
    console.log('  Superadmin:  superadmin@PublicCare.np / admin123');
    console.log('  Municipal:   officer@lalitpur.gov.np / admin123');
    console.log('  Citizen:     citizen@lalitpur.gov.np / pass123');
    console.log('  Vendor:      vendor@cleanlalitpur.com / vendor123');
    console.log('  NGO:         ngo@cleanworld.org / ngo123');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

runMigrationsAndSeed();
