export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  durationMin: number;
  imageUrl: string;
  active: boolean;
}

export interface ServiceInput {
  name: string;
  category: string;
  description: string;
  price: number;
  durationMin: number;
  imageUrl: string;
  active: boolean;
}

export interface Professional {
  id: string;
  name: string;
  skill: string;
  phone: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName?: string;
  customerMobile?: string;
  serviceName: string;
  date: string;
  time: string;
  addressLine: string;
  city: string;
  pincode: string;
  notes: string;
  status: string;
  professionalId: string | null;
  professionalName: string | null;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  addressLine: string;
  city: string;
  bookingCount: number;
}

export interface Notice {
  id: string;
  customerId: string;
  customerName?: string;
  customerMobile?: string;
  bookingId: string | null;
  title: string;
  body: string;
  pushStatus: string;
  createdAt: string;
}

export interface Stats {
  customers: number;
  bookings: number;
  pending: number;
  today: number;
}
