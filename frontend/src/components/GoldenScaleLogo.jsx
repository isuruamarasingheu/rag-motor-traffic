import React from 'react';
import { Scale } from 'lucide-react';

export default function GoldenScaleLogo({ className = "w-10 h-10", iconSize = "w-5 h-5", animated = false }) {
  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-b from-[#181d29] to-[#0f1420] border border-[#d4a843]/50 text-[#d4a843] flex items-center justify-center shadow-lg shadow-[#d4a843]/10 relative group flex-shrink-0 transition-all duration-300 hover:border-[#d4a843] hover:shadow-[#d4a843]/25`}
      style={{
        boxShadow: '0 0 14px rgba(212, 168, 67, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.08)'
      }}
    >
      <Scale className={`${iconSize} stroke-[2.2] ${animated ? 'animate-scale-weigh' : ''}`} />
    </div>
  );
}

