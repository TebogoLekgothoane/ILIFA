import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { station } from '@/data/pastport';
import { IconButton, ui } from '@/components/PastportUI';

type Message = { id: string; role: 'guide' | 'user'; text: string };

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'guide', text: 'You are standing at one of East London’s historic landmarks. Ask me what happened here, who used this building, or what this place looked like in another time.' },
  ]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    setInput('');
    setMessages((current) => [...current, { id: `${Date.now()}-u`, role: 'user', text: trimmed }, { id: `${Date.now()}-a`, role: 'guide', text: answerFor(trimmed) }]);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 13 }]}><IconButton name="arrow-left" onPress={() => router.back()} /><View style={styles.headerCenter}><Text style={styles.headerEyebrow}>CONTEXTUAL GUIDE</Text><Text style={styles.headerTitle}>Ask PASTPORT</Text></View><View style={styles.guideDot} /></View>
      <ScrollView style={styles.messages} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.context}><Feather name="map-pin" size={13} color={ui.accent} /><Text style={styles.contextText}>{station.name} · 1920 view</Text><View style={styles.contextDivider} /><Text style={styles.contextText}>Documented + reconstructed</Text></View>
        {messages.map((message) => <View key={message.id} style={[styles.messageRow, message.role === 'user' && styles.userRow]}><View style={[styles.messageBubble, message.role === 'user' ? styles.userBubble : styles.guideBubble]}>{message.role === 'guide' ? <Text style={styles.messageLabel}>PASTPORT GUIDE</Text> : null}<Text style={[styles.messageText, message.role === 'user' && styles.userText]}>{message.text}</Text></View></View>)}
        <Text style={styles.sourceNote}>Historical sources are limited on some details. PASTPORT separates documented history from AI reconstruction.</Text>
      </ScrollView>
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}><View style={styles.inputWrap}><TextInput value={input} onChangeText={setInput} onSubmitEditing={() => ask(input)} placeholder="Ask what happened here…" placeholderTextColor={ui.mutedForeground} style={styles.input} returnKeyType="send" /><Pressable onPress={() => ask(input)} style={styles.send}><Feather name="arrow-up" size={17} color="#0B0A13" /></Pressable></View><View style={styles.suggestions}><Suggestion label="What happened here?" onPress={() => ask('What happened here?')} /><Suggestion label="Show me something interesting" onPress={() => ask('Show me something interesting')} /></View></View>
    </KeyboardAvoidingView>
  );
}

function Suggestion({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.suggestion}><Text style={styles.suggestionText}>{label}</Text></Pressable>; }
function answerFor(question: string) { const normalized = question.toLowerCase(); if (normalized.includes('interesting')) return 'The station was more than a stop. It was a threshold between the coast and the interior, carrying people, letters, goods, and news into a changing Eastern Cape. This is documented context; the people and vehicle you see are AI-generated reconstructions based on available sources.'; if (normalized.includes('look') || normalized.includes('1950')) return 'The 1950s view would have been busier and more industrial, with post-war rail travel shaping the rhythm of the station. Historical sources are limited on the exact street scene, so that layer is shown as a reconstruction rather than a verified photograph.'; return 'Rail connected East London to a much larger network, turning this station into a place where local life met national movement. The 1920 scene is an AI-generated reconstruction based on available historical sources, not a surviving photograph.'; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.background },
  header: { paddingHorizontal: 18, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: ui.border },
  headerCenter: { alignItems: 'center' },
  headerEyebrow: { color: ui.accent, fontSize: 8, letterSpacing: 1.4, fontWeight: '700' },
  headerTitle: { color: ui.foreground, fontSize: 18, fontWeight: '700', marginTop: 4 },
  guideDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#78D6A2' },
  messages: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  context: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#17152D', borderRadius: 12, marginBottom: 21, flexWrap: 'wrap', justifyContent: 'center' },
  contextText: { color: ui.mutedForeground, fontSize: 9 },
  contextDivider: { width: 1, height: 11, backgroundColor: ui.border },
  messageRow: { flexDirection: 'row', marginBottom: 14 },
  userRow: { justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '88%', padding: 15, borderRadius: 20 },
  guideBubble: { backgroundColor: ui.card, borderTopLeftRadius: 6 },
  userBubble: { backgroundColor: '#30265A', borderTopRightRadius: 6 },
  messageLabel: { color: ui.accent, fontSize: 8, letterSpacing: 1.1, fontWeight: '700', marginBottom: 7 },
  messageText: { color: '#D4D0DB', fontSize: 14, lineHeight: 21 },
  userText: { color: ui.foreground },
  sourceNote: { color: '#79748E', fontSize: 10, lineHeight: 15, textAlign: 'center', marginVertical: 12, paddingHorizontal: 20 },
  composer: { paddingHorizontal: 14, paddingTop: 12, backgroundColor: '#0D0C19', borderTopWidth: 1, borderTopColor: ui.border },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: ui.card, borderRadius: 18, padding: 5, paddingLeft: 15 },
  input: { flex: 1, color: ui.foreground, fontSize: 13, minHeight: 40 },
  send: { width: 38, height: 38, borderRadius: 14, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  suggestions: { flexDirection: 'row', gap: 7, marginTop: 10 },
  suggestion: { borderWidth: 1, borderColor: ui.border, backgroundColor: '#16152A', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10 },
  suggestionText: { color: ui.mutedForeground, fontSize: 10 },
});