import { useLocation, useNavigate } from "react-router-dom";

const BookSlot = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) return <div>No spot selected.</div>;

  const { place, address, distance, duration } = state;

  return (
    <div
      style={{
        padding: "3rem",
        backgroundColor: "#121212",
        color: "white",
        fontFamily: "sans-serif",
        minHeight: "100vh",
        marginLeft:"3rem"
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        {place}
      </h1>
      <p><strong>Address:</strong> {address}</p>
      <p><strong>Distance:</strong> {distance}</p>
      <p><strong>Estimated Time:</strong> {duration}</p>

      <button
  onClick={() =>
    navigate('/TicketBookingForm', {
      state: { spotName: place }  // ✅ Pass spot name to next page
    })
  }
  style={{
    marginTop: "2rem",
    backgroundColor: "#61dafb",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#000",
  }}
>
  Continue to Book
</button>

    </div>
  );
};


export default BookSlot;
