// login.jsx
import { useState } from 'react';
import './App.css';

function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    emailID: '',
    mobNo: '',
    password: '',
    confirm_password: '',
    gender: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Simple validation
    if (formData.password !== formData.confirm_password) {
      alert("Passwords don't match!");
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        alert('Registration successful!');
        window.location.href = '/Mapcomponent';
        // Redirect to login or dashboard
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  return (
    <div className="bg-black flex items-center justify-center mr-10 transform translate-x-140">
      {/* Centered Form Container */}
      <form 
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 rounded-xl shadow-2xl overflow-hidden border-2 border-white/30 p-20 animate-fadeIn"
      >
        {/* Back to Home Button */}
        <button 
          onClick={() => window.location.href = '/'}
          className="absolute top-6 left-6 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition animate-slideDown"
        >
          ← Back to Home
        </button>
        {/* Form Header */}
        <h2 className="text-3xl font-bold mb-8 text-center drop-shadow-lg">
          Create Your Account
        </h2>
        {/* Form Fields */}
        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-white/80 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border-2 border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Enter your full name"
              required
            />
          </div>
          {/* Age Field */}
          <div>
            <label className="block text-white/80 mb-2">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border-2 border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Enter your age"
              min="13"
              required
            />
          </div>
          {/* Email Field */}
          <div>
            <label className="block text-white/80 mb-2">Email Address</label>
            <input
              type="email"
              name="emailID"
              value={formData.emailID}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border-2 border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Enter your email"
              required
            />
          </div>
          {/* Mobile Number Field */}
          <div>
            <label className="block text-white/80 mb-2">Mobile Number</label>
            <input
              type="tel"
              name="mobNo"
              value={formData.mobNo}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border-2 border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Enter your mobile number"
              required
            />
          </div>
          {/* Password Field */}
          <div>
            <label className="block text-white/80 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border-2 border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Create password"
              required
            />
          </div>
          {/* Confirm Password Field */}
          <div>
            <label className="block text-white/80 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border-2 border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Confirm password"
              required
            />
          </div>
          {/* Gender Field */}
          <div>
            <label className="block text-white/80 mb-2">Gender</label>
            <div className="flex space-x-4 justify-center">
              {['Male', 'Female', 'Other'].map(gender => (
                <label key={gender} className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value={gender}
                    checked={formData.gender === gender}
                    onChange={handleChange}
                    className="h-5 w-5 border-2 border-white/30 focus:ring-white/50 text-indigo-600"
                    required
                  />
                  <span className="ml-2 text-white">{gender}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 mt-6"
          >
            Sign Up Now
          </button>
        </div>
      </form>
    </div>
  );
}

export default SignupForm;