//Ticket.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './App.css';

const Ticket = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state || !state.formData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-8 text-center">
          <p className="text-white">No ticket information found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const { formData, spotName, slotId, totalAmount } = state;
  const {
    carNumber,
    license,
    startTime,
    endTime,
    driverName,
    customerPhone,
    date,
    ownerName,
    ownerPhone
  } = formData;

  return (
    <div className="min-h-screen flex items-center p-4">
      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/MapComponent')}
          className="absolute -top-12 left-0 flex items-center text-white hover:text-blue-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        {/* Ticket Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎫</div>
              <h2 className="text-2xl font-bold text-white">Parking Ticket</h2>
              <p className="text-gray-400 mt-2">Your booking confirmation</p>
            </div>

            {/* Ticket Details */}
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Spot Name:</span>
                <span className="text-white font-medium">{spotName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Slot ID:</span>
                <span className="text-white font-medium">{slotId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Date:</span>
                <span className="text-white font-medium">{date}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Time:</span>
                <span className="text-white font-medium">{startTime} - {endTime}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Car Number:</span>
                <span className="text-white font-medium">{carNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">License:</span>
                <span className="text-white font-medium">{license}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Driver:</span>
                <span className="text-white font-medium">{driverName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Customer Phone:</span>
                <span className="text-white font-medium">{customerPhone}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Owner Name:</span>
                <span className="text-white font-medium">{ownerName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Owner Phone:</span>
                <span className="text-white font-medium">{ownerPhone}</span>
              </div>
              <div className="flex justify-between pt-4">
                <span className="text-gray-400 text-lg">Amount Paid:</span>
                <span className="text-green-400 font-bold text-lg">₹{totalAmount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => window.print()}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Print Ticket
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ticket;