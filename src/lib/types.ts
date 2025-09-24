
export type Driver = {
  id: string;
  created_at?: string;
  name: string;
  address: string | null;
  phone: string | null;
  status: 'Tersedia' | 'Bertugas';
}

export type Vehicle = {
  id: string;
  created_at?: string;
  code: string;
  name: string;
  brand: string;
  type: string | null;
  passengers: number | null;
  transmission: 'Manual' | 'Matic';
  price: number | null;
  fuel: string | null;
  year: number | null;
  rating: number | null;
  dataAiHint: string | null;
  discountPercentage: number | null;
  photo: string | null;
  unitType: 'biasa' | 'khusus' | null;
  stock: number | null;
  status: 'tersedia' | 'dipesan' | 'disewa' | null;
}

export type Testimonial = {
  id: string;
  created_at?: string;
  customerName: string;
  vehicleName: string | null;
  rating: number;
  comment: string | null;
}

export type GalleryItem = {
    id: string;
    created_at?: string;
    url: string;
    vehicleName?: string | null;
}

export type FeatureItem = {
    id: string;
    created_at?: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    dataAiHint: string | null;
}

export type BankAccount = {
    id?: number;
    created_at?: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    logoUrl: string;
}

export type OrderStatus = 'pending' | 'disetujui' | 'tidak disetujui' | 'selesai' | 'dipesan';

export type Order = {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  type: string | null;
  fuel: string | null;
  transmission: 'Manual' | 'Matic' | null;
  service: string | null;
  driver: string | null;
  paymentProof: string | null;
  status: OrderStatus | null;
  paymentMethod: 'QRIS' | 'Transfer Bank' | null;
  total: number | null;
  created_at: string; // ISO 8601 date string
  driverId: string | null;
  vehicleId: string;
  isPartnerUnit: boolean | null;
};
    
export type ContactInfo = {
    id?: number;
    address: string;
    email: string;
    whatsapp: string;
    maps: string;
    mapsDirectionUrl: string | null;
    openingHoursDescription?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    telegram?: string | null;
}

export type TermsContent = {
    id?: number;
    general: string;
    payment: string;
}

export type Promotion = {
    id: string;
    created_at?: string;
    title: string;
    description: string;
    imageUrl: string;
    vehicleId?: string | null;
};
