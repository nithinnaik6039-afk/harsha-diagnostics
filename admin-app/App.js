import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_ADMIN_URL =
  process.env.EXPO_PUBLIC_ADMIN_URL || 'https://harsha-diagnostics-admin.vercel.app';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [adminUrl, setAdminUrl] = useState(DEFAULT_ADMIN_URL);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => subscription.remove();
    }
  }, [canGoBack]);

  const handleReload = () => {
    setHasError(false);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* App Header Bar for Mobile Controls */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandEmoji}>🩸</Text>
          <View>
            <Text style={styles.brandTitle}>Harsha Diagnostics</Text>
            <Text style={styles.brandSubtitle}>Admin Command Center</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleReload}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshText}>🔄 Reload</Text>
        </TouchableOpacity>
      </View>

      {/* Main WebView Frame */}
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: adminUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => {
            setLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
          onHttpError={() => {
            setLoading(false);
            setHasError(true);
          }}
        />

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Connecting to Admin Dashboard...</Text>
          </View>
        )}

        {/* Error / Offline Fallback View */}
        {hasError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Cannot Connect to Admin Dashboard</Text>
            <Text style={styles.errorDescription}>
              Make sure the admin server is running at:
            </Text>
            <View style={styles.urlBox}>
              <Text style={styles.urlText}>{adminUrl}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleReload}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>🔁 Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#090D16',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandEmoji: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  webContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#030712',
  },
  webview: {
    flex: 1,
    backgroundColor: '#030712',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  errorEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f87171',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
  },
  urlBox: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  urlText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#38bdf8',
  },
  retryButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
