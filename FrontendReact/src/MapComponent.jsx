// MapComponent.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from './AuthContext';
import './map.css';
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
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
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_API_KEY,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        () => {
          alert("Location access denied. Using default coordinates.");
          setUserLocation({ lat: 0, lng: 0 });
        }
      );
    } else {
      setUserLocation({ lat: 0, lng: 0 });
    }
  }, []);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/spots`);
        if (!response.ok) throw new Error('Failed to fetch spots');
        const data = await response.json();
        setSpots(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching spots:', err);
        setError(err.message);
      } finally {
        setLoadingSpots(false);
      }
    };
    fetchSpots();
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
              const directionsService = new window.google.maps.DirectionsService();
              directionsService.route(
                {
                  origin: newLocation,
                  destination: { lat: selectedSpot.lat, lng: selectedSpot.lng },
                  travelMode: window.google.maps.TravelMode.WALKING,
                },
                (result, status) => {
                  if (status === "OK") {
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

  const handleClick = async (spot) => {
    setSelectedSpot(spot);
    if (!userLocation) return;

    try {
      const directionsService = new window.google.maps.DirectionsService();
      const result = await new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: userLocation,
            destination: { lat: spot.lat, lng: spot.lng },
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK") resolve(result);
            else reject(new Error(`Directions request failed: ${status}`));
          }
        );
      });

      setDirections(result);
    } catch (err) {
      console.error("Directions error:", err);
      alert("Failed to get directions. Please try again.");
    }
  };

  const filteredSpots = nearbySpots.filter((spot) =>
    (spot.place || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleViewTickets = () => navigate('/my-tickets');
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="map-container">
      <div className="app-header">
        <h1 className="app-title">Parking Spot Finder</h1>
        <div style={{ position: "absolute", top: "1rem", right: "2rem", zIndex: 10 }}>
  <div className="dropdown">
    <button className="dropbtn">☰</button>
<div className="dropdown-content">
  <button onClick={() => navigate("/your-tickets")}>Your Tickets</button>
  <button onClick={() => { logout(); navigate('/'); }}>Logout</button>
</div>
  </div>
</div>

      </div>

      <input
        type="text"
        placeholder="Search parking spots..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <div className="map-content-container">
        <div className="map-wrapper">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={userLocation || { lat: 0, lng: 0 }}
            zoom={15}
          >
            {userLocation && (
              <Marker
                position={userLocation}
                icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
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
        </div>

        <div className="map-sidebar">
          <h2 className="section-title">Parking Spots Near You</h2>

          {loadingSpots && <div className="loading-message">Loading spots...</div>}
          {error && <div className="error-message">Error: {error}</div>}

          {selectedSpot && directions && (
            <div className="directions-info">
              <div className="directions-header">
                🚗 Drive to {selectedSpot.place}
              </div>
              <div>
                Distance: {directions.routes[0].legs[0].distance.text} <br />
                Duration: {directions.routes[0].legs[0].duration.text}
              </div>
              <div className="track-button-container">
                <button
                  onClick={() => setTracking(!tracking)}
                  className={`action-button ${tracking ? 'tracking' : 'track-button'}`}
                >
                  {tracking ? "Stop Tracking" : "Start Tracking"}
                </button>
              </div>
            </div>
          )}

          <div className="spots-list">
            {filteredSpots.map((spot) => (
              <div key={spot.id} className="spot-item">
                <div className="spot-name">{spot.place}</div>
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
                  className="book-button"
                >
                  Book Slot
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
