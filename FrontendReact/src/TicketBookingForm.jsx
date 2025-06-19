import React, { useState } from 'react';
import './TicketBookingForm.css';
import { useLocation } from "react-router-dom";

const TicketBookingForm = () => {
  const location = useLocation();
  const spotName = location.state?.spotName || "Ticket Booking"; // from BookSlot.jsx

  const [formData, setFormData] = useState({
    carNumber: '',
    license: '',
    startTime: '',
    endTime: '',
    driverName: '',
    customerPhone: '',
    date: '',
    ownerName: '',
    ownerPhone: '',
  });

  const [errors, setErrors] = useState({});

  // Get today's date in yyyy-mm-dd format for disabling past dates
  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    const newErrors = {};

    if (!/^[A-Za-z0-9]{6,10}$/.test(formData.carNumber))
      newErrors.carNumber = "Invalid car number";

    if (!/^[A-Za-z0-9]{6,}$/.test(formData.license))
      newErrors.license = "License must be at least 6 alphanumeric characters";

    if (!formData.startTime || !formData.endTime)
      newErrors.startTime = "Start and end times are required";
    else if (formData.startTime >= formData.endTime)
      newErrors.startTime = "End time must be after start time";

    if (!/^[A-Za-z\s]{3,}$/.test(formData.driverName))
      newErrors.driverName = "Driver name must be at least 3 letters";

    if (!/^\d{10}$/.test(formData.customerPhone))
      newErrors.customerPhone = "Invalid phone number";

    if (!formData.date)
      newErrors.date = "Date is required";

    if (!/^[A-Za-z\s]{3,}$/.test(formData.ownerName))
      newErrors.ownerName = "Owner name must be at least 3 letters";

    if (!/^\d{10}$/.test(formData.ownerPhone))
      newErrors.ownerPhone = "Invalid phone number";

    // Prevent booking in past date/time
    const now = new Date();
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
    if (start < now || end < now) {
      newErrors.date = "Booking date/time cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const bookingData = { ...formData, spotName };

      try {
        const response = await fetch("http://localhost:5000/api/book-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });

        const result = await response.json();
        if (response.ok) {
          alert(result.message || "Ticket Booked!");
        } else {
          alert(result.error || result.message || "Booking failed");
        }
      } catch (err) {
        console.error("Booking error:", err);
        alert("Server error");
      }
    } else {
      alert("Please fix the errors");
    }
  };

  return (
    <div className="form-container">
      <h2>{spotName}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Car Number</label>
          <input
            type="text"
            name="carNumber"
            value={formData.carNumber}
            onChange={handleChange}
            placeholder="Enter Car Number"
          />
          {errors.carNumber && <p className="error">{errors.carNumber}</p>}
        </div>

        <div>
          <label>License</label>
          <input
            type="text"
            name="license"
            value={formData.license}
            onChange={handleChange}
            placeholder="Enter License"
          />
          {errors.license && <p className="error">{errors.license}</p>}
        </div>

        <div>
          <label>Start Time</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>End Time</label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
          />
          {errors.startTime && <p className="error">{errors.startTime}</p>}
        </div>

        <div>
          <label>Driver Name</label>
          <input
            type="text"
            name="driverName"
            value={formData.driverName}
            onChange={handleChange}
            placeholder="Enter Driver Name"
          />
          {errors.driverName && <p className="error">{errors.driverName}</p>}
        </div>

        <div>
          <label>Customer Phone</label>
          <input
            type="text"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            placeholder="Enter Customer Phone"
          />
          {errors.customerPhone && <p className="error">{errors.customerPhone}</p>}
        </div>

        <div>
          <label>Date</label>
          <input
            type="date"
            name="date"
            min={today}
            value={formData.date}
            onChange={handleChange}
          />
          {errors.date && <p className="error">{errors.date}</p>}
        </div>

        <div>
          <label>Owner Name</label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            placeholder="Enter Owner Name"
          />
          {errors.ownerName && <p className="error">{errors.ownerName}</p>}
        </div>

        <div>
          <label>Owner Phone</label>
          <input
            type="text"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
            placeholder="Enter Owner Phone"
          />
          {errors.ownerPhone && <p className="error">{errors.ownerPhone}</p>}
        </div>

        <button type="submit">Book Ticket</button>
      </form>
    </div>
  );
};

export default TicketBookingForm;
