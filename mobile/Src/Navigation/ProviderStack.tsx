import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ProviderTabParamList } from './types';
import ProviderHomeStack from './Stacks/ProviderHomeStack';
import ProviderServiceStack from './Stacks/ProviderServiceStack';
import ProviderProfileScreen from '../Screens/ProviderScreen/ProviderProfileScreen';
import { Colors } from '../Assets/Colors';

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export default function ProviderStack() {
  return (
    <View style={styles.root}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border },
        }}>
        <Tab.Screen
          name="ProviderHomeTab"
          component={ProviderHomeStack}
          options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="ProviderServiceTab"
          component={ProviderServiceStack}
          options={{ title: 'Service', tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="ProviderProfileTab"
          component={ProviderProfileScreen}
          options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
