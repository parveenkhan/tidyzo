import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { TextField } from '../../Component/TextField';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';
import { AuthStackParamList } from '../../Navigation/types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { requestOtp, verifyOtp } from '../../Redux/Actions/Auth.Action';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export default function OtpScreen({ route }: Props) {
  const { mobile, account, mode, name, skill } = route.params;
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const error = useAppSelector((state) => state.auth.error);
  const debugOtp = useAppSelector((state) => state.auth.debugOtp);
  const [otp, setOtp] = useState('');

  return (
    <Screen edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.body}>
          <Text style={styles.title}>{Strings.otpTitle}</Text>
          <Text style={styles.subtitle}>Sent to +91 {mobile}</Text>
          {debugOtp ? (
            <View style={styles.dev}>
              <Text style={styles.devLabel}>Development code</Text>
              <Text style={styles.devCode}>{debugOtp}</Text>
            </View>
          ) : null}
          <TextField label="6-digit code" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="••••••" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => dispatch(requestOtp({ mobile }))}>
            <Text style={styles.resend}>Resend code</Text>
          </Pressable>
        </View>
        <PrimaryButton
          title={mode === 'signup' ? Strings.signUp : Strings.signIn}
          loading={loading}
          disabled={otp.length !== 6}
          onPress={() => dispatch(verifyOtp({
            mobile,
            otp,
            account,
            intent: mode,
            name: mode === 'signup' ? name : undefined,
            skill: mode === 'signup' ? skill : undefined,
          }))}
          style={styles.button}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, padding: 24 },
  body: { flex: 1, gap: 14, paddingTop: 12 },
  title: { color: Colors.text, fontSize: 32, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 16 },
  dev: { backgroundColor: Colors.accentSoft, borderRadius: 14, padding: 14 },
  devLabel: { color: '#8A5A00', fontSize: 12, fontWeight: '700' },
  devCode: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 4, marginTop: 4 },
  error: { color: Colors.danger },
  resend: { color: Colors.primary, fontWeight: '700' },
  button: { marginBottom: 12 },
});
