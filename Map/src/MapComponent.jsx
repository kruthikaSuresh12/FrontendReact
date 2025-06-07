import { useEffect, useState } from "react";
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "60vh",
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const toRad = deg => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in meters
}

const MapComponent = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        err => {
          console.error("Geolocation error:", err);
          alert("Please allow location access for accurate results.");
        }
      );
    } else {
      alert("Geolocation not supported by your browser.");
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/spots")
      .then(res => res.json())
      .then(data => setSpots(data))
      .catch(err => console.error("Failed to fetch spots", err));
  }, []);

  useEffect(() => {
    if (userLocation && spots.length > 0) {
      const nearby = spots.filter(spot => {
        const dist = haversineDistance(
          parseFloat(userLocation.lat),
          parseFloat(userLocation.lng),
          parseFloat(spot.lat),
          parseFloat(spot.lng)
        );
        return dist < 2000; // 2km
      });
      setNearbySpots(nearby);
    }
  }, [userLocation, spots]);

  const filteredSpots = nearbySpots.filter(spot =>
    spot.place.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial" }}>
      <input
        type="text"
        placeholder="Search bar"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          marginBottom: "10px",
          borderRadius: "5px",
          border: "1px solid #ccc"
        }}
      />
      <h3>Spots Near You</h3>

      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLocation || { lat: 0, lng: 0 }}
          zoom={15}
        >
          {userLocation && <Marker position={userLocation} label="You" />}
          {filteredSpots.map((spot, index) => (
            <Marker
              key={spot.id}
              position={{ lat: spot.lat, lng: spot.lng }}
              label={spot.place}
              title={spot.place}
            />
          ))}
        </GoogleMap>
      </LoadScript>

      {/* 📍 Available Spot List */}
      <div style={{ marginTop: "20px" }}>
        {filteredSpots.map(spot => (
          <div
            key={spot.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              marginBottom: "10px"
            }}
          >
            <span>{spot.place}</span>
            <button style={{
              padding: "6px 12px",
              border: "none",
              backgroundColor: "#007bff",
              color: "#fff",
              borderRadius: "5px",
              cursor: "pointer"
            }}>
              Book Slot
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapComponent;
