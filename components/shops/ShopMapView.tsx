'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import L from 'leaflet';
import type { ShopBookmark } from '@/types';

// Leaflet CSS はグローバルで読み込む必要がある
import 'leaflet/dist/leaflet.css';

// Leaflet デフォルトアイコン修正
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ShopMapViewProps {
  bookmarks: ShopBookmark[];
}

export default function ShopMapView({ bookmarks }: ShopMapViewProps) {
  useEffect(() => {
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  const markersData = bookmarks.filter(
    (b): b is ShopBookmark & { lat: number; lng: number } => b.lat != null && b.lng != null,
  );

  // 中心座標: マーカーがあればその平均、なければ東京
  const center: [number, number] =
    markersData.length > 0
      ? [
          markersData.reduce((s, b) => s + b.lat, 0) / markersData.length,
          markersData.reduce((s, b) => s + b.lng, 0) / markersData.length,
        ]
      : [35.6812, 139.7671];

  return (
    <Box sx={{ height: 500, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markersData.map((bookmark) => (
          <Marker key={bookmark.id} position={[bookmark.lat, bookmark.lng]}>
            <Popup>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {bookmark.name}
              </Typography>
              {bookmark.machineCount && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  DL3：{bookmark.machineCount.dl3} / DL2：{bookmark.machineCount.dl2}
                </Typography>
              )}
              <MuiLink
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bookmark.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
              >
                Google Maps で開く
              </MuiLink>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
