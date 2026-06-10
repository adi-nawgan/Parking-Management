// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Vehicle {
  _id?: string;
  plate: string;
  vehicleType: string;
  color: string;
}

export interface Resident {
  _id: string;
  ownerName: string;
  flatNumber: string;
  buildingNumber: number;
  phone: string;
  type: 'resident' | 'tenant';
  vehicles: Vehicle[];
  isParked?: boolean;
  parkedVehicles?: string[];
}

export interface VisitorDetails {
  name: string;
  flatVisited: string;
  purpose: string;
}

export interface ParkedVehicle {
  _id: string;
  plate: string;
  type: 'resident' | 'tenant' | 'visitor';
  flatNumber: string;
  buildingNumber: number;
  entryTime: string;
  isOverstay?: boolean;
  residentId?: { ownerName: string } | null;
  visitorDetails?: VisitorDetails | null;
}

export interface ParkingLog {
  _id: string;
  plate: string;
  type: 'resident' | 'tenant' | 'visitor';
  flatNumber: string;
  buildingNumber: number;
  entryTime: string;
  exitTime: string;
  duration: number;
  residentId?: { ownerName: string } | null;
  visitorDetails?: VisitorDetails | null;
}

export interface VisitorLog {
  _id: string;
  plate: string;
  type: 'visitor';
  flatNumber: string;
  buildingNumber: number;
  entryTime: string;
  exitTime?: string;
  duration?: number;
  isCurrentlyInside: boolean;
  isRepeatVisitor: boolean;
  totalVisits?: number;
  visitorDetails?: VisitorDetails | null;
}

export interface PlateSearchMatch {
  vehicle: Vehicle;
  residentId: string;
  ownerName: string;
  flatNumber: string;
  buildingNumber: number;
  type: 'resident' | 'tenant';
}

export interface DashboardSummary {
  totalCapacity: number;
  overflowLimit: number;
  currentlyParkedCount: number;
  availableSpots: number;
  state: 'normal' | 'overflow' | 'full';
  currentlyParkedList: ParkedVehicle[];
}

export interface SystemSettings {
  totalCapacity: number;
  overflowLimit: number;
  overstayLimit: number;
  adminEmail: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AdminUser {
  _id: string;
  email: string;
}

export interface MemberUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  buildingNumber: number;
  flatNumber: string;
}

export type UserRole = 'admin' | 'member';

export interface AuthContextType {
  admin: AdminUser | null;
  member: MemberUser | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  memberLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  unifiedLogin: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; message?: string }>;
  memberRegister: (data: { name: string; email: string; password: string; phone: string; buildingNumber: number; flatNumber: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

export interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

// ─── Member / Report Types ────────────────────────────────────────────────────

export type ReportType = 'wrongly_parked' | 'took_extra_space' | 'vehicle_damage';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReportLocation {
  buildingNumber: number;
  description?: string;
}

export interface ParkingReport {
  _id: string;
  reportedBy: { _id: string; name: string; email: string; phone: string; buildingNumber: number; flatNumber: string };
  plate?: string;
  reportType: ReportType;
  description: string;
  photoUrl?: string;
  location: ReportLocation;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: { _id: string; email: string };
}

export interface MemberParkingSummary {
  totalCapacity: number;
  currentlyParkedCount: number;
  availableSpots: number;
}

export interface PlateOwnerMatch {
  plate: string;
  ownerName: string;
  phone: string;
  buildingNumber: number;
}
