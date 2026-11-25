import { StyleSheet, Text, View } from 'react-native';
import { Colors, StatusColors } from '../Assets/Colors';
import { formatStatus } from '../Utils/CommonFunction';

export function StatusBadge({ status }: { status: string }) {
  const color = StatusColors[status] || Colors.textSecondary;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.label, { color }]}>{formatStatus(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
