import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';

export default function SplashScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.mark}>TZ</Text>
      <Text style={styles.title}>{Strings.appName}</Text>
      <Text style={styles.subtitle}>Home services, sorted.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.white,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 72,
    fontSize: 28,
    fontWeight: '800',
    overflow: 'hidden',
  },
  title: { color: Colors.white, fontSize: 32, fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#D7EBE4', fontSize: 16 },
});
