import { NavigatorScreenParams } from '@react-navigation/native';
import { AccountKind } from '../Assets/Types';

export type AuthStackParamList = {
  Role: undefined;
  Login: { account: AccountKind };
  Otp: { mobile: string; account: AccountKind; mode: 'signin' | 'signup'; name?: string; skill?: string };
};

export type ServiceStackParamList = {
  ServicesHome: undefined;
  ServiceDetail: { serviceId: string };
  BookService: { serviceId: string };
  BookingSuccess: { bookingId: string };
};

export type BookingStackParamList = {
  BookingHistory: undefined;
  BookingDetail: { bookingId: string };
};

export type ProviderHomeStackParamList = {
  ProviderHome: undefined;
  ProviderJobDetail: { bookingId: string };
};

export type ProviderServiceStackParamList = {
  ProviderJobs: undefined;
  ProviderJobDetail: { bookingId: string };
};

export type ProviderTabParamList = {
  ProviderHomeTab: NavigatorScreenParams<ProviderHomeStackParamList>;
  ProviderServiceTab: NavigatorScreenParams<ProviderServiceStackParamList>;
  ProviderProfileTab: undefined;
};

export type TabParamList = {
  ServicesTab: NavigatorScreenParams<ServiceStackParamList>;
  BookingsTab: NavigatorScreenParams<BookingStackParamList>;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};
