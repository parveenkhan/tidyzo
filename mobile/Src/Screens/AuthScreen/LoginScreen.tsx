import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { TextField } from '../../Component/TextField';
import { SelectField } from '../../Component/SelectField';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { Colors } from '../../Assets/Colors';
import { PROVIDER_SKILLS } from '../../Assets/skills';
import { Strings } from '../../Assets/Strings';
import { AuthStackParamList } from '../../Navigation/types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { clearError, requestOtp } from '../../Redux/Actions/Auth.Action';
import { isValidMobile, normalizeMobile } from '../../Utils/validationFunctions';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type Mode = 'signin' | 'signup';

export default function LoginScreen({ navigation, route }: Props) {
  const account = route.params.account;
  const provider = account === 'provider';
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const error = useAppSelector((state) => state.auth.error);
  const requestId = useAppSelector((state) => state.auth.otpRequestId);
  const challenge = useAppSelector((state) => state.auth.challengeMobile);
  const [mode, setMode] = useState<Mode>('signin');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [skill, setSkill] = useState('');
  const [seen, setSeen] = useState(0);
  const pending = useRef<{ mode: Mode; name?: string; skill?: string } | null>(null);
  const normalized = normalizeMobile(mobile);
  const signupReady = name.trim().length >= 2 && (!provider || PROVIDER_SKILLS.includes(skill));

  useEffect(() => {
    navigation.setOptions({ title: mode === 'signup' ? 'Sign up' : 'Sign in' });
  }, [mode, navigation]);

  useEffect(() => {
    if (requestId > seen && challenge === normalized && pending.current) {
      const extra = pending.current;
      setSeen(requestId);
      navigation.navigate('Otp', { mobile: normalized, account, mode: extra.mode, name: extra.name, skill: extra.skill });
    }
  }, [account, requestId, seen, challenge, normalized, navigation]);

  return (
    <Screen edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.body}>
          <Text style={styles.brand}>{Strings.appName}</Text>
          <Text style={styles.title}>{provider ? Strings.providerTitle : Strings.loginTitle}</Text>
          <Text style={styles.subtitle}>{provider ? Strings.providerSubtitle : Strings.loginSubtitle}</Text>
          <Text style={styles.role}>{provider ? 'Service provider' : 'Service consumer'}</Text>
          <View style={styles.modes}>
            {(['signin', 'signup'] as const).map((item) => (
              <Pressable key={item} onPress={() => setMode(item)} style={[styles.mode, mode === item && styles.modeOn]}>
                <Text style={[styles.modeText, mode === item && styles.modeTextOn]}>{item === 'signin' ? Strings.signIn : Strings.signUp}</Text>
              </Pressable>
            ))}
          </View>
          <TextField
            label="Mobile number"
            value={mobile}
            onChangeText={(value) => {
              setMobile(value);
              if (error) dispatch(clearError());
            }}
            keyboardType="phone-pad"
            maxLength={14}
            placeholder="98765 43210"
          />
          {mode === 'signup' ? (
            <>
              <TextField label={Strings.nameLabel} value={name} onChangeText={setName} placeholder={provider ? 'Raju Kumar' : 'Asha'} autoCapitalize="words" />
              {provider ? <SelectField label="Skill" value={skill} placeholder="Select skill" options={PROVIDER_SKILLS} onChange={setSkill} /> : null}
            </>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        <PrimaryButton
          title={mode === 'signup' ? Strings.signUp : Strings.signIn}
          loading={loading}
          disabled={!isValidMobile(normalized) || (mode === 'signup' && !signupReady)}
          onPress={() => {
            pending.current = {
              mode,
              name: mode === 'signup' ? name.trim() : undefined,
              skill: mode === 'signup' && provider ? skill : undefined,
            };
            dispatch(requestOtp({ mobile: normalized }));
          }}
          style={styles.button}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, padding: 24 },
  body: { flex: 1, gap: 14, paddingTop: 24 },
  brand: { color: Colors.primary, fontWeight: '800', letterSpacing: 1 },
  title: { color: Colors.text, fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subtitle: { color: Colors.textSecondary, fontSize: 16, lineHeight: 22 },
  role: { color: Colors.primary, fontWeight: '700' },
  modes: { flexDirection: 'row', gap: 8 },
  mode: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  modeOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeText: { color: Colors.text, fontWeight: '700' },
  modeTextOn: { color: Colors.white },
  error: { color: Colors.danger, fontSize: 14 },
  button: { marginBottom: 12 },
});
