import React from 'react';

const RadarLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {/* Container for the Eye */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        
        {/* Veins / Chakra Radiation */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-byakugan-main/20 to-transparent animate-spin duration-[3000ms]"></div>
        <div className="absolute inset-[-20%] border border-byakugan-main/10 rounded-full animate-pulse-chakra"></div>
        <div className="absolute inset-[-40%] border border-byakugan-main/5 rounded-full animate-pulse" style={{animationDuration: '4s'}}></div>

        {/* The Eye Sclera (White/Pale Lavender) */}
        <div className="w-24 h-24 bg-byakugan-pale/10 backdrop-blur-md rounded-full border border-byakugan-pale/30 flex items-center justify-center shadow-[0_0_30px_rgba(167,139,250,0.3)] relative overflow-hidden">
            
            {/* Iris Lines */}
            <div className="absolute inset-0 rounded-full opacity-30" 
                 style={{background: 'conic-gradient(from 0deg, transparent 0deg, #a78bfa 10deg, transparent 20deg, #a78bfa 30deg, transparent 40deg, #a78bfa 50deg, transparent 60deg, #a78bfa 70deg, transparent 80deg, #a78bfa 90deg, transparent 100deg, #a78bfa 110deg, transparent 120deg, #a78bfa 130deg, transparent 140deg, #a78bfa 150deg, transparent 160deg, #a78bfa 170deg, transparent 180deg, #a78bfa 190deg, transparent 200deg, #a78bfa 210deg, transparent 220deg, #a78bfa 230deg, transparent 240deg, #a78bfa 250deg, transparent 260deg, #a78bfa 270deg, transparent 280deg, #a78bfa 290deg, transparent 300deg, #a78bfa 310deg, transparent 320deg, #a78bfa 330deg, transparent 340deg, #a78bfa 350deg)'}}>
            </div>

            {/* Pupil */}
            <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_#fff] animate-ping" style={{animationDuration: '3s'}}></div>
            <div className="absolute w-4 h-4 bg-white rounded-full opacity-80"></div>
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <div className="text-byakugan-main font-clan tracking-[0.2em] text-lg animate-pulse">
            BYAKUGAN
        </div>
        <div className="text-byakugan-pale/50 font-mono text-xs tracking-widest">
            PERCÉE DES POINTS VITAUX EN COURS...
        </div>
      </div>
    </div>
  );
};

export default RadarLoader;