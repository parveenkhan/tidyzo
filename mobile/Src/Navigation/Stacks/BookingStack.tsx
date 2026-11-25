import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookingStackParamList } from '../types';
import { pushedScreenOptions, rootScreenOptions } from '../stackOptions';
import BookingHistoryScreen from '../../Screens/BookingScreen/BookingHistoryScreen';
import BookingDetailScreen from '../../Screens/BookingScreen/BookingDetailScreen';

const Stack = createNativeStackNavigator<BookingStackParamList>();

export default function BookingStack() {
  return (
    <Stack.Navigator screenOptions={rootScreenOptions}>
      <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ ...pushedScreenOptions, title: 'Booking' }} />
    </Stack.Navigator>
  );
}
