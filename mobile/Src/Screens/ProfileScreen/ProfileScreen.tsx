import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../Component/Screen';
import { TextField } from '../../Component/TextField';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { logout, updateProfile } from '../../Redux/Actions/Auth.Action';

export default function ProfileScreen() {
  const customer = useAppSelector((state) => state.auth.customer);
  const loading = useAppSelector((state) => state.auth.loading);
  const error = useAppSelector((state) => state.auth.error);
  const dispatch = useAppDispatch();
  const [name, setName] = useState(customer?.name || '');
  const [addressLine, setAddress] = useState(customer?.addressLine || '');
  const [city, setCity] = useState(customer?.city || '');
  const [pincode, setPincode] = useState(customer?.pincode || '');
  const [saved, setSaved] = useState(false);

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.body}>
          <Text style={styles.title}>{Strings.profile}</Text>
          <Text style={styles.mobile}>+91 {customer?.mobile}</Text>
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Address" value={addressLine} onChangeText={setAddress} />
          <TextField label="City" value={city} onChangeText={setCity} />
          <TextField label="Postal code" value={pincode} onChangeText={setPincode} autoCapitalize="characters" maxLength={12} placeholder="560025" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saved ? <Text style={styles.saved}>Saved</Text> : null}
        </View>
        <View style={styles.actions}>
          <PrimaryButton
            title={Strings.save}
            loading={loading}
            disabled={name.trim().length < 2}
            onPress={() => {
              setSaved(true);
              dispatch(updateProfile({ name: name.trim(), addressLine: addressLine.trim(), city: city.trim(), pincode: pincode.trim() }));
            }}
          />
          <PrimaryButton title={Strings.logout} light onPress={() => dispatch(logout())} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, padding: 20 },
  body: { flex: 1, gap: 12 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.text },
  mobile: { color: Colors.textSecondary, marginBottom: 8 },
  error: { color: Colors.danger },
  saved: { color: Colors.primary, fontWeight: '700' },
  actions: { gap: 10, marginBottom: 8 },
});
