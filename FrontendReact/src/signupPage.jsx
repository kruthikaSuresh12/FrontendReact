// src/signupPage.jsx
import { useState } from 'react';
import './App.css';

function SignupPage() {
  const [formData, setFormData] = useState({
    emailID: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Sign Up Successful!');
        window.location.href = '/Mapcomponent'; // Redirect to Find Spot
      } else {
        alert(data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again later.');
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
        <h2 className="text-3xl font-bold mb-8 text-center drop-shadow-lg">Login</h2>

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

        {/* Password Field */}
        <div className="mt-4">
          <label className="block text-white/80 mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border-2 border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            placeholder="Enter password"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 px-6 mt-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Sign In
        </button>

        {/* Forgot Password Link */}
        <div className="mt-4 text-center text-white/80">
          <a href="/forgot-password" className="text-yellow-300 hover:text-yellow-500 transition">
            Forgot Password?
          </a>
        </div>
      </form>
    </div>
  );
}

export default SignupPage;