import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ServiceStackParamList } from '../types';
import { pushedScreenOptions, rootScreenOptions } from '../stackOptions';
import HomeScreen from '../../Screens/HomeScreen/HomeScreen';
import ServiceDetailScreen from '../../Screens/ServiceScreen/ServiceDetailScreen';
import BookServiceScreen from '../../Screens/ServiceScreen/BookServiceScreen';
import BookingSuccessScreen from '../../Screens/ServiceScreen/BookingSuccessScreen';

const Stack = createNativeStackNavigator<ServiceStackParamList>();

export default function ServiceStack() {
  return (
    <Stack.Navigator screenOptions={rootScreenOptions}>
      <Stack.Screen name="ServicesHome" component={HomeScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ ...pushedScreenOptions, title: 'Service' }} />
      <Stack.Screen name="BookService" component={BookServiceScreen} options={{ ...pushedScreenOptions, title: 'Book' }} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} options={{ ...pushedScreenOptions, title: 'Booking' }} />
    </Stack.Navigator>
  );
}
