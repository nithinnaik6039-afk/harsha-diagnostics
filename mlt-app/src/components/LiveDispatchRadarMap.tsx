import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

export default function LiveDispatchRadarMap() {
  const router = useRouter();
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number }>({
    lat: 14.6819,
    lng: 77.6006, // Anantapuramu Harsha Hub
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(4.2);
  const [gpsSpeed, setGpsSpeed] = useState<number>(0);
  const [radarRangeKm, setRadarRangeKm] = useState<number>(5);
  const [mapEngine, setMapEngine] = useState<'google' | 'cyber' | 'satellite' | 'streets'>('google');
  const [incomingJob, setIncomingJob] = useState<any | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [radarActive, setRadarActive] = useState<boolean>(true);

  // Watch real device / browser GPS if permitted
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsAccuracy(Math.round(pos.coords.accuracy * 10) / 10);
          setGpsSpeed(Math.round((pos.coords.speed || 0) * 3.6));
        },
        (err) => console.log('[GPS Watcher] Using default Anantapur location:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Countdown timer for incoming dispatch job
  useEffect(() => {
    let timer: any = null;
    if (incomingJob && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            setIncomingJob(null);
            return 30;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [incomingJob, countdown]);

  // Simulate an incoming patient booking dispatch
  const handleTriggerSimDispatch = () => {
    setCountdown(30);
    setIncomingJob({
      id: 'DISP-' + Math.floor(1000 + Math.random() * 9000),
      patientName: 'K. Suneetha Devi',
      age: 48,
      gender: 'Female',
      address: 'Plot 42, Revenue Colony, Near Clock Tower',
      distanceKm: 1.6,
      etaMins: 5,
      tests: ['Complete Hemogram (CBC)', 'Thyroid Profile (T3, T4, TSH)', 'Fasting Blood Sugar'],
      orderAmount: 1480,
      payoutEarnings: 380,
      coordinates: { lat: gpsLocation.lat + 0.006, lng: gpsLocation.lng + 0.005 },
    });
  };

  const handleOpenGoogleMapsLive = () => {
    const lat = incomingJob ? incomingJob.coordinates.lat : gpsLocation.lat;
    const lng = incomingJob ? incomingJob.coordinates.lng : gpsLocation.lng;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  // Tile URL based on selected map engine
  const getMapTileUrl = () => {
    if (mapEngine === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}';
    }
    if (mapEngine === 'streets') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    if (mapEngine === 'google') {
      return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    }
    // cyber dark
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #020617; font-family: -apple-system, sans-serif; overflow: hidden; }
        
        /* Radar Sweep Animation */
        .radar-sweep {
          position: absolute; top: 50%; left: 50%; width: 260px; height: 260px;
          margin-top: -130px; margin-left: -130px; border-radius: 50%;
          border: 1px solid rgba(16, 185, 129, 0.4);
          background: conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0.35) 0deg, rgba(16, 185, 129, 0) 60deg, rgba(16, 185, 129, 0) 360deg);
          animation: spin 3s linear infinite; pointer-events: none; z-index: 500;
        }
        .radar-ring-1 {
          position: absolute; top: 50%; left: 50%; width: 120px; height: 120px;
          margin-top: -60px; margin-left: -60px; border-radius: 50%;
          border: 1px dashed rgba(56, 189, 248, 0.4); pointer-events: none; z-index: 490;
        }
        .radar-ring-2 {
          position: absolute; top: 50%; left: 50%; width: 220px; height: 220px;
          margin-top: -110px; margin-left: -110px; border-radius: 50%;
          border: 1px solid rgba(16, 185, 129, 0.2); pointer-events: none; z-index: 490;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .mlt-rider-pin {
          width: 30px; height: 30px; background: #0284c7; border-radius: 50%;
          box-shadow: 0 0 20px #0284c7, 0 0 40px #0284c7; display: flex; align-items: center;
          justify-content: center; font-size: 16px; border: 2.5px solid #ffffff;
        }
        .patient-target-pin {
          width: 32px; height: 32px; background: #ef4444; border-radius: 50%;
          box-shadow: 0 0 20px #ef4444, 0 0 40px #ef4444; display: flex; align-items: center;
          justify-content: center; font-size: 17px; border: 2.5px solid #ffffff;
          animation: bounce 1s infinite alternate;
        }
        @keyframes bounce { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
      </style>
    </head>
    <body>
      <div id="map"></div>
      ${radarActive ? '<div class="radar-ring-1"></div><div class="radar-ring-2"></div><div class="radar-sweep"></div>' : ''}
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${gpsLocation.lat}, ${gpsLocation.lng}], 14);
        L.tileLayer('${getMapTileUrl()}', { maxZoom: 19 }).addTo(map);

        // MLT Real-time Location Pin
        const mltIcon = L.divIcon({ className: 'custom-icon', html: '<div class="mlt-rider-pin">🧑‍⚕️</div>', iconSize: [30, 30], iconAnchor: [15, 15] });
        L.marker([${gpsLocation.lat}, ${gpsLocation.lng}], { icon: mltIcon }).addTo(map).bindPopup("<b>Your Live Phlebotomist GPS</b><br>Accuracy: ±${gpsAccuracy}m");

        // Radar Scanning Circles
        L.circle([${gpsLocation.lat}, ${gpsLocation.lng}], { radius: ${radarRangeKm * 1000}, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.06, weight: 1.5, dashArray: '6, 6' }).addTo(map);

        ${
          incomingJob
            ? `
          // Incoming Patient Location Beacon
          const patientIcon = L.divIcon({ className: 'custom-icon', html: '<div class="patient-target-pin">🩸</div>', iconSize: [32, 32], iconAnchor: [16, 16] });
          L.marker([${incomingJob.coordinates.lat}, ${incomingJob.coordinates.lng}], { icon: patientIcon }).addTo(map).bindPopup("<b>${incomingJob.patientName}</b><br>${incomingJob.address}");

          // Route Vector Line
          L.polyline([[${gpsLocation.lat}, ${gpsLocation.lng}], [${incomingJob.coordinates.lat}, ${incomingJob.coordinates.lng}]], { color: '#f59e0b', weight: 4, opacity: 0.8, dashArray: '8, 8' }).addTo(map);
        `
            : ''
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.livePulseDot} />
            <Text style={styles.title}>LIVE DISPATCH RADAR & MAPPING</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>GPS LIVE</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Real-time GPS tracking & multi-engine dispatch radar for home collection orders.
          </Text>
        </View>

        <TouchableOpacity style={styles.googleMapsBtn} onPress={handleOpenGoogleMapsLive}>
          <Text style={styles.googleMapsBtnText}>🗺️ Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Real-time GPS Telemetry Bar */}
      <View style={styles.telemetryBar}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>GPS COORDINATES</Text>
          <Text style={styles.telemetryVal}>
            {gpsLocation.lat.toFixed(4)}°N, {gpsLocation.lng.toFixed(4)}°E
          </Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>ACCURACY</Text>
          <Text style={[styles.telemetryVal, { color: '#34d399' }]}>±{gpsAccuracy} m</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>SPEED</Text>
          <Text style={[styles.telemetryVal, { color: '#38bdf8' }]}>{gpsSpeed} km/h</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>SATELLITES</Text>
          <Text style={[styles.telemetryVal, { color: '#fbbf24' }]}>🟢 9 Locked</Text>
        </View>
      </View>

      {/* Map Engine Layer Switcher & Range Bar */}
      <View style={styles.controlsBar}>
        {/* Mapping Option Selector */}
        <View style={styles.mapEngineGroup}>
          {[
            { id: 'google', label: '🌐 Google Live' },
            { id: 'cyber', label: '🌙 Cyber Dark' },
            { id: 'satellite', label: '🛰️ Satellite' },
            { id: 'streets', label: '🗺️ Streets' },
          ].map((engine) => (
            <TouchableOpacity
              key={engine.id}
              style={[styles.engineBtn, mapEngine === engine.id && styles.engineBtnActive]}
              onPress={() => setMapEngine(engine.id as any)}
            >
              <Text style={[styles.engineText, mapEngine === engine.id && styles.engineTextActive]}>
                {engine.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Radar Range Filter */}
        <View style={styles.rangeGroup}>
          {[3, 5, 10, 20].map((km) => (
            <TouchableOpacity
              key={km}
              style={[styles.rangeBtn, radarRangeKm === km && styles.rangeBtnActive]}
              onPress={() => setRadarRangeKm(km)}
            >
              <Text style={[styles.rangeText, radarRangeKm === km && styles.rangeTextActive]}>
                {km}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Anantapur Local Zone Switcher */}
      <View style={styles.anantapurZonesBar}>
        <Text style={styles.anantapurLabel}>📍 ANANTAPUR LOCAL HUB & ZONES:</Text>
        <View style={styles.zonesList}>
          {[
            { name: 'Clock Tower & Subhash Rd', lat: 14.6819, lng: 77.6006 },
            { name: 'RTC Bus Stand / MIG Colony', lat: 14.6782, lng: 77.6051 },
            { name: 'JNTU / Sai Nagar', lat: 14.6938, lng: 77.6184 },
            { name: 'Court Complex / Collectorate', lat: 14.6865, lng: 77.5982 },
            { name: 'Kalyandurg Rd / Old Town', lat: 14.6742, lng: 77.5925 },
          ].map((z, idx) => {
            const isSelected =
              Math.abs(gpsLocation.lat - z.lat) < 0.002 && Math.abs(gpsLocation.lng - z.lng) < 0.002;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.zoneChip, isSelected && styles.zoneChipActive]}
                onPress={() => setGpsLocation({ lat: z.lat, lng: z.lng })}
              >
                <Text style={[styles.zoneChipText, isSelected && styles.zoneChipTextActive]}>
                  {isSelected ? '● ' : ''}{z.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Interactive Map Viewport */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            key={`${mapEngine}-${radarRangeKm}-${gpsLocation.lat}-${incomingJob ? 'job' : 'idle'}`}
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Live Dispatch Radar"
          />
        ) : (
          <View style={styles.nativeFallback}>
            <Text style={{ fontSize: 32 }}>📡</Text>
            <Text style={styles.nativeFallbackText}>Live GPS Radar Active</Text>
            <Text style={styles.nativeCoords}>
              {gpsLocation.lat.toFixed(4)}°N, {gpsLocation.lng.toFixed(4)}°E
            </Text>
          </View>
        )}

        {/* Floating Toggle for Radar Sweep */}
        <TouchableOpacity
          style={styles.radarToggleFloating}
          onPress={() => setRadarActive(!radarActive)}
        >
          <Text style={styles.radarToggleText}>{radarActive ? '🟢 Sonar Sweep ON' : '⚪ Sonar Sweep OFF'}</Text>
        </TouchableOpacity>
      </View>

      {/* Incoming Job Alert Card (Overlay / Below) */}
      {incomingJob ? (
        <View style={styles.incomingJobCard}>
          <View style={styles.incomingJobHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18 }}>🚨</Text>
              <View>
                <Text style={styles.incomingJobTitle}>NEW HOME COLLECTION DISPATCH</Text>
                <Text style={styles.incomingJobDist}>
                  📍 {incomingJob.distanceKm} km away • {incomingJob.etaMins} mins travel ETA
                </Text>
              </View>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>{countdown}s</Text>
            </View>
          </View>

          <View style={styles.patientInfoBox}>
            <Text style={styles.patientNameText}>
              🧑 {incomingJob.patientName} ({incomingJob.age} yrs • {incomingJob.gender})
            </Text>
            <Text style={styles.patientAddressText}>🏠 {incomingJob.address}</Text>
            <Text style={styles.testsListText}>🧪 {incomingJob.tests.join(' • ')}</Text>
          </View>

          <View style={styles.earningsRow}>
            <View>
              <Text style={styles.earningsLabel}>TOTAL ORDER</Text>
              <Text style={styles.earningsVal}>₹{incomingJob.orderAmount}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.earningsLabel}>PHLEBOTOMIST PAYOUT</Text>
              <Text style={[styles.earningsVal, { color: '#34d399' }]}>+₹{incomingJob.payoutEarnings}</Text>
            </View>
          </View>

          <View style={styles.jobActionRow}>
            <TouchableOpacity
              style={styles.acceptJobBtn}
              onPress={() => {
                setIncomingJob(null);
                router.push('/incoming-alert');
              }}
            >
              <Text style={styles.acceptJobText}>✓ ACCEPT & NAVIGATE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineJobBtn}
              onPress={() => setIncomingJob(null)}
            >
              <Text style={styles.declineJobText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.idleRadarFooter}>
          <Text style={styles.idleRadarText}>
            ● Radar scanning {radarRangeKm}km radius around your live GPS coordinates...
          </Text>
          <TouchableOpacity style={styles.simPingBtn} onPress={handleTriggerSimDispatch}>
            <Text style={styles.simPingBtnText}>⚡ Simulate Live Job Booking Ping</Text>
          </TouchableOpacity>
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
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  liveBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  googleMapsBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  googleMapsBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  telemetryBar: {
    flexDirection: 'row',
    backgroundColor: '#030712',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#1e293b',
  },
  telemetryLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#64748b',
  },
  telemetryVal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  mapEngineGroup: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  engineBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  engineBtnActive: {
    backgroundColor: '#0284c7',
  },
  engineText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  engineTextActive: {
    color: '#ffffff',
  },
  rangeGroup: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  rangeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rangeBtnActive: {
    backgroundColor: '#10b981',
  },
  rangeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  rangeTextActive: {
    color: '#ffffff',
  },
  mapContainer: {
    height: 240,
    backgroundColor: '#020617',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  nativeFallbackText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nativeCoords: {
    fontSize: 10,
    color: '#38bdf8',
  },
  radarToggleFloating: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 900,
  },
  radarToggleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#34d399',
  },
  incomingJobCard: {
    backgroundColor: '#451a03',
    borderColor: '#f59e0b',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  incomingJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incomingJobTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fef08a',
    letterSpacing: 0.5,
  },
  incomingJobDist: {
    fontSize: 9,
    color: '#cbd5e1',
    marginTop: 1,
  },
  timerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#b45309',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fef08a',
  },
  timerBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  patientInfoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  patientNameText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  patientAddressText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  testsListText: {
    fontSize: 9,
    color: '#38bdf8',
    marginTop: 4,
    fontWeight: '600',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  earningsLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  earningsVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#f8fafc',
    marginTop: 2,
  },
  jobActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptJobBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptJobText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  declineJobBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  declineJobText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  idleRadarFooter: {
    marginTop: 10,
    alignItems: 'center',
    gap: 8,
  },
  idleRadarText: {
    fontSize: 10,
    color: '#34d399',
    fontWeight: '600',
  },
  simPingBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  simPingBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  anantapurZonesBar: {
    marginBottom: 10,
    backgroundColor: '#030712',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  anantapurLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  zonesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  zoneChip: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  zoneChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  zoneChipText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  zoneChipTextActive: {
    color: '#ffffff',
  },
});
