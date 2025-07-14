import { useState, useEffect } from 'react';
import './App.css';
import locationPin from './assets/square-parking-solid.png';
import compass from './assets/compass.png';
import car from './assets/car-neon.svg';
import parking from './assets/parking-lot-neon.svg';
import map from './assets/map.png';

function App() {
  const [activeButton, setActiveButton] = useState(null);
  const [floatingElements, setFloatingElements] = useState([]);

  useEffect(() => {
    const elements = [];
    const types = ['pin', 'car', 'parking', 'compass'];
    for (let i = 0; i < 12; i++) {
      elements.push({
        id: i,
        type: types[Math.floor(Math.random() * types.length)],
        size: Math.random() * 30 + 20,
        left: Math.random() * 10 + 5,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10,
        opacity: Math.random() * 0.6 + 0.4
      });
    }
    setFloatingElements(elements);
  }, []);

  const getImage = (type) => {
    switch (type) {
      case 'pin': return locationPin;
      case 'car': return car;
      case 'parking': return parking;
      case 'compass': return compass;
      default: return map;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-800 via-blue-500 to-indigo-600 text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Floating elements */}
      {floatingElements.map((element) => (
        <div key={element.id} className="absolute pointer-events-none" style={{
          left: `${element.left}%`, top: `${Math.random() * 100}%`,
          width: `${element.size}px`, height: `${element.size}px`,
          opacity: element.opacity,
          animation: `float ${element.duration}s ease-in-out infinite`,
          animationDelay: `${element.delay}s`,
          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
        }}>
          <img src={getImage(element.type)} alt="" className="w-full h-full object-contain"
            style={{ animation: `spin ${element.duration * 2}s linear infinite`, animationDelay: `${element.delay}s` }} />
        </div>
      ))}
      {/* Main content wrapper */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-4">
        {/* Header */}
        <header className="w-full max-w-6xl flex justify-between items-center mb-12">
          <button onClick={() => setActiveButton("addArea")} className="px-6 py-3 rounded-full shadow-xl bg-white text-indigo-600 font-bold hover:bg-indigo-100 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl hover:-translate-y-1 border-2 border-white/50">
            <span className="relative z-10">Add Your Area</span>
          </button>
          <div className="flex gap-4">
            <button 
  onClick={() => window.location.href = '/login'} 
  className="px-8 py-4 rounded-full shadow-xl bg-black/30 text-black font-bold hover:bg-black/40 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl hover:-translate-y-1 border-2 border-white/30">
  login
</button>

            <button 
              onClick={() => window.location.href = '/signup'} 
              className="px-8 py-4 rounded-full shadow-xl bg-black/30 text-black font-bold hover:bg-black/40 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl hover:-translate-y-1 border-2 border-white/30"
            >
              Sign Up
            </button>
          </div>
        </header>
        {/* Main content */}
       <main className="w-full max-w-6xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
            Discover Amazing Places
          </h1>
          <p className="text-2xl mb-8 text-white/90">
            Find your perfect spot To Park. Join thousands of Spot here!
          </p>
          <div className="spot-background relative">
            <button 
              onClick={() => window.location.href = '/MapComponent'} 
              className="relative z-20 px-16 py-6 rounded-full shadow-2xl text-3xl font-bold bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 transition-all duration-500 hover:scale-110 active:scale-95 hover:shadow-[0_0_30px_rgba(0,255,0,0.8)] border-4 border-white/30 text-white animate-pulse hover:animate-none mb-12"
            >
              <span className="relative z-10 text-black">Find Your Spot</span>
            </button>
          </div>
        </main>
        {/* Footer */}
        <footer className="w-full max-w-6xl">
          <button 
            onClick={() => window.location.href = '/ContactUs'}
            className="px-8 py-4 rounded-full shadow-xl bg-yellow-500 text-black font-bold hover:bg-yellow-600 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl hover:-translate-y-1 border-2 border-yellow-400/50"
          >
            Contact Us
          </button>
        </footer>
      </div>
      {/* Car animation */}
      <div className="absolute bottom-0 left-0 w-40 h-40 animate-drive">
        <img src={car} alt="Car" className="w-full h-full object-contain" />
      </div>
      {/* Notification */}
      {activeButton && (
        <div className="fixed bottom-10 right-10 bg-black/80 text-white px-6 py-3 rounded-lg backdrop-blur-sm border-2 border-white/20 animate-fadeInPop shadow-xl">
          You clicked: <span className="font-bold text-yellow-300">{activeButton}</span>
        </div>
      )}
    </div>
  );
}

export default App;