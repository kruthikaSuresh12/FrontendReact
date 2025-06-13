import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ContactUs() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call (replace with actual fetch to your backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
      
      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen from-indigo-100 to-purple-100 py-12 px-4 sm:px-6 lg:px-100">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center text-lavender-10 hover:text-lavender-10 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="bg-gradient-to-r from-purple-500 to-purple-300 rounded-2xl shadow-xl overflow-hidden">
        {/* Header with parking-related content */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
            <h1 className="text-3xl font-bold text-white">Parking Spot Assistance</h1>
            <p className="mt-2 text-indigo-100">
              Hassle-free parking solutions at your fingertips
            </p>
          </div>

          <div className="p-8 sm:p-10">
            {/* Parking information */}
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Find & Book Parking Spots Easily</h2>
              <p className="text-gray-600 mb-6">
                Our platform helps you discover available parking spots in real-time, 
                book in advance, and avoid the stress of finding parking in busy areas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <i className="fas fa-map-marker-alt text-indigo-600 text-2xl mb-2"></i>
                  <h3 className="font-semibold text-black">Real-time Availability</h3>
                  <p className="text-sm text-gray-600">See available spots instantly</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <i className="fas fa-calendar-check text-purple-600 text-2xl mb-2"></i>
                  <h3 className="font-semibold text-black">Advance Booking</h3>
                  <p className="text-sm text-gray-600 ">Reserve your spot ahead of time</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <i className="fas fa-clock text-pink-600 text-2xl mb-2"></i>
                  <h3 className="font-semibold text-black">Time-Saving</h3>
                  <p className="text-sm text-gray-600">No more circling for parking</p>
                </div>
              </div>
            </div>

            {/* Contact methods */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Need Help? Contact Us</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-50 rounded-lg p-6 text-center">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block mb-3">
                    <i className="fas fa-phone text-indigo-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Phone</h3>
                  <a href="tel:+919141081733" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                    +91 91410 81733
                  </a>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 text-center">
                  <div className="bg-purple-100 p-3 rounded-full inline-block mb-3">
                    <i className="fas fa-envelope text-purple-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Email</h3>
                  <a href="mailto:kruthika1208@gmail.com" className="text-purple-600 hover:text-purple-800 transition-colors">
                    kruthika1208@gmail.com
                  </a>
                </div>

                <div className="bg-pink-50 rounded-lg p-6 text-center">
                  <div className="bg-pink-100 p-3 rounded-full inline-block mb-3">
                    <i className="fab fa-instagram text-pink-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Instagram</h3>
                  <a 
                    href="https://www.instagram.com/kruthika.s_07?igsh=MTJudjRhc3pzd3hjdw==" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-800 transition-colors"
                  >
                    @kruthika.s_07
                  </a>
                </div>
              </div>
            </div>

            {/* Quick booking CTA */}
            <div className="bg-indigo-50 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-indigo-800 mb-3">Ready to book your parking spot?</h3>
              <p className="text-gray-600 mb-4">Join thousands of happy parkers who save time and stress every day</p>
              <button
            onClick={() => navigate('/findSpot')}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
           Find Available Spots Now
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;