import { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { StatusBadge } from '../../Component/StatusBadge';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { Colors } from '../../Assets/Colors';
import { Booking } from '../../Assets/Types';
import { ProviderServiceStackParamList } from '../../Navigation/types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { fetchProviderJobs, updateProviderJob } from '../../Redux/Reducers/Booking.Reducer';
import { formatDateLabel } from '../../Utils/DateUtils';
import { formatTimeLabel } from '../../Utils/time';

type Props = NativeStackScreenProps<ProviderServiceStackParamList, 'ProviderJobs'>;

function needsDecision(status: string) {
  return status === 'pending' || status === 'assigned';
}

export default function ProviderJobsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const provider = useAppSelector((state) => state.auth.provider);
  const items = useAppSelector((state) => state.bookings.items);
  const saving = useAppSelector((state) => state.bookings.saving);
  const error = useAppSelector((state) => state.bookings.error);

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
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.kicker}>{provider?.skill || 'Service provider'}</Text>
            <Text style={styles.title}>Your jobs</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => navigation.navigate('ProviderJobDetail', { bookingId: item.id })}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.serviceName}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.meta}>{item.customerName} · +91 {item.customerMobile}</Text>
              <Text style={styles.meta}>{formatDateLabel(item.date)} · {formatTimeLabel(item.time)}</Text>
              <Text style={styles.meta}>{item.addressLine}, {item.city}</Text>
              {typeof item.distanceKm === 'number' ? <Text style={styles.meta}>{item.distanceKm} km from your location</Text> : null}
            </Pressable>
            {needsDecision(item.status) ? (
              <View style={styles.actions}>
                <PrimaryButton title="Reject" light disabled={saving} style={styles.action} onPress={() => reject(item)} />
                <PrimaryButton title="Accept" disabled={saving} style={styles.action} onPress={() => dispatch(updateProviderJob({ id: item.id, status: 'accepted' }))} />
              </View>
            ) : null}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<Text style={styles.empty}>{error || 'Jobs appear here after admin assigns them to you.'}</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 32 },
  header: { marginBottom: 16, gap: 4 },
  kicker: { color: Colors.primary, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 30, fontWeight: '800' },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  name: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  action: { flex: 1, height: 44, borderRadius: 22 },
  empty: { color: Colors.textSecondary, marginTop: 8 },
});
