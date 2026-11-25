import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../Component/Screen';
import { ServiceCard } from '../../Component/ServiceCard';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';
import { ServiceStackParamList } from '../../Navigation/types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { fetchServices } from '../../Redux/Actions/Service.Action';

type Props = NativeStackScreenProps<ServiceStackParamList, 'ServicesHome'>;

export default function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const customer = useAppSelector((state) => state.auth.customer);
  const { items, loading, error } = useAppSelector((state) => state.services);
  const [category, setCategory] = useState('All');

  useFocusEffect(useCallback(() => {
    dispatch(fetchServices());
  }, [dispatch]));

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const visible = category === 'All' ? items : items.filter((item) => item.category === category);

  useEffect(() => {
    if (!categories.includes(category)) setCategory('All');
  }, [categories, category]);

  return (
    <Screen>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.kicker}>Welcome back</Text>
            <Text style={styles.hello}>Hello,</Text>
            <Text style={styles.name}>{customer?.name || 'there'}</Text>
            <Text style={styles.subtitle}>Book a trusted service for your home.</Text>
            <Text style={styles.title}>{Strings.services}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chips}>
              {categories.map((item) => {
                const selected = category === item;
                return (
                  <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, selected && styles.chipOn]}>
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{item}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <ServiceCard service={item} onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.empty}>No services yet.</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  header: { marginBottom: 18 },
  kicker: { color: Colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  hello: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 10 },
  name: { color: Colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.4, marginTop: 2 },
  subtitle: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 6 },
  title: { color: Colors.text, fontSize: 20, fontWeight: '800', marginTop: 22 },
  chipScroll: { marginHorizontal: -20, marginTop: 12 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  chipTextOn: { color: Colors.white },
  error: { color: Colors.danger, marginTop: 10 },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 24 },
});
