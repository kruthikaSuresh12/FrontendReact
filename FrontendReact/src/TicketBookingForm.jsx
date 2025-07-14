import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import './App.css';

const TicketBookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const spotName = location.state?.spotName || "Ticket Booking";
  const amountPerHour = location.state?.amountPerHour || 0;

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
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const [startH, startM] = formData.startTime.split(":").map(Number);
      const [endH, endM] = formData.endTime.split(":").map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes > 0) {
        const hours = durationMinutes / 60;
        const cost = Math.ceil(hours * amountPerHour);
        setTotalAmount(cost);
      } else {
        setTotalAmount(0);
      }
    }
  }, [formData.startTime, formData.endTime, amountPerHour]);

  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    const newErrors = {};
    // ... (keep your existing validation logic)
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
      try {
        const response = await fetch("http://localhost:5000/api/book-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, spotName }),
        });
        const result = await response.json();
        if (response.ok) {
          navigate("/pay", {
            state: { formData, spotName, slotId: result.slotId, totalAmount }
          });
        } else {
          alert(result.error || "Booking failed");
        }
      } catch (err) {
        console.error("Booking error:", err);
        alert("Server error");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center p-4">
      <div className="relative w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-12 left-0 flex items-center text-white hover:text-blue-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">{spotName}</h2>
              <p className="text-gray-400 mt-2">Book your parking spot</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Car Number */}
              <div>
                <label htmlFor="carNumber" className="block text-sm font-medium text-gray-300 mb-2">
                  Car Number
                </label>
                <input
                  type="text"
                  id="carNumber"
                  name="carNumber"
                  value={formData.carNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="DL01AB1234"
                />
                {errors.carNumber && <p className="mt-1 text-sm text-red-400">{errors.carNumber}</p>}
              </div>

              {/* License */}
              <div>
                <label htmlFor="license" className="block text-sm font-medium text-gray-300 mb-2">
                  License
                </label>
                <input
                  type="text"
                  id="license"
                  name="license"
                  value={formData.license}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="DL1234567890"
                />
                {errors.license && <p className="mt-1 text-sm text-red-400">{errors.license}</p>}
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  min={today}
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {errors.date && <p className="mt-1 text-sm text-red-400">{errors.date}</p>}
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {errors.startTime && <p className="mt-1 text-sm text-red-400">{errors.startTime}</p>}
              </div>

              {/* Driver Name */}
              <div>
                <label htmlFor="driverName" className="block text-sm font-medium text-gray-300 mb-2">
                  Driver Name
                </label>
                <input
                  type="text"
                  id="driverName"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="John Doe"
                />
                {errors.driverName && <p className="mt-1 text-sm text-red-400">{errors.driverName}</p>}
              </div>

              {/* Customer Phone */}
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300 mb-2">
                  Customer Phone
                </label>
                <input
                  type="text"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="9876543210"
                />
                {errors.customerPhone && <p className="mt-1 text-sm text-red-400">{errors.customerPhone}</p>}
              </div>

              {/* Owner Name */}
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
                  Owner Name
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Jane Smith"
                />
                {errors.ownerName && <p className="mt-1 text-sm text-red-400">{errors.ownerName}</p>}
              </div>

              {/* Owner Phone */}
              <div>
                <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-300 mb-2">
                  Owner Phone
                </label>
                <input
                  type="text"
                  id="ownerPhone"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="9876543210"
                />
                {errors.ownerPhone && <p className="mt-1 text-sm text-red-400">{errors.ownerPhone}</p>}
              </div>

              {/* Total Amount (full width) */}
              <div className="md:col-span-2">
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-300 mb-2">
                  Total Amount
                </label>
                <input
                  type="text"
                  id="totalAmount"
                  value={`₹${totalAmount}`}
                  disabled
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-bold focus:outline-none"
                />
              </div>

              {/* Submit Button (full width) */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Book Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketBookingForm;