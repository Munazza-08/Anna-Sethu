import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MoveMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 16);
    }
  }, [position, map]);

  return null;
}

export default function LiveLocationMap() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!sharing) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setSharing(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (location) => {
        setPosition({
          lat: location.coords.latitude,
          lng: location.coords.longitude
        });
        setError("");
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [sharing]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Volunteer Live Location</h2>

      <button
        onClick={() => {
          setError("");
          setSharing(true);
        }}
        disabled={sharing}
      >
        Start Sharing Location
      </button>

      <button
        onClick={() => setSharing(false)}
        disabled={!sharing}
        style={{ marginLeft: "10px" }}
      >
        Stop Sharing
      </button>

      <p>
        Status: {sharing ? "Sharing location" : "Not sharing"}
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {position && (
        <p>
          Latitude: {position.lat.toFixed(6)} <br />
          Longitude: {position.lng.toFixed(6)}
        </p>
      )}

      <MapContainer
        center={[14.4673, 78.8242]}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {position && (
          <>
            <MoveMap position={position} />
            <CircleMarker
              center={[position.lat, position.lng]}
              radius={10}
              pathOptions={{ color: "orange", fillOpacity: 1 }}
            >
              <Popup>Your current location</Popup>
            </CircleMarker>
          </>
        )}
      </MapContainer>
    </div>
  );
}