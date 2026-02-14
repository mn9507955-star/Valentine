
import React from 'react';

interface OverlayProps {
  onStart: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-700">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-4 tracking-tighter">
          PARTICLE<br/>VOID
        </h1>
        <p className="text-white/60 mb-8 font-light leading-relaxed">
          Trải nghiệm hệ thống hạt 3D hiệu năng cao với công nghệ Shader và Unreal Bloom.
        </p>
        <button
          onClick={onStart}
          className="group relative px-10 py-4 bg-transparent border-2 border-cyan-500 text-cyan-400 font-bold uppercase tracking-widest overflow-hidden transition-all duration-500 hover:text-black hover:bg-cyan-500 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]"
        >
          <span className="relative z-10">Bắt đầu trải nghiệm</span>
          <div className="absolute inset-0 bg-cyan-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
        
        <div className="mt-12 flex justify-center gap-6 opacity-40">
           <div className="text-[10px] text-white font-mono uppercase tracking-[0.3em]">GLSL</div>
           <div className="text-[10px] text-white font-mono uppercase tracking-[0.3em]">Web Graphics</div>
           <div className="text-[10px] text-white font-mono uppercase tracking-[0.3em]">Three.js</div>
        </div>
      </div>
    </div>
  );
};

export default Overlay;
