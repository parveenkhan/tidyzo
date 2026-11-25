import { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { StatusBadge } from '../../Component/StatusBadge';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { Colors } from '../../Assets/Colors';
import { Booking } from '../../Assets/Types';
import { ProviderHomeStackParamList } from '../../Navigation/types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { fetchProviderJobs, updateProviderJob } from '../../Redux/Reducers/Booking.Reducer';
import { formatDateLabel } from '../../Utils/DateUtils';
import { formatTimeLabel } from '../../Utils/time';

type Props = NativeStackScreenProps<ProviderHomeStackParamList, 'ProviderHome'>;

function needsDecision(status: string) {
  return status === 'pending' || status === 'assigned';
}

export default function ProviderHomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const provider = useAppSelector((state) => state.auth.provider);
  const items = useAppSelector((state) => state.bookings.items);
  const saving = useAppSelector((state) => state.bookings.saving);
  const error = useAppSelector((state) => state.bookings.error);
  const waiting = items.filter((item) => needsDecision(item.status));
  const accepted = items.filter((item) => item.status === 'accepted').length;
  const active = items.filter((item) => item.status === 'in_progress').length;

  useFocusEffect(useCallback(() => {
    dispatch(fetchProviderJobs());
  }, [dispatch]));

  const reject = (booking: Booking) => {
    Alert.alert('Reject this job?', 'It leaves your list so another professional can take it.', [
      { text: 'Keep job', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => dispatch(updateProviderJob({ id: booking.id, status: 'rejected' })) },
    ]);
  };

  return (
    <Screen>
      <FlatList
        data={waiting}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.kicker}>{provider?.skill || 'Service provider'}</Text>
            <Text style={styles.hello}>Hello,</Text>
            <Text style={styles.name}>{provider?.name || 'there'}</Text>
            <Text style={styles.subtitle}>
              {provider?.city && provider.rangeKm
                ? `Showing ${provider.skill} jobs within ${provider.rangeKm} km of ${provider.city}.`
                : 'Set your city and range in Profile to receive nearby jobs.'}
            </Text>
            <View style={styles.stats}>
              <Stat label="New" value={waiting.length} />
              <Stat label="Accepted" value={accepted} />
              <Stat label="Active" value={active} />
            </View>
            <Text style={styles.section}>New jobs</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => navigation.navigate('ProviderJobDetail', { bookingId: item.id })}>
              <View style={styles.row}>
                <Text style={styles.cardName}>{item.serviceName}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.meta}>{item.customerName} · {formatDateLabel(item.date)} · {formatTimeLabel(item.time)}</Text>
              <Text style={styles.meta}>{item.addressLine}, {item.city}</Text>
              {typeof item.distanceKm === 'number' ? <Text style={styles.meta}>{item.distanceKm} km from your location</Text> : null}
            </Pressable>
            <View style={styles.actions}>
              <PrimaryButton title="Reject" light disabled={saving} style={styles.action} onPress={() => reject(item)} />
              <PrimaryButton title="Accept" disabled={saving} style={styles.action} onPress={() => dispatch(updateProviderJob({ id: item.id, status: 'accepted' }))} />
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<Text style={styles.empty}>{error || 'Jobs in your range show up here. Accept or reject them from this list.'}</Text>}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  header: { marginBottom: 8 },
  kicker: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  hello: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 10 },
  name: { color: Colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 6 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  stat: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  statValue: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 2 },
  section: { color: Colors.text, fontSize: 18, fontWeight: '800', marginTop: 22, marginBottom: 12 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  action: { flex: 1, height: 44, borderRadius: 22 },
  empty: { color: Colors.textSecondary },
});
