-- CivicPulse Neon Serverless Postgres SQL Schema
-- Lalitpur Municipality Waste & Hygiene Management System (Phase 2)

-- 1. Users Table (Role-Based Access Control)
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

-- 2. Issues Table (Lalitpur Bounded Civic Reports)
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
    reporterContact VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_net_upvotes ON issues(net_upvotes);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);

-- 3. Issue Votes Table (Strict Single Vote Enforcement)
CREATE TABLE IF NOT EXISTS issue_votes (
    id VARCHAR(64) PRIMARY KEY,
    issue_id VARCHAR(64) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    vote_type VARCHAR(10) CHECK (vote_type IN ('UP', 'DOWN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_issue_vote UNIQUE(issue_id, user_id)
);

-- 4. NGO API Keys Table (Scoped to owning NGO user)
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

-- Automated Escalation Trigger Function:
-- Escalates an issue to 'CRITICAL' status if net_upvotes >= 3 within 7 weeks of creation.
CREATE OR REPLACE FUNCTION check_issue_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.net_upvotes >= 3 
       AND NEW.status = 'REPORTED' 
       AND NEW.created_at >= NOW() - INTERVAL '7 weeks' THEN
        NEW.status := 'CRITICAL';
        NEW.escalated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_issue_escalation
BEFORE UPDATE ON issues
FOR EACH ROW
EXECUTE FUNCTION check_issue_escalation();
