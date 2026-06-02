import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useColors, SP, R, FONT } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();

  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [role, setRole]         = useState<'trainer' | 'sportler'>('trainer');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Fehlende Angaben', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Login fehlgeschlagen', error.message);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Fehlende Angaben', 'Bitte alle Felder ausfüllen.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Passwort zu kurz', 'Mindestens 6 Zeichen erforderlich.');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      setLoading(false);
      Alert.alert('Registrierung fehlgeschlagen', error?.message ?? 'Unbekannter Fehler');
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      role,
      name: name.trim(),
      initials: makeInitials(name),
    });

    setLoading(false);
    if (profileError) Alert.alert('Profil-Fehler', profileError.message);
    // Auth state change listener in App.tsx handles navigation
  };

  const isLogin = mode === 'login';

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoArea}>
            <View style={[s.logoIcon, { backgroundColor: C.accent }]}>
              <GBIcon name="dumbbell" size={32} color={C.accentContrast} />
            </View>
            <Text style={[s.appName, { color: C.text }]}>GymBoss</Text>
            <Text style={[s.appSub, { color: C.textMuted }]}>
              {isLogin ? 'Willkommen zurück' : 'Konto erstellen'}
            </Text>
          </View>

          {/* Mode toggle */}
          <View style={[s.modeToggle, { backgroundColor: C.surface, borderColor: C.border }]}>
            {(['login', 'register'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.modeBtn, mode === m && { backgroundColor: C.accent }]}
                onPress={() => setMode(m)}
                activeOpacity={0.8}
              >
                <Text style={[s.modeBtnText, { color: mode === m ? C.accentContrast : C.textMuted }]}>
                  {m === 'login' ? 'Anmelden' : 'Registrieren'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Role picker (register only) */}
          {!isLogin && (
            <View style={s.roleRow}>
              {(['trainer', 'sportler'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    s.roleBtn,
                    { borderColor: role === r ? C.accent : C.border, backgroundColor: role === r ? 'rgba(203,255,62,0.08)' : C.surface },
                  ]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}
                >
                  <GBIcon name={r === 'trainer' ? 'users' : 'user'} size={20} color={role === r ? C.accent : C.textMuted} />
                  <Text style={[s.roleBtnText, { color: role === r ? C.accent : C.textMuted }]}>
                    {r === 'trainer' ? 'Trainer' : 'Sportler'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Name (register only) */}
          {!isLogin && (
            <Field label="Vollständiger Name" value={name} onChangeText={setName}
              placeholder="Max Mustermann" C={C} />
          )}

          <Field label="E-Mail" value={email} onChangeText={setEmail}
            placeholder="max@example.com" keyboardType="email-address" autoCapitalize="none" C={C} />

          <Field label="Passwort" value={password} onChangeText={setPassword}
            placeholder="Mindestens 6 Zeichen" secureTextEntry C={C} />

          {/* Info for sportler */}
          {!isLogin && role === 'sportler' && (
            <View style={[s.infoBox, { backgroundColor: 'rgba(122,191,255,0.08)', borderColor: 'rgba(122,191,255,0.20)' }]}>
              <GBIcon name="info" size={16} color="#7ABFFF" />
              <Text style={[s.infoText, { color: '#7ABFFF' }]}>
                Dein Trainer verknüpft dein Konto nach der Registrierung in der App.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={C.accentContrast} />
            ) : (
              <Text style={[s.submitBtnText, { color: C.accentContrast }]}>
                {isLogin ? 'Anmelden' : 'Konto erstellen'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.switchMode}
            onPress={() => setMode(isLogin ? 'register' : 'login')}
            activeOpacity={0.7}
          >
            <Text style={[s.switchModeText, { color: C.textMuted }]}>
              {isLogin ? 'Noch kein Konto? ' : 'Bereits registriert? '}
              <Text style={{ color: C.accent, fontWeight: '700' }}>
                {isLogin ? 'Registrieren' : 'Anmelden'}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder,
  keyboardType, autoCapitalize, secureTextEntry, C,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: any; autoCapitalize?: any;
  secureTextEntry?: boolean; C: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, { color: C.textMuted }]}>{label}</Text>
      <TextInput
        style={[s.fieldInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={C.textDim} keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        secureTextEntry={secureTextEntry} autoCorrect={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { padding: SP.xl, gap: SP.md, paddingBottom: SP.xxxl ?? 48 },

  logoArea: { alignItems: 'center', gap: SP.md, paddingVertical: SP.xl },
  logoIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  appName:  { fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  appSub:   { fontSize: FONT.base, fontWeight: '500' },

  modeToggle:  { flexDirection: 'row', borderRadius: R.lg, borderWidth: 1, padding: 4, gap: 4 },
  modeBtn:     { flex: 1, paddingVertical: SP.md, borderRadius: R.md, alignItems: 'center' },
  modeBtnText: { fontSize: FONT.base, fontWeight: '700' },

  roleRow:     { flexDirection: 'row', gap: SP.sm },
  roleBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, borderRadius: R.lg, borderWidth: 1.5, paddingVertical: SP.md },
  roleBtnText: { fontSize: FONT.base, fontWeight: '700' },

  field:       { gap: 6 },
  fieldLabel:  { fontSize: FONT.sm, fontWeight: '600', letterSpacing: 0.4 },
  fieldInput:  { borderRadius: R.lg, borderWidth: 1, paddingHorizontal: SP.md, paddingVertical: 14, fontSize: FONT.base },

  infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  infoText: { flex: 1, fontSize: FONT.sm, lineHeight: 20, fontWeight: '500' },

  submitBtn:     { borderRadius: R.full, paddingVertical: SP.lg, alignItems: 'center', marginTop: SP.sm },
  submitBtnText: { fontSize: FONT.md, fontWeight: '700', letterSpacing: -0.2 },

  switchMode:     { alignItems: 'center', paddingVertical: SP.sm },
  switchModeText: { fontSize: FONT.base },
});
