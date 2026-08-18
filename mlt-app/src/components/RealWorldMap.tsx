import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

interface RealWorldMapProps {
  origin?: MapCoordinates;
  destination?: MapCoordinates;
  patientName?: string;
  addressLine?: string;
  isSimulating?: boolean;
  onArrived?: () => void;
  height?: number;
}

export default function RealWorldMap({
  origin = { lat: 14.6819, lng: 77.6006 }, // Harsha Diagnostics Hub Anantapuramu
  destination = { lat: 14.6885, lng: 77.608 }, // Patient Location
  patientName = 'Patient Location',
  addressLine = 'MIG Bus Stand Road, Anantapuramu',
  isSimulating = false,
  onArrived,
  height = 320,
}: RealWorldMapProps) {
  const [mapType, setMapType] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [progress, setProgress] = useState(0.2); // 0 to 1 along path
  const [simActive, setSimActive] = useState(isSimulating);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);
  const [currentStreet, setCurrentStreet] = useState('Subhash Road (NH 44 Connector)');
  const [nextTurn, setNextTurn] = useState('In 180m, Turn Right onto Clock Tower Bypass');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate intermediate waypoint route curve between origin and destination
  const getWaypoint = (pct: number): MapCoordinates => {
    // S-curve route approximation
    const lat = origin.lat + (destination.lat - origin.lat) * pct + Math.sin(pct * Math.PI) * 0.002;
    const lng = origin.lng + (destination.lng - origin.lng) * pct + Math.cos(pct * Math.PI) * 0.0015;
    return { lat, lng };
  };

  const currentRiderPos = getWaypoint(progress);

  // Driving route simulation loop
  useEffect(() => {
    let interval: any = null;
    if (simActive) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 0.98) {
            clearInterval(interval);
            setSimActive(false);
            if (onArrived) onArrived();
            return 1;
          }
          const next = prev + 0.02 * simSpeedMultiplier;
          if (next > 0.6) {
            setCurrentStreet('Clock Tower Main Circle');
            setNextTurn('In 50m, Destination is on your Left');
          } else if (next > 0.3) {
            setCurrentStreet('Court Road Extension');
            setNextTurn('Continue Straight for 400m');
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [simActive, simSpeedMultiplier]);

  const remainingDistKm = Math.max(0.1, (1 - progress) * 2.8).toFixed(1);
  const remainingEtaMins = Math.max(1, Math.round((1 - progress) * 9));
  const currentSpeedKmH = simActive ? Math.round(35 + Math.sin(progress * 10) * 8) : 0;

  // Real Web Leaflet HTML / Iframe Generator for Interactive Tile Rendering
  const tileUrl =
    mapType === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : mapType === 'streets'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #090d16; font-family: -apple-system, sans-serif; }
        .rider-pulse {
          width: 24px; height: 24px; background: #10b981; border-radius: 50%;
          box-shadow: 0 0 16px #10b981, 0 0 32px #10b981;
          display: flex; align-items: center; justify-content: center; font-size: 14px;
          border: 2px solid #ffffff; animation: pulse 1.5s infinite;
        }
        .patient-pin {
          width: 28px; height: 28px; background: #ef4444; border-radius: 50%;
          box-shadow: 0 0 16px #ef4444; display: flex; align-items: center; justify-content: center;
          font-size: 16px; border: 2px solid #ffffff;
        }
        .hub-pin {
          width: 26px; height: 26px; background: #0284c7; border-radius: 50%;
          box-shadow: 0 0 14px #0284c7; display: flex; align-items: center; justify-content: center;
          font-size: 15px; border: 2px solid #ffffff;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${currentRiderPos.lat}, ${currentRiderPos.lng}], 15);
        
        L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

        // Origin / Hub Marker
        const hubIcon = L.divIcon({ className: 'custom-icon', html: '<div class="hub-pin">🏥</div>', iconSize: [26, 26], iconAnchor: [13, 13] });
        L.marker([${origin.lat}, ${origin.lng}], { icon: hubIcon }).addTo(map).bindPopup("<b>Harsha Central Lab Hub</b>");

        // Destination / Patient Marker
        const patientIcon = L.divIcon({ className: 'custom-icon', html: '<div class="patient-pin">📍</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
        L.marker([${destination.lat}, ${destination.lng}], { icon: patientIcon }).addTo(map).bindPopup("<b>${patientName}</b><br>${addressLine}");

        // Route Polyline with Cyan/Emerald Glow
        const routePoints = [
          [${origin.lat}, ${origin.lng}],
          [${origin.lat + 0.0015}, ${origin.lng + 0.0025}],
          [${origin.lat + 0.0035}, ${origin.lng + 0.0045}],
          [${origin.lat + 0.0055}, ${origin.lng + 0.006}],
          [${destination.lat}, ${destination.lng}]
        ];
        
        L.polyline(routePoints, { color: '#059669', weight: 8, opacity: 0.5 }).addTo(map);
        L.polyline(routePoints, { color: '#34d399', weight: 4, opacity: 0.9, dashArray: '8, 8' }).addTo(map);

        // Moving Rider Marker
        const riderIcon = L.divIcon({ className: 'custom-icon', html: '<div class="rider-pulse">🏍️</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
        const riderMarker = L.marker([${currentRiderPos.lat}, ${currentRiderPos.lng}], { icon: riderIcon }).addTo(map);

        // Circle radius area
        L.circle([${destination.lat}, ${destination.lng}], { radius: 120, color: '#38bdf8', fillColor: '#0284c7', fillOpacity: 0.15 }).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      {/* Turn-by-Turn Navigation Header Banner */}
      <View style={styles.turnHeader}>
        <View style={styles.turnIconBox}>
          <Text style={styles.turnIconText}>↗️</Text>
        </View>
        <View style={styles.turnInfo}>
          <Text style={styles.turnNext}>{nextTurn}</Text>
          <Text style={styles.turnStreet}>{currentStreet}</Text>
        </View>
        <View style={styles.speedGauge}>
          <Text style={styles.speedGaugeVal}>{currentSpeedKmH}</Text>
          <Text style={styles.speedGaugeUnit}>KM/H</Text>
        </View>
      </View>

      {/* Interactive Map Tile Viewport */}
      <View style={[styles.mapViewport, { height: isFullscreen ? Dimensions.get('window').height - 180 : height }]}>
        {Platform.OS === 'web' ? (
          <iframe
            key={`${mapType}-${currentRiderPos.lat.toFixed(4)}-${currentRiderPos.lng.toFixed(4)}`}
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 16 }}
            title="Real-World Interactive Map"
          />
        ) : (
          <View style={styles.fallbackNativeMap}>
            <Text style={{ fontSize: 32 }}>🗺️</Text>
            <Text style={styles.fallbackTitle}>Real-World GPS Route Live</Text>
            <Text style={styles.fallbackCoords}>
              Rider: {currentRiderPos.lat.toFixed(4)}°N, {currentRiderPos.lng.toFixed(4)}°E
            </Text>
          </View>
        )}

        {/* Map Floating Controls */}
        <View style={styles.floatingControls}>
          {/* Map Layer Switcher */}
          <View style={styles.layerSwitcher}>
            {[
              { key: 'dark', label: '🌙 Cyber' },
              { key: 'satellite', label: '🛰️ Satellite' },
              { key: 'streets', label: '🗺️ Streets' },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.layerBtn, mapType === t.key && styles.layerBtnActive]}
                onPress={() => setMapType(t.key as any)}
              >
                <Text style={[styles.layerText, mapType === t.key && styles.layerTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fullscreen Toggle */}
          <TouchableOpacity
            style={styles.fullscreenBtn}
            onPress={() => setIsFullscreen(!isFullscreen)}
          >
            <Text style={styles.fullscreenBtnText}>{isFullscreen ? '✕ Exit' : '⛶ Full'}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Live Route Telemetry Overlay */}
        <View style={styles.telemetryOverlay}>
          <View style={styles.telemetryStat}>
            <Text style={styles.telemetryLabel}>REMAINING</Text>
            <Text style={styles.telemetryVal}>{remainingDistKm} km</Text>
          </View>

          <View style={styles.telemetryDivider} />

          <View style={styles.telemetryStat}>
            <Text style={styles.telemetryLabel}>ETA ARRIVAL</Text>
            <Text style={[styles.telemetryVal, { color: '#34d399' }]}>{remainingEtaMins} mins</Text>
          </View>

          <View style={styles.telemetryDivider} />

          <View style={styles.telemetryStat}>
            <Text style={styles.telemetryLabel}>DESTINATION</Text>
            <Text style={[styles.telemetryVal, { color: '#38bdf8' }]} numberOfLines={1}>
              {patientName.split(' ')[0]}
            </Text>
          </View>
        </View>
      </View>

      {/* GPS Driving Simulation & Route Controls */}
      <View style={styles.simControlBar}>
        <TouchableOpacity
          style={[styles.simPlayBtn, simActive && styles.simPlayBtnActive]}
          onPress={() => setSimActive(!simActive)}
        >
          <Text style={styles.simPlayBtnText}>
            {simActive ? '⏸️ Pause GPS Route' : progress >= 0.98 ? '↻ Restart Route' : '▶️ Drive Live Route'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.speedToggleBtn}
          onPress={() => setSimSpeedMultiplier((m) => (m === 1 ? 2 : m === 2 ? 4 : 1))}
        >
          <Text style={styles.speedToggleText}>{simSpeedMultiplier}x Speed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={() => setProgress(0.1)}
        >
          <Text style={styles.recenterBtnText}>📍 Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    borderRadius: 0,
    backgroundColor: '#090d16',
  },
  turnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 10,
  },
  turnIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  turnIconText: {
    fontSize: 20,
  },
  turnInfo: {
    flex: 1,
  },
  turnNext: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  turnStreet: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  speedGauge: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  speedGaugeVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#34d399',
  },
  speedGaugeUnit: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  mapViewport: {
    position: 'relative',
    backgroundColor: '#090d16',
  },
  fallbackNativeMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  fallbackCoords: {
    fontSize: 11,
    color: '#38bdf8',
  },
  floatingControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  layerSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 10,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  layerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  layerBtnActive: {
    backgroundColor: '#059669',
  },
  layerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  layerTextActive: {
    color: '#ffffff',
  },
  fullscreenBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  fullscreenBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  telemetryOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  telemetryStat: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  telemetryLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  telemetryVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f8fafc',
    marginTop: 2,
  },
  simControlBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#0f172a',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  simPlayBtn: {
    flex: 2,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simPlayBtnActive: {
    backgroundColor: '#d97706',
  },
  simPlayBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  speedToggleBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedToggleText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 11,
  },
  recenterBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenterBtnText: {
    color: '#cbd5e1',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
