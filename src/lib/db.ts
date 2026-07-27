import { Issue, IssueCategory, IssueStatus, NgoApiKey, StatsSummary, User } from '@/types';
import { IssueModel } from './models/issue.model';
import { NgoModel } from './models/ngo.model';

class CivicDatabaseFacade {
  public async getIssues(user?: User | null, filters?: { status?: IssueStatus; category?: IssueCategory; query?: string }): Promise<Issue[]> {
    return await IssueModel.getAll(user, filters);
  }

  public async getIssueById(id: string, user?: User | null): Promise<Issue | null> {
    return await IssueModel.getById(id, user);
  }

  public async createIssue(user: User | null, data: {
    title: string;
    category: IssueCategory;
    description: string;
    locationLat: number;
    locationLng: number;
    address: string;
    imageUrl?: string;
    reporterName?: string;
    reporterContact?: string;
  }): Promise<Issue> {
    return await IssueModel.create(user, data);
  }

  public async voteIssue(user: User | null, issueId: string): Promise<{ issue: Issue; escalated: boolean }> {
    return await IssueModel.vote(user, issueId);
  }

  public async updateIssueStatus(user: User | null, issueId: string, status: IssueStatus, notes?: string): Promise<Issue> {
    return await IssueModel.updateStatus(user, issueId, status, notes);
  }

  public async getStatsSummary(): Promise<StatsSummary> {
    return await IssueModel.getStats();
  }

  public async generateNgoApiKey(user: User | null, orgName: string, tier: 'COMMUNITY' | 'ENTERPRISE'): Promise<NgoApiKey> {
    return await NgoModel.generateKey(user, orgName, tier);
  }

  public async validateNgoApiKey(apiKey: string): Promise<NgoApiKey | null> {
    return await NgoModel.validateKey(apiKey);
  }

  public async getNgoApiKeys(user: User | null): Promise<NgoApiKey[]> {
    return await NgoModel.getKeys(user);
  }
}

export const db = new CivicDatabaseFacade();
