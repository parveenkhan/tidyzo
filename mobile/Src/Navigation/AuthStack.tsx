import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { pushedScreenOptions, rootScreenOptions } from './stackOptions';
import RoleScreen from '../Screens/AuthScreen/RoleScreen';
import LoginScreen from '../Screens/AuthScreen/LoginScreen';
import OtpScreen from '../Screens/AuthScreen/OtpScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...rootScreenOptions, animation: 'fade' }}>
      <Stack.Screen name="Role" component={RoleScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ ...pushedScreenOptions, title: 'Sign in', animation: 'slide_from_right' }} />
      <Stack.Screen name="Otp" component={OtpScreen} options={{ ...pushedScreenOptions, title: 'Verify', animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
