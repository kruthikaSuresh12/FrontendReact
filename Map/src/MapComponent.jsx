import { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  LoadScript,
  DirectionsRenderer,
  DirectionsService,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "90vh",
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

const MapComponent = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [search, setSearch] = useState("");
  const [tracking, setTracking] = useState(false);



  // Fetch user location using Geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Geolocation API fetched:");
          console.log("Latitude:", latitude);
          console.log("Longitude:", longitude);
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          alert("Location access denied. Using default coordinates.");
          setUserLocation({ lat: 0, lng: 0 }); // Fallback
        }
      );
    } else {
      console.error("Geolocation not supported");
      setUserLocation({ lat: 0, lng: 0 }); // Fallback
    }
  }, []);

  // Fetch spots from API
  useEffect(() => {
    fetch("http://localhost:5000/api/spots")
      .then((res) => res.json())
      .then((data) => setSpots(data));
  }, []);

  // Filter spots within 200km
  useEffect(() => {
    if (userLocation && spots.length > 0) {
      const nearby = spots.filter((spot) => {
        const dist = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          spot.lat,
          spot.lng
        );
        return dist <= 20000; // 200km in meters
      });
      setNearbySpots(nearby);
    }
  }, [userLocation, spots]);

  useEffect(() => {
  let interval;
  if (tracking) {
    interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);

          // Recalculate route
          if (selectedSpot) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
              {
                origin: newLocation,
                destination: { lat: selectedSpot.lat, lng: selectedSpot.lng },
                travelMode: window.google.maps.TravelMode.WALKING,
              },
              (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                  setDirections(result);
                } else {
                  console.error("Error updating route:", status);
                }
              }
            );
          }
        },
        (error) => console.error("Real-time tracking error:", error),
        { enableHighAccuracy: true }
      );
    }, 5000); // every 5 seconds
  }
  return () => clearInterval(interval);
}, [tracking, selectedSpot]);


  // Directions logic (unchanged)
  const handleClick = (spot) => {
    setSelectedSpot(spot);
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: spot.lat, lng: spot.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status ===  window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          setDistanceKm((result.routes[0].legs[0].distance.value / 1000).toFixed(2));
        }else{
           console.error(`Error fetching directions: ${status}`);
        }
      }
    );
  };

  // Filter spots by search term
  const filteredSpots = nearbySpots.filter((spot) =>
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
          color: "white",
        }}
      />

      {/* Google Map */}
      <div style={{ 
        height: "400px", 
        marginBottom: "1rem", 
        borderRadius: "8px", 
        overflow: "hidden",
        border: "1px solid #444",
      }}>
        <LoadScript googleMapsApiKey={import.meta.env.VITE_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ height: "100%", width: "100%" }}
            center={userLocation || { lat: 0, lng: 0 }}
            zoom={15}
           >


            {userLocation && <Marker position={userLocation} 
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            label="You"
            />}
            {filteredSpots.map((spot) => (
           <Marker
              key={spot.id}
              position={{ lat: spot.lat, lng: spot.lng }}
              label={spot.place}
              onClick={() => handleClick(spot)}
            />

            ))}
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </LoadScript>
      </div>
          {selectedSpot && directions && (
  <div style={{
    backgroundColor: "#2c2c2c",
    padding: "1rem",
    borderRadius: "10px",
    marginTop: "1rem",
    border: "1px solid #444",
    color: "white",
  }}>
    <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
      🚗 Drive to {selectedSpot.place}
    </div>
    <div>
      Distance: {directions.routes[0].legs[0].distance.text} <br />
      Duration: {directions.routes[0].legs[0].duration.text}
    </div>
    <div style={{ marginTop: "0.5rem" }}>
      <button 
      onClick={() => setTracking(!tracking)}
      style={{
    backgroundColor: tracking ? "red" : "#61dafb",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "black",
  }}>
        {tracking ? "Stop" : "Start"}
</button>
    </div>
  </div>
)}

          {directions && (
          <div style={{ color: "white", padding: "1rem" }}>
          Distance: {
          directions.routes[0].legs[0].distance.text
        } ({directions.routes[0].legs[0].duration.text})
        </div>
        )}

      {/* Nearby spots list */}
      <div style={{ 
        maxHeight: "300px", 
        overflowY: "auto", 
        paddingRight: "0.5rem",
      }}>
        {filteredSpots.map((spot) => (
          <div
            key={spot.id}
            style={{
              background: "#2c2c2c",
              padding: "1rem",
              marginBottom: "0.75rem",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #444",
            }}
          >
            <div>{spot.place}</div>
            <button
              style={{
                backgroundColor: "#61dafb",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                color: "black",
              }}
              //onClick={() => handleClick(spot)}
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