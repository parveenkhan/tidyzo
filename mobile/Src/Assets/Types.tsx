export type BookingStatus = 'pending' | 'approved' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentMethod = 'upi' | 'card';

export type AccountKind = 'consumer' | 'provider';
export type SessionRole = 'customer' | 'provider';

export interface Customer {
  id: string;
  mobile: string;
  name: string;
  addressLine: string;
  city: string;
  pincode: string;
}

export interface Provider {
  id: string;
  name: string;
  skill: string;
  phone: string;
  city: string;
  rangeKm: number;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
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

export interface Booking {
  id: string;
  customerId: string;
  customerName?: string;
  customerMobile?: string;
  serviceId: string;
  serviceName: string;
  category?: string;
  date: string;
  time: string;
  addressLine: string;
  city: string;
  pincode: string;
  notes: string;
  status: BookingStatus;
  professionalId: string | null;
  professionalName: string | null;
  price: number;
  paymentMethod: PaymentMethod | 'cash';
  paymentStatus: 'paid' | 'unpaid';
  platformFee: number;
  providerAmount: number;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  bookingId: string | null;
  title: string;
  body: string;
  isRead: boolean;
  pushStatus: string;
  createdAt: string;
}

export interface BookingDraft {
  serviceId: string;
  date: string;
  time: string;
  addressLine: string;
  city: string;
  country: string;
  pincode: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}
