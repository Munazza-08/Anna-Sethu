import { useEffect, useRef, useState } from 'react';
import './MapTracker.css';

// Fetch real road route via OSRM (free, no API key)
async function getRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      return {
        coords:   data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distance: (data.routes[0].distance / 1000).toFixed(1),
        duration: Math.ceil(data.routes[0].duration / 60),
      };
    }
  } catch {
    console.warn('OSRM unavailable — using straight line');
  }
  return null;
}

export default function MapTracker({
  donorLat, donorLng,
  volunteerLat, volunteerLng,
  volunteerName = 'Volunteer',
  status = 'accepted',
  requestTitle = 'Food Request',
  onClose,
  isVolunteer = false,
}) {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);
  const volMarker = useRef(null);
  const routeLine = useRef(null);
  const watchId   = useRef(null);
  const [routeInfo, setRouteInfo]   = useState(null);
  const [myLoc,     setMyLoc]       = useState(null);
  const [volPos, setVolPos] = useState(
  volunteerLat != null && volunteerLng != null
    ? { lat: volunteerLat, lng: volunteerLng }
    : null
);

  // ── Init Leaflet map ────────────────────────────────────────────
  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((Lmod) => {
      const L = Lmod.default;
      if (mapObj.current) return;

      // Fix default icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const donorIcon = L.divIcon({
        className: '',
        html: `<div class="map-pin donor-pin"><div class="pin-inner">🏠</div><div class="pin-pulse"></div></div>`,
        iconSize: [48, 48], iconAnchor: [24, 48],
      });

      const volunteerIcon = L.divIcon({
        className: '',
        html: `<div class="map-pin volunteer-pin"><div class="pin-inner">🚴</div></div>`,
        iconSize: [48, 48], iconAnchor: [24, 24],
      });

      const centerLat = volunteerLat || donorLat || 13.0827;
      const centerLng = volunteerLng || donorLng || 80.2707;

      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 15,
        zoomControl: false,
      });
      mapObj.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Donor / pickup marker
      if (donorLat && donorLng) {
        L.marker([donorLat, donorLng], { icon: donorIcon })
          .addTo(map)
          .bindPopup(`<b>📍 Pickup</b><br/>${requestTitle}`);
      }

      // Initial volunteer marker
      if (volunteerLat && volunteerLng) {
        volMarker.current = L.marker([volunteerLat, volunteerLng], { icon: volunteerIcon })
          .addTo(map)
          .bindPopup(`<b>🚴 ${volunteerName}</b>`);
      }

      // Live GPS for volunteer
      if (isVolunteer) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setMyLoc({ lat, lng });

            if (!volMarker.current) {
              volMarker.current = L.marker([lat, lng], { icon: volunteerIcon })
                .addTo(map)
                .bindPopup('<b>📍 You are here</b>');
            } else {
              volMarker.current.setLatLng([lat, lng]);
            }
            map.panTo([lat, lng], { animate: true, duration: 0.8 });
          },
          (err) => console.warn('GPS error:', err),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
      }
    });

    return () => {
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);
// ── Sync volunteer coordinates from props ──────────────────────
  useEffect(() => {
    if (volunteerLat == null || volunteerLng == null) return;

    setVolPos({
      lat: volunteerLat,
      lng: volunteerLng,
    });
  }, [volunteerLat, volunteerLng]);
  // ── Update route whenever positions change ───────────────────────
  useEffect(() => {
    const vLat = isVolunteer ? myLoc?.lat  : (volPos?.lat  || volunteerLat);
    const vLng = isVolunteer ? myLoc?.lng  : (volPos?.lng  || volunteerLng);

    if (!mapObj.current || !vLat || !vLng || !donorLat || !donorLng) return;

    import('leaflet').then((Lmod) => {
      const L = Lmod.default;

      const volunteerIcon = L.divIcon({
        className: '',
        html: `<div class="map-pin volunteer-pin"><div class="pin-inner">🚴</div></div>`,
        iconSize: [48, 48], iconAnchor: [24, 24],
      });

      // Move volunteer marker (donor's view)
      if (!isVolunteer) {
        if (!volMarker.current) {
          volMarker.current = L.marker([vLat, vLng], { icon: volunteerIcon })
            .addTo(mapObj.current)
            .bindPopup(`<b>🚴 ${volunteerName}</b>`);
        } else {
          volMarker.current.setLatLng([vLat, vLng]);
        }
      }

      // Draw route
      (async () => {
        if (routeLine.current) mapObj.current.removeLayer(routeLine.current);

        const route = await getRoute(vLat, vLng, donorLat, donorLng);
        if (route) {
          setRouteInfo(route);
          routeLine.current = L.polyline(route.coords, {
            color: '#ff6b35', weight: 5, opacity: 0.85, lineJoin: 'round',
          }).addTo(mapObj.current);
        } else {
          routeLine.current = L.polyline([[vLat, vLng], [donorLat, donorLng]], {
            color: '#ff6b35', weight: 4, opacity: 0.7, dashArray: '10, 8',
          }).addTo(mapObj.current);
        }

        mapObj.current.fitBounds(
          L.latLngBounds([[vLat, vLng], [donorLat, donorLng]]),
          { padding: [60, 60], animate: true }
        );
      })();
    });
  }, [myLoc, volPos, volunteerLat, volunteerLng, donorLat, donorLng]);

  const statusSteps = ['pending', 'accepted', 'in_transit', 'delivered'];
  const stepIdx     = statusSteps.indexOf(status);
  const stepLabels  = ['Posted', 'Accepted', 'In Transit', 'Delivered'];
  const arrivalText = routeInfo
    ? `Arriving in ~${routeInfo.duration} min`
    : isVolunteer
      ? 'Detecting your location…'
      : 'Waiting for volunteer location…';

  return (
    <div className="map-tracker-overlay">
      {/* Header */}
      <div className="mt-header">
        <button className="mt-back" onClick={onClose}>←</button>
        <div className="mt-header-info">
          <span className="mt-title">{requestTitle}</span>
          <span className="mt-subtitle" style={{
            color: { pending:'#f59e0b', accepted:'#3b82f6', in_transit:'#ff6b35', delivered:'#10b981' }[status] || '#fff'
          }}>
            {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        {routeInfo && <span className="mt-distance">📍 {routeInfo.distance} km</span>}
      </div>

      {/* Map */}
      <div className="mt-map" ref={mapRef} />

      {/* Bottom panel */}
      <div className="mt-bottom-panel">
        <div className="mt-arrival">
          <div className="mt-arrival-text">{arrivalText}</div>
          {status === 'delivered' && <div className="mt-delivered-badge">✅ Delivered!</div>}
        </div>

        {/* Progress stepper */}
        <div className="mt-stepper">
          {stepLabels.map((label, i) => (
            <div key={i} className={`mt-step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}`}>
              <div className="mt-step-dot" />
              {i < stepLabels.length - 1 && <div className="mt-step-line" />}
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Volunteer info row */}
        <div className="mt-volunteer-row">
          <div className="mt-vol-avatar">🚴</div>
          <div className="mt-vol-info">
            <strong>{volunteerName}</strong>
            <small>{isVolunteer ? 'You are the delivery partner' : 'Is on the way to deliver'}</small>
          </div>
          {!isVolunteer && <a href="tel:" className="mt-call-btn">📞</a>}
        </div>

        {routeInfo && (
          <div className="mt-route-info">
            <span>🛣️ {routeInfo.distance} km route</span>
            <span>⏱️ ~{routeInfo.duration} mins away</span>
          </div>
        )}
      </div>
    </div>
  );
}
