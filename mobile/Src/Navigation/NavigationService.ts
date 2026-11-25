import { createNavigationContainerRef } from '@react-navigation/native';
import { TabParamList } from './types';

export const navigationRef = createNavigationContainerRef<TabParamList>();

export function openBooking(bookingId: string) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('BookingsTab', { screen: 'BookingDetail', params: { bookingId } });
}
