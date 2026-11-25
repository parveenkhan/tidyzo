import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Colors } from '../Assets/Colors';
import { tap } from '../Utils/haptics';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  light?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({ title, onPress, disabled, loading, light, style }: Props) {
  const blocked = disabled || loading;
  return (
    <Pressable
      disabled={blocked}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.btn, light ? styles.light : styles.dark, blocked && styles.disabled, style]}>
      {loading ? <ActivityIndicator color={light ? Colors.primary : Colors.white} /> : <Text style={[styles.label, light && styles.lightLabel]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  dark: { backgroundColor: Colors.primary },
  light: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  disabled: { opacity: 0.55 },
  label: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  lightLabel: { color: Colors.text },
});
