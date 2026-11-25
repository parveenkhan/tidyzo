import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';
import { ServiceStackParamList } from '../../Navigation/types';
import { useAppSelector } from '../../Redux/hooks';
import { inr } from '../../Utils/CommonFunction';

type Props = NativeStackScreenProps<ServiceStackParamList, 'ServiceDetail'>;

export default function ServiceDetailScreen({ route, navigation }: Props) {
  const service = useAppSelector((state) => state.services.items.find((item) => item.id === route.params.serviceId));
  if (!service) {
    return (
      <Screen edges={[]}>
        <View style={styles.missing}><Text>This service is no longer listed.</Text></View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.category}>{service.category}</Text>
          <Text style={styles.title}>{service.name}</Text>
          <Text style={styles.price}>{inr(service.price)} · {service.durationMin} min</Text>
          <Text style={styles.body}>{service.description}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton title={Strings.book} onPress={() => navigation.navigate('BookService', { serviceId: service.id })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 8,
  },
  category: { color: Colors.primary, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  price: { color: Colors.textSecondary, fontSize: 16 },
  body: { color: Colors.text, fontSize: 16, lineHeight: 24, marginTop: 8 },
  footer: { padding: 20 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
