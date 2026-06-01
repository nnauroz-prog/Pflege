import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KATEGORIE_ICON } from './constants.js';

const STATUS_FARBE = {
  neu: '#6b7280',
  kontaktiert: '#2563eb',
  termin: '#d97706',
  gewonnen: '#0e7c66',
  kein_interesse: '#cbd5e1',
};

// Karte mit allen Zuweiser-Pins (farbig nach Status) und der Fahrplan-Route.
export default function MapView({ center, leads, route }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  // Karte einmalig initialisieren
  useEffect(() => {
    if (mapRef.current || !elRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([center?.lat || 51.16, center?.lon || 10.45], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Marker + Route bei Datenänderung neu zeichnen
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const punkte = [];

    if (center) {
      L.marker([center.lat, center.lon], {
        icon: L.divIcon({
          className: '',
          html: '<div class="pin-center">📍</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      })
        .bindPopup(`<b>Dein Einsatzgebiet</b><br>${center.label || ''}`)
        .addTo(layer);
      punkte.push([center.lat, center.lon]);
    }

    for (const l of leads) {
      if (l.lat == null) continue;
      const farbe = STATUS_FARBE[l.status] || '#6b7280';
      L.circleMarker([l.lat, l.lon], {
        radius: 7 + Math.round((l.potenzial_score || 0) / 25),
        color: '#fff',
        weight: 1.5,
        fillColor: farbe,
        fillOpacity: 0.9,
      })
        .bindPopup(
          `<b>${KATEGORIE_ICON[l.kategorie] || ''} ${l.name}</b><br>` +
            `${l.adresse || ''} · ${l.distanz_km} km<br>` +
            `Potenzial: <b>${l.potenzial_score}</b> · Status: ${l.status}` +
            (l.telefon ? `<br>☎ ${l.telefon}` : '')
        )
        .addTo(layer);
      punkte.push([l.lat, l.lon]);
    }

    // Route als Linie (in Reihenfolge des Fahrplans)
    if (route && route.length > 1) {
      const linie = [];
      if (center) linie.push([center.lat, center.lon]);
      for (const r of route) if (r.lat != null) linie.push([r.lat, r.lon]);
      L.polyline(linie, { color: '#0e7c66', weight: 3, opacity: 0.6, dashArray: '6 6' }).addTo(layer);
    }

    if (punkte.length) {
      map.fitBounds(L.latLngBounds(punkte).pad(0.15));
    }
  }, [center, leads, route]);

  return <div ref={elRef} className="map" />;
}
