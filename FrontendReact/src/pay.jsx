import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Pay = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { totalAmount, formData, spotName, slotId } = location.state || {};

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    nameOnCard: "",
    expiry: "",
    cvv: "",
    paymentMethod: "Card",
  });

  const handleChange = (e) => {
    setPaymentDetails({
      ...paymentDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handlePay = () => {
    // Fake validation
    if (paymentDetails.cardNumber.length < 12 || !paymentDetails.nameOnCard) {
      alert("Please enter valid payment details");
      return;
    }

    alert("✅ Payment successful!");

    // Redirect to ticket page with details
    navigate("/ticket", {
      state: {
        formData,
        spotName,
        slotId,
        totalAmount
      }
    });
  };

  return (
    <div style={{
      padding: "3rem",
      fontFamily: "sans-serif",
      backgroundColor: "#121212",
      color: "white",
      minHeight: "100vh",
    }}>
      <h2>Payment for ₹{totalAmount}</h2>

      <div style={{ marginTop: "1rem" }}>
        <label>Card Number</label><br />
        <input
          type="text"
          name="cardNumber"
          value={paymentDetails.cardNumber}
          onChange={handleChange}
          placeholder="1234 5678 9012 3456"
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label>Name on Card</label><br />
        <input
          type="text"
          name="nameOnCard"
          value={paymentDetails.nameOnCard}
          onChange={handleChange}
          placeholder="Full Name"
        />
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <div>
          <label>Expiry</label><br />
          <input
            type="month"
            name="expiry"
            value={paymentDetails.expiry}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>CVV</label><br />
          <input
            type="password"
            name="cvv"
            maxLength={3}
            value={paymentDetails.cvv}
            onChange={handleChange}
            placeholder="123"
          />
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label>Payment Method</label><br />
        <select
          name="paymentMethod"
          value={paymentDetails.paymentMethod}
          onChange={handleChange}
        >
          <option>Card</option>
          <option>UPI</option>
          <option>Net Banking</option>
        </select>
      </div>

      <button
        onClick={handlePay}
        style={{
          marginTop: "2rem",
          backgroundColor: "#61dafb",
          border: "none",
          padding: "0.75rem 2rem",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Pay Now
      </button>
    </div>
  );
};

export default Pay;