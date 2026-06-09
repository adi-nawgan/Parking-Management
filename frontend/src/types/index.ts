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

export interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

export interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}
