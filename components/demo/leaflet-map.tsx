'use client';

import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Donor = { lat: number; lng: number; group: string; days: number };

export default function LeafletMap({ center, donors }: { center: [number, number]; donors: Donor[] }) {
  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: 280, width: '100%' }} className="z-0">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap contributors & CartoDB"
      />
      <Circle center={center} radius={10000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08 }} />
      {donors.map((d, i) => {
        const color = d.days >= 120 ? '#059669' : d.days >= 90 ? '#f59e0b' : '#ef4444';
        const opacity = d.days >= 90 ? 1 : 0.8;
        return (
          <CircleMarker key={i} center={[d.lat, d.lng]} radius={7} pathOptions={{ color, fillColor: color, fillOpacity: 0.9, opacity }}>
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
              <div className="text-xs">
                <div className="font-semibold">{d.group}</div>
                <div>{d.days} days</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}


