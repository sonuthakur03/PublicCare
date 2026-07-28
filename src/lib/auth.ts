import { User, UserRole } from '@/types';
import { AuthService } from './services/auth.service';
import { UserModel } from './models/user.model';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-citizen-1',
    name: 'Aayush Shrestha',
    email: 'citizen@lalitpur.gov.np',
    role: 'user',
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'usr-admin-1',
    name: 'Er. Rajesh Maharjan',
    email: 'officer@lalitpur.gov.np',
    role: 'municipality_admin',
    organizationName: 'Lalitpur Sanitation Dept',
    registrationNumber: 'GOV-LPT-001',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-ngo-1',
    name: 'Sujata Thapa',
    email: 'ngo@cleanworld.org',
    role: 'ngo',
    organizationName: 'Himalayan Climate Alliance',
    registrationNumber: 'NGO-LPT-2026-042',
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'usr-superadmin-1',
    name: 'System Administrator',
    email: 'superadmin@PublicCare.np',
    role: 'superadmin',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-vendor-1',
    name: 'Ram Shrestha',
    email: 'vendor@cleanlalitpur.com',
    role: 'vendor',
    organizationName: 'Clean Lalitpur Pvt Ltd',
    createdAt: '2026-02-01T00:00:00.000Z'
  }
];

class AuthSessionFacade {
  public async login(email: string, password: string) {
    return await AuthService.login(email, password);
  }

  public async registerCitizen(name: string, email: string, password: string) {
    return await AuthService.registerCitizen({ name, email, password });
  }

  public async registerNgo(data: { name: string; email: string; password: string; organizationName: string; registrationNumber?: string }) {
    return await AuthService.registerNgo(data);
  }

  public async registerVendor(data: { name: string; email: string; password: string; companyName: string; businessType: string; description: string; contactPhone?: string; website?: string; locationLat: number; locationLng: number; address: string; serviceRadius?: number }) {
    return await AuthService.registerVendor(data);
  }

  public async createAdminUser(creatorRole: UserRole, data: { name: string; email: string; password: string; role?: UserRole }) {
    return await AuthService.createAdminUser(creatorRole, data);
  }

  public async getUsers(): Promise<User[]> {
    const list = await UserModel.getAll();
    return list.length > 0 ? list : INITIAL_USERS;
  }
}

export const authSession = new AuthSessionFacade();
