import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProviderHomeStackParamList } from '../types';
import { pushedScreenOptions, rootScreenOptions } from '../stackOptions';
import ProviderHomeScreen from '../../Screens/ProviderScreen/ProviderHomeScreen';
import ProviderJobDetailScreen from '../../Screens/ProviderScreen/ProviderJobDetailScreen';

const Stack = createNativeStackNavigator<ProviderHomeStackParamList>();

export default function ProviderHomeStack() {
  return (
    <Stack.Navigator screenOptions={rootScreenOptions}>
      <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} />
      <Stack.Screen name="ProviderJobDetail" component={ProviderJobDetailScreen} options={{ ...pushedScreenOptions, title: 'Job' }} />
    </Stack.Navigator>
  );
}
