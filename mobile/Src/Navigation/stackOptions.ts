import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Colors } from '../Assets/Colors';

export const rootScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: Colors.background },
};

export const pushedScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerTintColor: Colors.primary,
  headerTitleStyle: { color: Colors.text, fontWeight: '700' },
  headerStyle: { backgroundColor: Colors.background },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: Colors.background },
};
