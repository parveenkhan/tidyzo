import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';
import { AuthStackParamList } from '../../Navigation/types';
import { AccountKind } from '../../Assets/Types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Role'>;

const choices: Array<{ account: AccountKind; title: string; copy: string }> = [
  { account: 'consumer', title: 'Service consumer', copy: 'Book a visit for your home.' },
  { account: 'provider', title: 'Service provider', copy: 'See jobs assigned to you and update them.' },
];

export default function RoleScreen({ navigation }: Props) {
  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.brand}>{Strings.appName}</Text>
        <Text style={styles.title}>How will you use TidyZo?</Text>
        {choices.map((choice) => (
          <Pressable key={choice.account} style={styles.card} onPress={() => navigation.navigate('Login', { account: choice.account })}>
            <Text style={styles.cardTitle}>{choice.title}</Text>
            <Text style={styles.cardCopy}>{choice.copy}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 24, paddingTop: 36, gap: 14 },
  brand: { color: Colors.primary, fontWeight: '800', letterSpacing: 1 },
  title: { color: Colors.text, fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: 8 },
  card: { backgroundColor: Colors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  cardTitle: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  cardCopy: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21 },
});
