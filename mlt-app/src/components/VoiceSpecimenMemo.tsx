import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function VoiceSpecimenMemo({ patientName }: { patientName: string }) {
  const [recording, setRecording] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (recording) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const toggleRecord = () => {
    if (recording) {
      setRecording(false);
      setHasAudio(true);
    } else {
      setRecording(true);
      setHasAudio(false);
      setSeconds(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>🎙️</Text>
          <View>
            <Text style={styles.title}>Voice Specimen Memo</Text>
            <Text style={styles.subtitle}>Audio note for lab accessioning desk</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.recordBtn, recording && styles.recordBtnActive]}
          onPress={toggleRecord}
        >
          <View style={[styles.recordDot, recording && styles.recordDotPulsing]} />
          <Text style={styles.recordBtnText}>
            {recording ? `Recording (0:${seconds < 10 ? '0' : ''}${seconds})` : hasAudio ? '↻ Re-record' : '🎙️ Record Memo'}
          </Text>
        </TouchableOpacity>
      </View>

      {hasAudio && (
        <View style={styles.memoPlayerBox}>
          <View style={styles.audioWaveform}>
            <Text style={styles.audioWaveText}> ▂▃▅▆▇▆▅▃▂ ▂▃▅▆▇ </Text>
            <Text style={styles.audioDuration}>0:{seconds < 10 ? '0' : ''}${seconds}</Text>
          </View>
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>AI TRANSCRIPTION:</Text>
            <Text style={styles.transcriptText}>
              "Sample collected from {patientName}. Fasting confirmed 12 hours. Used SST Gel 4ml yellow tube and 2ml EDTA. Stored in 4°C Cryo-box."
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  recordBtnActive: {
    backgroundColor: '#450a0a',
    borderColor: '#ef4444',
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordDotPulsing: {
    backgroundColor: '#f87171',
  },
  recordBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  memoPlayerBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  audioWaveform: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  audioWaveText: {
    color: '#34d399',
    fontSize: 14,
    letterSpacing: 2,
  },
  audioDuration: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  transcriptBox: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
  },
  transcriptLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 2,
  },
  transcriptText: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 14,
    fontStyle: 'italic',
  },
});
