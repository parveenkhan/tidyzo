import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProviderServiceStackParamList } from '../types';
import { pushedScreenOptions, rootScreenOptions } from '../stackOptions';
import ProviderJobsScreen from '../../Screens/ProviderScreen/ProviderJobsScreen';
import ProviderJobDetailScreen from '../../Screens/ProviderScreen/ProviderJobDetailScreen';

const Stack = createNativeStackNavigator<ProviderServiceStackParamList>();

export default function ProviderServiceStack() {
  return (
    <Stack.Navigator screenOptions={rootScreenOptions}>
      <Stack.Screen name="ProviderJobs" component={ProviderJobsScreen} />
      <Stack.Screen name="ProviderJobDetail" component={ProviderJobDetailScreen} options={{ ...pushedScreenOptions, title: 'Job' }} />
    </Stack.Navigator>
  );
}
