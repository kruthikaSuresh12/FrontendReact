import { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  LoadScript,
  DirectionsRenderer,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "90vh",
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const toRad = deg => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // meters
};

const MapComponent = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      err => alert("Enable location access.")
    );
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/spots")
      .then(res => res.json())
      .then(data => {
        setSpots(data);
      });
  }, []);

  useEffect(() => {
    if (userLocation && spots.length > 0) {
      const nearby = spots.filter(spot => {
        const dist = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          spot.lat,
          spot.lng
        );
        return dist <= 2000;
      });
      setNearbySpots(nearby);
    }
  }, [userLocation, spots]);

  const handleClick = spot => {
    setSelectedSpot(spot);

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: spot.lat, lng: spot.lng },
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
          const km =
            result.routes[0].legs[0].distance.value / 1000;
          setDistanceKm(km.toFixed(2));
        } else {
          console.error("Directions request failed", status);
        }
      }
    );
  };

  const [search, setSearch] = useState("");

const filteredSpots = nearbySpots.filter(spot =>
  spot.place.toLowerCase().includes(search.toLowerCase())
);


  return (
<div style={{ 
  padding: "2rem", 
  fontFamily: "sans-serif", 
  backgroundColor: "#1e1e1e", 
  color: "white", 
  minHeight: "100vh", 
  boxSizing: "border-box" 
}}>

    <h1>Nearby Spots</h1>

    {/*  Search bar */}
    <input
      type="text"
      placeholder="Search spots..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{
  padding: "0.75rem",
  width: "100%",
  marginBottom: "1rem",
  borderRadius: "8px",
  border: "1px solid #888",
  fontSize: "1rem",
  backgroundColor: "#121212",
  color: "white"
}}


    />

    {/* Google Map */}
    <div style={{ 
  height: "400px", 
  marginBottom: "1rem", 
  borderRadius: "8px", 
  overflow: "hidden",
  border: "1px solid #444"
}}
>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={{ height: "100%", width: "100%" }}
          center={userLocation || { lat: 0, lng: 0 }}
          zoom={15}
        >
          {userLocation && (
            <Marker position={userLocation} label="You" />
          )}

          {filteredSpots.map((spot) => (
            <Marker
              key={spot.id}
              position={{ lat: spot.lat, lng: spot.lng }}
              label={spot.place}
              title={spot.place}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>

    {/* 📋 List of nearby spots */}
    <div style={{ 
  maxHeight: "300px", 
  overflowY: "auto", 
  paddingRight: "0.5rem"
}}
>
      {filteredSpots.map((spot) => (
        <div key={spot.id} style={{
  background: "#2c2c2c",
  padding: "1rem",
  marginBottom: "0.75rem",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #444"
}}
>
          <div>{spot.place}</div>
          <button style={{
  backgroundColor: "#61dafb",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  color: "black"
}}
>
            Book Slot
          </button>
        </div>
      ))}
    </div>
  </div>
);

};

export default MapComponent;
