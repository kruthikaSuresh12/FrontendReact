import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './map.css';

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
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapComponent = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [directions, setDirections] = useState(null);
  const [search, setSearch] = useState("");
  const [tracking, setTracking] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          alert("Location access denied. Using default coordinates.");
          setUserLocation({ lat: 0, lng: 0 });
        }
      );
    } else {
      setUserLocation({ lat: 0, lng: 0 });
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:5001/api/spots")
      .then((res) => res.json())
      .then((data) => setSpots(data));
  }, []);

  useEffect(() => {
    if (userLocation && spots.length > 0) {
      const nearby = spots.filter((spot) => {
        const dist = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          spot.lat,
          spot.lng
        );
        return dist <= 1000000;
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

            if (selectedSpot) {
              const directionsService =
                new window.google.maps.DirectionsService();
              directionsService.route(
                {
                  origin: newLocation,
                  destination: { lat: selectedSpot.lat, lng: selectedSpot.lng },
                  travelMode: window.google.maps.TravelMode.WALKING,
                },
                (result, status) => {
                  if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                  }
                }
              );
            }
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [tracking, selectedSpot]);

  const handleClick = (spot) => {
    setSelectedSpot(spot);
    console.log("User Location:", userLocation);
    console.log("Destination:", spot.lat, spot.lng);

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: spot.lat, lng: spot.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        console.log("Directions status:", status, result);
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error("Directions failed:", status);
        }
      }
    );
  };

  const filteredSpots = nearbySpots.filter((spot) =>
  (spot.place || "").toLowerCase().includes(search.toLowerCase())
);


  return (
    <div
      style={{
        padding: "3rem",
        fontFamily: "sans-serif",
        backgroundColor: "#0e0808ff",
        color: "white",
        minHeight: "10vh",
        boxSizing: "border-box",
        marginRight: "25rem",
      }}
    >
      <div className="app-header">
  <h1 className="app-title">Google Map Nearby Spot</h1>
</div>

      <input
  type="text"
  placeholder="Search bar"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="search-input"
/>

      <h2 className="section-title">Spots Near You</h2>

      <div
        style={{
          height: "400px",
          marginBottom: "1.5rem",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #444",
        }}
      >
        <div className="map-wrapper">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ height: "100%", width: "100%" }}
            center={userLocation || { lat: 0, lng: 0 }}
            zoom={11}
          >
            {userLocation && (
              <Marker
                position={userLocation}
                icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                label="You"
              />
            )}
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
      </div>

      {selectedSpot && directions && (
        <div
          style={{
            backgroundColor: "#2c2c2c",
            padding: "1rem",
            borderRadius: "10px",
            marginTop: "1rem",
            border: "1px solid #444",
            color: "white",
          }}
        >
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
  className={`action-button ${tracking ? 'tracking' : 'track-button'}`}
>
  {tracking ? "Stop" : "Start"}
</button>
          </div>
        </div>
      )}

      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          paddingRight: "0.5rem",
          marginTop: "1rem",
        }}
      >
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
  onClick={() => {
    if (!userLocation) return alert("User location not available");

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: spot.lat, lng: spot.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          const leg = result.routes[0].legs[0];
          navigate("/book-slot", {
          state: {
          place: spot.place,
          address: leg.end_address,
          distance: leg.distance.text,
          duration: leg.duration.text,
          amountPerHour: spot.amount_per_hour   
          }
        });

        } else {
          alert("Failed to fetch directions");
        }
      }
    );
  }}
  style={{
    backgroundColor: "#0d6efd",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "white",
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
