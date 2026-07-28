-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "organization_name" TEXT,
    "registration_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "net_upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalated_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "reporter_name" TEXT,
    "reporter_contact" TEXT,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_votes" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vote_type" TEXT NOT NULL DEFAULT 'UP',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ngo_api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'COMMUNITY',
    "rate_limit" INTEGER NOT NULL DEFAULT 5000,
    "subscription_cost_npr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ngo_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "issues"("status");

-- CreateIndex
CREATE INDEX "issues_net_upvotes_idx" ON "issues"("net_upvotes");

-- CreateIndex
CREATE INDEX "issues_created_at_idx" ON "issues"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "issue_votes_issue_id_user_id_key" ON "issue_votes"("issue_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ngo_api_keys_api_key_key" ON "ngo_api_keys"("api_key");

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_votes" ADD CONSTRAINT "issue_votes_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_votes" ADD CONSTRAINT "issue_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngo_api_keys" ADD CONSTRAINT "ngo_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
