import React, { useState } from 'react';
import './TicketBookingForm.css';

const ParkingPlaceForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    areaLicense: '',
    ownerName: '',
    ownerGmail: '',
    companyEmail: '',
    address: '',
    ownerPhone: '',
    workPhone: '',
    totalSlots: '',
    amountPerHour: '',
    latitude: '',
    longitude: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.companyName.trim())
      newErrors.companyName = "Company name required";

    if (!/^[A-Z0-9-]{4,}$/.test(formData.areaLicense))
      newErrors.areaLicense = "Invalid area license";

    if (!/^[A-Za-z\s]{3,}$/.test(formData.ownerName))
      newErrors.ownerName = "Owner name must be at least 3 letters";

    if (!/^[\w.%+-]+@gmail\.com$/.test(formData.ownerGmail))
      newErrors.ownerGmail = "Only valid Gmail allowed";

    if (!/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.companyEmail))
      newErrors.companyEmail = "Invalid company email";

    if (!formData.address.trim())
      newErrors.address = "Address required";

    if (!/^\d{10}$/.test(formData.ownerPhone))
      newErrors.ownerPhone = "Invalid owner phone number";

    if (!/^\d{10}$/.test(formData.workPhone))
      newErrors.workPhone = "Invalid work phone number";

    if (!/^\d+$/.test(formData.totalSlots) || parseInt(formData.totalSlots) < 1)
      newErrors.totalSlots = "Enter valid slot count (1 or more)";

    if (!/^\d+(\.\d{1,2})?$/.test(formData.amountPerHour) || parseFloat(formData.amountPerHour) <= 0)
      newErrors.amountPerHour = "Enter a valid positive amount";

    if (!/^[-+]?[0-9]*\.?[0-9]+$/.test(formData.latitude))
      newErrors.latitude = "Enter valid latitude";

    if (!/^[-+]?[0-9]*\.?[0-9]+$/.test(formData.longitude))
      newErrors.longitude = "Enter valid longitude";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) {
    alert("Please fix the errors");
    return;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/submit-parking-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Submission failed');
    }

    const result = await response.json();
    alert(result.message || 'Parking Place Info Submitted!');
    // Reset form if needed
    setFormData({
      companyName: '',
      areaLicense: '',
      ownerName: '',
      ownerGmail: '',
      companyEmail: '',
      address: '',
      ownerPhone: '',
      workPhone: '',
      totalSlots: '',
      amountPerHour: '',
      latitude: '',
      longitude: '',
    });

  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Failed to submit parking data');
  }
};

  return (
    <div className="form-container">
      <h2>Parking Place Info</h2>
      <form onSubmit={handleSubmit}>
        {Object.entries(formData).map(([key, value], index) => (
          <div key={index}>
            <label>{key.replace(/([A-Z])/g, ' $1')}</label>
            <input
              type={key.includes('Email') ? 'email' : 'text'}
              name={key}
              value={value}
              placeholder={`Enter ${key}`}
              onChange={handleChange}
            />
            {errors[key] && <p className="error">{errors[key]}</p>}
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ParkingPlaceForm;
