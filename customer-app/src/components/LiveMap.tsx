import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export interface LiveMapProps {
  customerCoords: { lat: number; lng: number };
  customerAddressLine: string;
  mltCoords: { lat: number; lng: number } | null;
  mltName: string;
  orderStatus: string;
}

export default function LiveMap({
  customerCoords,
  customerAddressLine,
  mltCoords,
  mltName,
  orderStatus,
}: LiveMapProps) {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={{
        latitude: customerCoords.lat,
        longitude: customerCoords.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker
        coordinate={{
          latitude: customerCoords.lat,
          longitude: customerCoords.lng,
        }}
        title="Your Location"
        description={customerAddressLine}
        pinColor="#0284c7"
      />
      {mltCoords && (
        <Marker
          coordinate={{
            latitude: mltCoords.lat,
            longitude: mltCoords.lng,
          }}
          title={mltName || 'Technician'}
          description="On the way to you"
          pinColor="#10b981"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
