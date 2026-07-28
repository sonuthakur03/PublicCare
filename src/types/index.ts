// ─── PublicCare Type Definitions ────────────────────────────────────

export type UserRole = 'superadmin' | 'municipality_admin' | 'vendor' | 'user' | 'ngo' | 'admin' | 'citizen';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName?: string;
  registrationNumber?: string;
  createdAt: string;
}

// ─── Issue Types ────────────────────────────────────────

export type IssueCategory =
  | 'GARBAGE_DUMP'
  | 'SEWAGE_OVERFLOW'
  | 'WATER_CONTAMINATION'
  | 'ILLEGAL_DUMPING'
  | 'PUBLIC_TOILET'
  | 'DEAD_ANIMAL'
  | 'OTHER';

export type IssueStatus =
  | 'REPORTED'
  | 'CRITICAL'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export interface Issue {
  id: string;
  userId?: string;
  title: string;
  category: IssueCategory;
  description: string;
  locationLat: number;
  locationLng: number;
  address: string;
  imageUrl?: string;
  status: IssueStatus;
  netUpvotes: number;
  createdAt: string;
  escalatedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  reporterName?: string;
  reporterContact?: string;
  hasVotedByCurrentUser?: boolean;
  tenders?: Tender[];
}

export interface IssueVote {
  id: string;
  issueId: string;
  userId: string;
  voteType: 'UP' | 'DOWN';
  createdAt: string;
}

// ─── Vendor Types ────────────────────────────────────────

export type VendorBusinessType =
  | 'WASTE_MANAGEMENT'
  | 'CONSTRUCTION'
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'SANITATION'
  | 'ENVIRONMENTAL'
  | 'OTHER';

export interface Vendor {
  id: string;
  userId: string;
  companyName: string;
  businessType: VendorBusinessType;
  description: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  locationLat: number;
  locationLng: number;
  address: string;
  serviceRadius: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  ads?: Ad[];
  tenders?: Tender[];
  _count?: {
    ads: number;
    tenders: number;
  };
  distance?: number; // computed at query time for nearby searches
}

// ─── Ad Types ────────────────────────────────────────

export type AdPlacement = 'FEED' | 'SIDEBAR' | 'BANNER';

export interface Ad {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  placement: AdPlacement;
  isActive: boolean;
  isApproved: boolean;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  vendor?: Pick<Vendor, 'id' | 'companyName' | 'logoUrl' | 'businessType'>;
}

// ─── Tender Types ────────────────────────────────────────

export type TenderStatus = 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export interface Tender {
  id: string;
  vendorId: string;
  issueId: string;
  proposalText: string;
  estimatedCostNpr: number;
  estimatedDays: number;
  status: TenderStatus;
  submittedAt: string;
  respondedAt?: string;
  responseNotes?: string;
  vendor?: Pick<Vendor, 'id' | 'companyName' | 'businessType' | 'contactPhone' | 'logoUrl'>;
  issue?: Pick<Issue, 'id' | 'title' | 'category' | 'status' | 'address'>;
}

// ─── NGO Types (legacy) ────────────────────────────────────────

export interface NgoApiKey {
  id: string;
  userId: string;
  orgName: string;
  apiKey: string;
  tier: 'COMMUNITY' | 'ENTERPRISE';
  rateLimit: number;
  subscriptionCostNpr: number;
  createdAt: string;
  requestCount: number;
}

// ─── Stats Types ────────────────────────────────────────

export interface StatsSummary {
  totalIssues: number;
  criticalIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  resolutionRate: number;
  avgResolutionDays: number;
  totalEstimatedCostNpr: number;
}

export interface PlatformStats extends StatsSummary {
  totalUsers: number;
  totalVendors: number;
  approvedVendors: number;
  totalAds: number;
  activeAds: number;
  totalTenders: number;
  acceptedTenders: number;
  usersByRole: { role: string; count: number }[];
  issuesByCategory: { category: string; count: number }[];
  issuesByMonth: { month: string; count: number }[];
}
