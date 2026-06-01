import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MehrStackParamList } from '../../types';
import { useNachrichtenStore, Nachricht } from '../../store/nachrichtenStore';
import { useAthletenStore } from '../../store/athletenStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';
import { GBIcon } from '../../components/GBIcon';
import GBAvatar from '../../components/GBAvatar';

type Props = {
  navigation: StackNavigationProp<MehrStackParamList, 'Nachrichten'>;
  route: RouteProp<MehrStackParamList, 'Nachrichten'>;
};

const TRAINER_NAME = 'Trainer';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diffDays === 1) return 'Gestern';
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function ChatBubble({ msg, isOwn, C }: { msg: Nachricht; isOwn: boolean; C: ReturnType<typeof useColors> }) {
  return (
    <View style={[b.row, isOwn && b.rowOwn]}>
      {!isOwn && (
        <View style={[b.avatar, { backgroundColor: 'rgba(122,191,255,0.2)' }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#7ABFFF' }}>
            {msg.senderName.charAt(0)}
          </Text>
        </View>
      )}
      <View style={[b.bubble, { backgroundColor: isOwn ? C.accent : C.surface, borderColor: C.border }, isOwn && b.bubbleOwn]}>
        <Text style={[b.text, { color: isOwn ? C.accentContrast : C.text }]}>{msg.text}</Text>
        <Text style={[b.time, { color: isOwn ? `${C.accentContrast}99` : C.textDim }]}>
          {formatTime(msg.datum)}
        </Text>
      </View>
    </View>
  );
}

const b = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-end', gap: SP.sm, marginBottom: SP.sm },
  rowOwn:   { flexDirection: 'row-reverse' },
  avatar:   { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble:   { maxWidth: '75%', borderRadius: R.lg, borderWidth: 1, padding: SP.md, gap: 4 },
  bubbleOwn: { borderColor: 'transparent' },
  text:     { fontSize: FONT.base, lineHeight: 22 },
  time:     { fontSize: 10, fontWeight: '600' },
});

function ConversationList({ navigation, C }: { navigation: Props['navigation']; C: ReturnType<typeof useColors> }) {
  const { nachrichten } = useNachrichtenStore();
  const { sportler } = useAthletenStore();
  const trainerId = useSettingsStore((s) => s.trainerId);

  const conversations = sportler.map((sp) => {
    const spId = sp.profileId;
    const msgs = spId
      ? nachrichten.filter(
          (m) =>
            (m.senderId === spId && m.empfaengerId === trainerId) ||
            (m.senderId === trainerId && m.empfaengerId === spId),
        ).sort((a, b) => b.datum.localeCompare(a.datum))
      : [];
    const last = msgs[0];
    const unread = spId
      ? nachrichten.filter((m) => m.empfaengerId === trainerId && m.senderId === spId && !m.gelesen).length
      : 0;
    return { sp, last, unread };
  });

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.sp.id}
      contentContainerStyle={{ padding: SP.xl, gap: SP.sm }}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 60, gap: SP.md }}>
          <GBIcon name="message" size={44} color={C.textDim} />
          <Text style={{ fontSize: FONT.md, fontWeight: '700', color: C.textSub }}>Keine Gespräche</Text>
          <Text style={{ fontSize: FONT.sm, color: C.textDim, textAlign: 'center' }}>
            Wähle einen Sportler aus, um eine Nachricht zu senden.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[conv.row, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => item.sp.profileId && navigation.navigate('Nachrichten', { chatPartnerId: item.sp.profileId, chatPartnerName: item.sp.name })}
          disabled={!item.sp.profileId}
          activeOpacity={0.75}
        >
          <GBAvatar name={item.sp.name} initials={item.sp.initials} size={44} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[conv.name, { color: C.text }]}>{item.sp.name}</Text>
            {!item.sp.profileId ? (
              <Text style={[conv.preview, { color: C.textDim, fontStyle: 'italic' }]}>Kein App-Konto</Text>
            ) : item.last ? (
              <Text style={[conv.preview, { color: C.textDim }]} numberOfLines={1}>
                {item.last.senderId === trainerId ? 'Du: ' : ''}{item.last.text}
              </Text>
            ) : (
              <Text style={[conv.preview, { color: C.textDim, fontStyle: 'italic' }]}>Noch keine Nachrichten</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {item.last && <Text style={[conv.time, { color: C.textDim }]}>{formatTime(item.last.datum)}</Text>}
            {item.unread > 0 && (
              <View style={[conv.badge, { backgroundColor: C.accent }]}>
                <Text style={[conv.badgeText, { color: C.accentContrast }]}>{item.unread}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const conv = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: SP.md, borderRadius: R.xl, borderWidth: 1, padding: SP.md },
  name:      { fontSize: FONT.base, fontWeight: '700' },
  preview:   { fontSize: FONT.sm },
  time:      { fontSize: FONT.xs, fontWeight: '600' },
  badge:     { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontSize: 10, fontWeight: '800' },
});

function ChatView({
  chatPartnerId, chatPartnerName, navigation, C,
}: { chatPartnerId: string; chatPartnerName: string; navigation: Props['navigation']; C: ReturnType<typeof useColors> }) {
  const { trainerId } = useSettingsStore();
  const { user } = useAuthStore();
  const { getNachrichtenForChat, sendNachricht, markAllAsRead } = useNachrichtenStore();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const myId   = user?.id ?? trainerId;
  const myName = TRAINER_NAME;
  const msgs   = getNachrichtenForChat(myId, chatPartnerId);

  useEffect(() => {
    markAllAsRead(myId);
  }, []);

  useEffect(() => {
    if (msgs.length > 0) setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [msgs.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendNachricht({
      senderId:     myId,
      senderName:   myName,
      empfaengerId: chatPartnerId,
      text: t,
    });
    setText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: SP.xl, paddingBottom: SP.md }}
        renderItem={({ item }) => (
          <ChatBubble msg={item} isOwn={item.senderId === myId} C={C} />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />
      <View style={[inp.bar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        <TextInput
          style={[inp.input, { backgroundColor: C.surfaceAlt, color: C.text }]}
          placeholder="Nachricht schreiben…"
          placeholderTextColor={C.textDim}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[inp.sendBtn, { backgroundColor: text.trim() ? C.accent : C.surfaceAlt }]}
          onPress={send}
          disabled={!text.trim()}
          activeOpacity={0.8}
        >
          <GBIcon name="chevronRight" size={18} color={text.trim() ? C.accentContrast : C.textDim} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const inp = StyleSheet.create({
  bar:     { flexDirection: 'row', alignItems: 'flex-end', gap: SP.sm, padding: SP.md, borderTopWidth: 1 },
  input:   { flex: 1, borderRadius: R.lg, paddingHorizontal: SP.md, paddingVertical: SP.sm, fontSize: FONT.base, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

export default function NachrichtenScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const params = route.params;
  const chatPartnerId   = params?.chatPartnerId;
  const chatPartnerName = params?.chatPartnerName ?? 'Gespräch';

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <View style={[s.topBar, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.iconBtn, { backgroundColor: C.surface }]}
          activeOpacity={0.7}
        >
          <GBIcon name="chevronLeft" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={[s.tileIcon, { backgroundColor: 'rgba(122,191,255,0.12)' }]}>
          <GBIcon name="message" size={18} color="#7ABFFF" />
        </View>
        <Text style={[s.headerTitle, { color: C.text }]}>
          {chatPartnerId ? chatPartnerName : 'Nachrichten'}
        </Text>
      </View>

      {chatPartnerId ? (
        <ChatView
          chatPartnerId={chatPartnerId}
          chatPartnerName={chatPartnerName}
          navigation={navigation}
          C={C}
        />
      ) : (
        <ConversationList navigation={navigation} C={C} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  topBar:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderBottomWidth: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: -0.4 },
});
