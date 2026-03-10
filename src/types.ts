export interface Lorry {
  id: number;
  lorry_number: string;
  driver_name: string;
  vehicle_type: string;
  date: string;
  status: 'loading' | 'completed';
  total_bags?: number;
  loading_rate: number;
}

export interface FarmerLoad {
  id: number;
  lorry_id: number;
  farmer_name: string;
  bag_count: number;
  labour_title?: string;
  moisture_percent?: number;
  weight_qlt?: number;
  paddy_type?: string;
  area?: string;
}

export interface Labour {
  id: number;
  name: string;
  title_name: string;
}

export interface LorryDetail extends Lorry {
  loads: FarmerLoad[];
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  onboarded: number;
}

export interface MarketEntry {
  id: number;
  name: string;
  price: number;
  unit: string; // e.g. "/qtl"
  change_percent?: number; // e.g. 2.5
  region?: string;
  trend?: number[]; // weekly trend values
  updated_at?: string;
}

