export type UserRole = 'user' | 'municipality_admin' | 'ngo';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName?: string;
  registrationNumber?: string;
  createdAt: string;
}

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
}

export interface IssueVote {
  id: string;
  issueId: string;
  userId: string;
  voteType: 'UP' | 'DOWN';
  createdAt: string;
}

export interface NgoApiKey {
  id: string;
  userId: string; // Scoped to owning NGO user
  orgName: string;
  apiKey: string;
  tier: 'COMMUNITY' | 'ENTERPRISE';
  rateLimit: number;
  subscriptionCostNpr: number;
  createdAt: string;
  requestCount: number;
}

export interface StatsSummary {
  totalIssues: number;
  criticalIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  resolutionRate: number;
  avgResolutionDays: number;
  totalEstimatedCostNpr: number;
}
