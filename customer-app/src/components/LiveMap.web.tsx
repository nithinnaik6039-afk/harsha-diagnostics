import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Platform } from 'react-native';

export interface LiveMapProps {
  customerCoords: { lat: number; lng: number };
  customerAddressLine: string;
  mltCoords: { lat: number; lng: number } | null;
  mltName: string;
  orderStatus: string;
}

export default function LiveMap({
  customerCoords = { lat: 14.6885, lng: 77.608 },
  customerAddressLine = 'MIG Colony, Anantapuramu',
  mltCoords = { lat: 14.6819, lng: 77.6006 },
  mltName = 'S. Rajesh (Lead Phlebotomist)',
  orderStatus = 'OnTheWay',
}: LiveMapProps) {
  const [mapEngine, setMapEngine] = useState<'google' | 'cyber' | 'satellite' | 'streets'>('google');
  const [simProgress, setSimProgress] = useState(0.35); // 0 to 1 along route
  const [speedKmH, setSpeedKmH] = useState(34);
  const [distanceKm, setDistanceKm] = useState(1.4);
  const [etaMins, setEtaMins] = useState(5);

  const cLat = customerCoords?.lat || 14.6885;
  const cLng = customerCoords?.lng || 77.608;
  const hubLat = 14.6819;
  const hubLng = 77.6006;

  // Real-time route animation loop for Instamart experience
  useEffect(() => {
    if (orderStatus === 'OnTheWay') {
      const interval = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 0.95) return 0.95;
          const next = prev + 0.015;
          const remainingDist = Math.max(0.1, Math.round((1 - next) * 2.2 * 10) / 10);
          setDistanceKm(remainingDist);
          setEtaMins(Math.max(1, Math.ceil(remainingDist * 2.5)));
          setSpeedKmH(Math.floor(30 + Math.random() * 12));
          return next;
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [orderStatus]);

  // Interpolated live bike rider position
  const currentRiderLat = hubLat + (cLat - hubLat) * simProgress + Math.sin(simProgress * Math.PI) * 0.0018;
  const currentRiderLng = hubLng + (cLng - hubLng) * simProgress + Math.cos(simProgress * Math.PI) * 0.0012;

  const isDelivering = orderStatus === 'Collected';
  const isArrived = orderStatus === 'Arrived' || simProgress >= 0.95;

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
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #020617; font-family: -apple-system, sans-serif; overflow: hidden; }
        
        .instamart-bike-pin {
          width: 42px; height: 42px; background: #0284c7; border-radius: 50%;
          box-shadow: 0 0 20px #0284c7, 0 0 40px #0284c7; display: flex; align-items: center;
          justify-content: center; font-size: 22px; border: 3px solid #ffffff;
          animation: pulseRing 1.4s infinite;
        }

        .patient-destination-pin {
          width: 38px; height: 38px; background: #10b981; border-radius: 50%;
          box-shadow: 0 0 20px #10b981; display: flex; align-items: center;
          justify-content: center; font-size: 20px; border: 3px solid #ffffff;
        }

        .hub-pin {
          width: 34px; height: 34px; background: #8b5cf6; border-radius: 50%;
          box-shadow: 0 0 16px #8b5cf6; display: flex; align-items: center;
          justify-content: center; font-size: 17px; border: 2.5px solid #ffffff;
        }

        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.8); }
          70% { box-shadow: 0 0 0 16px rgba(2, 132, 199, 0); }
          100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${(currentRiderLat + cLat) / 2}, ${(currentRiderLng + cLng) / 2}], 14);
        L.tileLayer('${getMapTileUrl()}', { maxZoom: 19 }).addTo(map);

        // Harsha Central Diagnostic Hub
        const hubIcon = L.divIcon({ className: 'custom-icon', html: '<div class="hub-pin">🏥</div>', iconSize: [34, 34], iconAnchor: [17, 17] });
        L.marker([${hubLat}, ${hubLng}], { icon: hubIcon }).addTo(map).bindPopup("<b>🏥 Harsha Diagnostics Central Hub</b><br>Subhash Road, Clock Tower");

        // Patient Destination Home Marker
        const homeIcon = L.divIcon({ className: 'custom-icon', html: '<div class="patient-destination-pin">🏠</div>', iconSize: [38, 38], iconAnchor: [19, 19] });
        L.marker([${cLat}, ${cLng}], { icon: homeIcon }).addTo(map).bindPopup("<b>🏠 Your Home Address</b><br>${customerAddressLine}");

        // Live Phlebotomist Bike Marker
        const riderIcon = L.divIcon({ className: 'custom-icon', html: '<div class="instamart-bike-pin">${isDelivering ? '🩸' : '🏍️'}</div>', iconSize: [42, 42], iconAnchor: [21, 21] });
        L.marker([${currentRiderLat}, ${currentRiderLng}], { icon: riderIcon }).addTo(map).bindPopup("<b>🧑‍⚕️ ${mltName}</b><br>Speed: ${speedKmH} km/h • Cold-Chain: 4.2°C (Safe)");

        // Glowing Route Polyline
        const routeCoords = [
          [${hubLat}, ${hubLng}],
          [${(hubLat + currentRiderLat) / 2 + 0.001}, ${(hubLng + currentRiderLng) / 2 + 0.001}],
          [${currentRiderLat}, ${currentRiderLng}],
          [${(currentRiderLat + cLat) / 2 + 0.001}, ${(currentRiderLng + cLng) / 2 + 0.001}],
          [${cLat}, ${cLng}]
        ];

        L.polyline(routeCoords, {
          color: '${isDelivering ? '#8b5cf6' : '#0284c7'}',
          weight: 6,
          opacity: 0.9,
          dashArray: '8, 8'
        }).addTo(map);

        // Traveled Route vs Remaining Route
        L.polyline([[${hubLat}, ${hubLng}], [${currentRiderLat}, ${currentRiderLng}]], {
          color: '#10b981',
          weight: 6,
          opacity: 0.95
        }).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Top Map Engine Bar */}
      <View style={styles.topEngineBar}>
        <View style={styles.engineChips}>
          {[
            { id: 'google', label: '🌐 Google Live' },
            { id: 'cyber', label: '🌙 Cyber Dark' },
            { id: 'satellite', label: '🛰️ Satellite' },
            { id: 'streets', label: '🗺️ Streets' },
          ].map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.engineChip, mapEngine === e.id && styles.engineChipActive]}
              onPress={() => setMapEngine(e.id as any)}
            >
              <Text style={[styles.engineText, mapEngine === e.id && styles.engineTextActive]}>
                {e.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.googleMapsExtBtn}
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&origin=${currentRiderLat},${currentRiderLng}&destination=${cLat},${cLng}`
            )
          }
        >
          <Text style={styles.googleMapsExtText}>Open in Google Maps ↗</Text>
        </TouchableOpacity>
      </View>

      {/* Map Tile Frame */}
      <View style={styles.mapFrame}>
        <iframe
          key={`${mapEngine}-${currentRiderLat.toFixed(4)}-${currentRiderLng.toFixed(4)}`}
          srcDoc={mapHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Instamart Style Live Tracking Map"
        />

        {/* Instamart Speed & Telemetry Floating HUD */}
        <View style={styles.floatingSpeedHud}>
          <View style={styles.speedCircle}>
            <Text style={styles.speedNum}>{speedKmH}</Text>
            <Text style={styles.speedUnit}>KM/H</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.liveRoadText}>📍 Subhash Road ➔ Clock Tower Bypass</Text>
            <Text style={styles.liveEtaText}>
              {isArrived
                ? '📍 Phlebotomist arrived at your gate'
                : isDelivering
                ? '🩸 Blood collected • In cryo-box (4.2°C) en-route to lab'
                : `⚡ ${distanceKm} km away • ETA ~${etaMins} mins`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#0284c7',
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  topEngineBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#030712',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  engineChips: {
    flexDirection: 'row',
    gap: 4,
  },
  engineChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  engineChipActive: {
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
  googleMapsExtBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  googleMapsExtText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  mapFrame: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#020617',
  },
  floatingSpeedHud: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  speedCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  speedNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 16,
  },
  speedUnit: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#bae6fd',
  },
  liveRoadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  liveEtaText: {
    fontSize: 10,
    color: '#34d399',
    marginTop: 2,
    fontWeight: '700',
  },
});
