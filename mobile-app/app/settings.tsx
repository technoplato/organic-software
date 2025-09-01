import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useStyles from "../lib/useStyles";

const DEFAULT_TRIGGER_KEYWORDS = ["send", "done", "submit", "send message", "send it"];

export default function SettingsScreen() {
  const router = useRouter();
  const { styles, palette } = useStyles();
  const [triggerKeywords, setTriggerKeywords] = useState<string[]>(DEFAULT_TRIGGER_KEYWORDS);
  const [newKeyword, setNewKeyword] = useState("");
  const [autoRestart, setAutoRestart] = useState(true);
  const [silenceThreshold, setSilenceThreshold] = useState("3");

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedKeywords = await AsyncStorage.getItem('triggerKeywords');
      if (storedKeywords) {
        setTriggerKeywords(JSON.parse(storedKeywords));
      }

      const storedAutoRestart = await AsyncStorage.getItem('voiceAutoRestart');
      if (storedAutoRestart !== null) {
        setAutoRestart(JSON.parse(storedAutoRestart));
      }

      const storedThreshold = await AsyncStorage.getItem('silenceThreshold');
      if (storedThreshold) {
        setSilenceThreshold(storedThreshold);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('triggerKeywords', JSON.stringify(triggerKeywords));
      await AsyncStorage.setItem('voiceAutoRestart', JSON.stringify(autoRestart));
      await AsyncStorage.setItem('silenceThreshold', silenceThreshold);
      Alert.alert("Success", "Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings");
    }
  };

  const addKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (trimmed && !triggerKeywords.includes(trimmed)) {
      setTriggerKeywords([...triggerKeywords, trimmed]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    if (triggerKeywords.length > 1) {
      setTriggerKeywords(triggerKeywords.filter(k => k !== keyword));
    } else {
      Alert.alert("Warning", "You must have at least one trigger keyword");
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to defaults?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setTriggerKeywords(DEFAULT_TRIGGER_KEYWORDS);
            setAutoRestart(true);
            setSilenceThreshold("3");
            saveSettings();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.alignCenter, styles.marginBottom]}>
          <Text style={styles.title}>⚙️ Settings</Text>
          <Text style={styles.subtitle}>Configure voice dictation</Text>
        </View>

        {/* Trigger Keywords Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Trigger Keywords</Text>
          <Text style={[styles.sectionSubtitle, { marginBottom: 12 }]}>
            Say these words to automatically send your message
          </Text>

          {/* Current Keywords */}
          <View style={[styles.card, { marginBottom: 12 }]}>
            {triggerKeywords.map((keyword, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderBottomWidth: index < triggerKeywords.length - 1 ? 1 : 0,
                  borderBottomColor: palette.border,
                }}
              >
                <Text style={{ fontSize: 16, color: palette.text }}>
                  "{keyword}"
                </Text>
                <TouchableOpacity
                  onPress={() => removeKeyword(keyword)}
                  style={{
                    padding: 4,
                    backgroundColor: palette.error + '20',
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ color: palette.error, fontSize: 14 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add New Keyword */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TextInput
              style={[styles.textInput, styles.flex1]}
              value={newKeyword}
              onChangeText={setNewKeyword}
              placeholder="Add new trigger keyword..."
              placeholderTextColor={palette.textTertiary}
              onSubmitEditing={addKeyword}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                { paddingHorizontal: 20 },
                !newKeyword.trim() && styles.buttonDisabled,
              ]}
              onPress={addKeyword}
              disabled={!newKeyword.trim()}
            >
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Recognition Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎙️ Voice Recognition</Text>

          {/* Auto-Restart Toggle */}
          <View style={[styles.card, { marginBottom: 12 }]}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 16, color: palette.text, marginBottom: 4 }}>
                  Auto-Restart Recording
                </Text>
                <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                  Automatically restart if recording stops unexpectedly
                </Text>
              </View>
              <Switch
                value={autoRestart}
                onValueChange={setAutoRestart}
                trackColor={{ false: "#767577", true: palette.success }}
                thumbColor={autoRestart ? "#ffffff" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Silence Threshold */}
          <View style={styles.card}>
            <Text style={{ fontSize: 16, color: palette.text, marginBottom: 8 }}>
              Silence Detection Threshold
            </Text>
            <Text style={{ fontSize: 14, color: palette.textSecondary, marginBottom: 12 }}>
              Seconds of silence before creating a segment
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {["2", "3", "5", "10"].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    {
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: silenceThreshold === value ? palette.accent : palette.border,
                      backgroundColor: silenceThreshold === value ? palette.accent + '10' : 'transparent',
                      alignItems: 'center',
                    }
                  ]}
                  onPress={() => setSilenceThreshold(value)}
                >
                  <Text style={{
                    color: silenceThreshold === value ? palette.accent : palette.text,
                    fontWeight: silenceThreshold === value ? '600' : '400',
                  }}>
                    {value}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSuccess]}
            onPress={saveSettings}
          >
            <Text style={styles.buttonText}>💾 Save Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: palette.warning, marginTop: 12 }]}
            onPress={resetToDefaults}
          >
            <Text style={styles.buttonText}>🔄 Reset to Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { marginTop: 12 }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: palette.text }]}>
              ← Back to Conversations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: palette.info + '10' }]}>
            <Text style={{ fontSize: 14, color: palette.text, lineHeight: 20 }}>
              💡 <Text style={{ fontWeight: '600' }}>Tips:</Text>
              {'\n'}• Trigger keywords are case-insensitive
              {'\n'}• Keywords are detected anywhere in your speech
              {'\n'}• The keyword itself is removed from the sent message
              {'\n'}• You can have multiple trigger keywords active
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}