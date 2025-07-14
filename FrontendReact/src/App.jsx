import { useState, useEffect } from 'react';
import './App.css';
import locationPin from './assets/square-parking-solid.png';
import compass from './assets/compass.png';
import car from './assets/car-neon.svg';
import parking from './assets/car.png';

function App() {
  const [activeButton, setActiveButton] = useState(null);
  const [floatingElements, setFloatingElements] = useState([]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const elements = [];
    const types = ['pin', 'car', 'parking', 'compass'];
    for (let i = 0; i < 20; i++) {
      elements.push({
        id: i,
        type: types[Math.floor(Math.random() * types.length)],
        size: Math.random() * 40 + 20,
        left: Math.random() * 100, // Now covers full width
        top: Math.random() * 100,
        delay: Math.random() * 10,
        duration: Math.random() * 15 + 10,
        opacity: Math.random() * 0.8 + 0.2
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
      default: return car;
    }
  };

  return (
    <div className='main'>
    <div className="min-h-screen  text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Animated gradient overlay (full-width) */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent opacity-30 animate-pan translate-x-200"></div>
      
      {/* Floating elements (now evenly spread) */}
      {floatingElements.map((element) => (
        <div key={element.id} className="absolute pointer-events-none" style={{
          left: `${element.left}%`, // Covers 0-100% width
          top: `${element.top}%`,
          width: `${element.size}px`,
          height: `${element.size}px`,
          opacity: element.opacity,
          animation: `float ${element.duration}s ease-in-out infinite`,
          animationDelay: `${element.delay}s`,
          filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.5))'
        }}>
          <img 
            src={getImage(element.type)} 
            alt="" 
            className="w-full h-full object-contain"
            style={{ 
              animation: `spin ${element.duration * 2}s linear infinite`, 
              animationDelay: `${element.delay}s`,
              filter: `hue-rotate(${Math.random() * 360}deg) brightness(1.2)`
            }} 
          />
        </div>
      ))}

      {/* Main content (strictly centered) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <header className="w-full flex flex-col md:flex-row justify-between items-center mb-8 md:mb-16 gap-6">
          <button 
            onClick={() => setActiveButton("addArea")} 
            className="px-8 py-4 rounded-full shadow-lg bg-white/90 text-indigo-800 font-bold hover:bg-white transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl hover:-translate-y-1 border-2 border-white backdrop-blur-sm group"
          >
            <span className="relative z-10 group-hover:text-indigo-600 transition-colors">Add Your Area</span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.href = '/login'} 
              className="px-8 py-4 rounded-full shadow-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl hover:-translate-y-1 border-2 border-white/30 backdrop-blur-sm group"
            >
              <span className="relative z-10 group-hover:text-white">Login</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </button>

            <button 
              onClick={() => window.location.href = '/signup'} 
              className="px-8 py-4 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl hover:-translate-y-1 border-2 border-white/30 backdrop-blur-sm group"
            >
              <span className="relative z-10">Sign Up</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </button>
          </div>
        </header>

        {/* Main heading (centered) */}
        <main className="w-full text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Discover Amazing Parking
            </span>
          </h1>
          <div className="center-wrapper">
          <p className="text-xl md:text-2xl mb-12 text-white/80 max-w-2xl mx-auto">
            Find your perfect parking spot in seconds. Join thousands of drivers who never circle the block again!
          </p>
          </div>
          {/* CTA Button (centered with hover effects) */}
          <div className="spot-background">
            <button 
              onClick={() => window.location.href = '/MapComponent'} 
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="z-20 px-16 py-6 rounded-full shadow-2xl text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-500 hover:scale-110 active:scale-95 hover:shadow-[0_0_40px_rgba(74,222,128,0.6)] border-4 border-white/30 text-white animate-pulse hover:animate-none"
            >
              <span className=" z-10 flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Find Your Spot Now
              </span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 hover:opacity-100 transition-opacity"></span>
            </button>
            
            {/* Hover rings (centered) */}
            {isHovering && (
              <>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-emerald-400/30 animate-ping-slow opacity-0 hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-2 border-emerald-400/20 animate-ping-slower opacity-0 hover:opacity-100 transition-opacity"></div>
              </>
            )}
          </div>
        </main>

        {/* Footer (centered) */}
        <footer className="w-full">
          <button 
            onClick={() => window.location.href = '/ContactUs'}
            className="px-8 py-4 rounded-full shadow-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-bold hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl hover:-translate-y-1 border-2 border-yellow-400/50 group"
          >
            <span className="relative z-10 group-hover:text-black">Need Help? Contact Us</span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </button>
        </footer>
      </div>

      {/* Car animations (full-width movement) */}
      <div className="absolute bottom-8 left-0 w-48 h-48 animate-drive-slow">
        <img src={car} alt="Car" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.7))' }} />
      </div>
      <div className="absolute bottom-20 left-0 w-32 h-32 animate-drive-fast">
        <img src={car} alt="Car" className="w-full h-full object-contain" style={{ filter: 'hue-rotate(90deg) drop-shadow(0 0 8px rgba(59, 130, 246, 0.7))' }} />
      </div>

      {/* Notification (centered popup) */}
      {activeButton && (
        <div className="fixed bottom-10 right-10 bg-gradient-to-br from-gray-800 to-gray-900 text-white px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 animate-fadeInPop shadow-2xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Action: <span className="font-bold text-emerald-300">{activeButton}</span>
        </div>
      )}
    </div>
    </div>
  );
}

export default App;