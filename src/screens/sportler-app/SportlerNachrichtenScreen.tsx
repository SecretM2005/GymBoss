import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Nachricht } from '../../store/nachrichtenStore';
import { useNachrichtenStore } from '../../store/nachrichtenStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAthletenStore } from '../../store/athletenStore';
import { C, useColors, SP, R, FONT } from '../../theme';
import { GBIcon } from '../../components/GBIcon';
import GBAvatar from '../../components/GBAvatar';

const TRAINER_ID   = 't1';
const TRAINER_NAME = 'Trainer';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diffDays === 1) return 'Gestern';
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function Bubble({ msg, isOwn, C }: { msg: Nachricht; isOwn: boolean; C: ReturnType<typeof useColors> }) {
  return (
    <View style={[b.row, isOwn && b.rowOwn]}>
      {!isOwn && (
        <View style={[b.avatar, { backgroundColor: 'rgba(122,191,255,0.18)' }]}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#7ABFFF' }}>T</Text>
        </View>
      )}
      <View style={[b.bubble, { backgroundColor: isOwn ? C.accent : C.surface, borderColor: isOwn ? 'transparent' : C.border }, isOwn && b.bubbleOwn]}>
        <Text style={[b.text, { color: isOwn ? C.accentContrast : C.text }]}>{msg.text}</Text>
        <Text style={[b.time, { color: isOwn ? `${C.accentContrast}80` : C.textDim }]}>{formatTime(msg.datum)}</Text>
      </View>
    </View>
  );
}

const b = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: SP.sm },
  rowOwn:    { flexDirection: 'row-reverse' },
  avatar:    { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble:    { maxWidth: '78%', borderRadius: R.lg, borderWidth: 1, padding: SP.md, gap: 4 },
  bubbleOwn: {},
  text:      { fontSize: FONT.base, lineHeight: 22 },
  time:      { fontSize: 10, fontWeight: '600' },
});

export default function SportlerNachrichtenScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { activeSportlerId } = useSettingsStore();
  const { getSportlerById }  = useAthletenStore();
  const { getNachrichtenForChat, sendNachricht, markAllAsRead } = useNachrichtenStore();

  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const sportler = getSportlerById(activeSportlerId ?? '');
  const myId   = activeSportlerId ?? 's1';
  const myName = sportler?.name ?? 'Sportler';

  const msgs = getNachrichtenForChat(myId, TRAINER_ID);

  useEffect(() => { markAllAsRead(myId); }, [myId]);
  useEffect(() => {
    if (msgs.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 80);
  }, [msgs.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendNachricht({ senderId: myId, senderName: myName, empfaengerId: TRAINER_ID, text: t });
    setText('');
  };

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <View style={[s.trainerAvatar, { backgroundColor: 'rgba(122,191,255,0.18)' }]}>
          <Text style={[s.trainerInitial, { color: '#7ABFFF' }]}>T</Text>
        </View>
        <View>
          <Text style={[s.headerTitle, { color: C.text }]}>Trainer</Text>
          <Text style={[s.headerSub, { color: C.accent }]}>Mein Trainer</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {msgs.length === 0 ? (
          <View style={s.empty}>
            <GBIcon name="message" size={44} color={C.textDim} />
            <Text style={[s.emptyTitle, { color: C.textSub }]}>Noch keine Nachrichten</Text>
            <Text style={[s.emptySub, { color: C.textDim }]}>
              Schreibe deinem Trainer, wenn du Fragen zu deinem Training hast.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={msgs}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: SP.xl, paddingBottom: SP.md }}
            renderItem={({ item }) => (
              <Bubble msg={item} isOwn={item.senderId === myId} C={C} />
            )}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={[s.inputBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <TextInput
            style={[s.input, { backgroundColor: C.surfaceAlt, color: C.text }]}
            placeholder="Nachricht an Trainer…"
            placeholderTextColor={C.textDim}
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: text.trim() ? C.accent : C.surfaceAlt }]}
            onPress={send}
            disabled={!text.trim()}
            activeOpacity={0.8}
          >
            <GBIcon name="chevronRight" size={18} color={text.trim() ? C.accentContrast : C.textDim} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderBottomWidth: 1 },
  trainerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  trainerInitial: { fontSize: FONT.md, fontWeight: '800' },
  headerTitle:    { fontSize: FONT.md, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  headerSub:      { fontSize: FONT.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 1 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SP.md, paddingHorizontal: SP.xl * 2 },
  emptyTitle: { fontSize: FONT.md, fontWeight: '700' },
  emptySub:   { fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: SP.sm, padding: SP.md, borderTopWidth: 1 },
  input:    { flex: 1, borderRadius: R.lg, paddingHorizontal: SP.md, paddingVertical: SP.sm, fontSize: FONT.base, maxHeight: 100 },
  sendBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
