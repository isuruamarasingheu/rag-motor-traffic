import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <footer className="bg-amber-50/80 backdrop-blur-md border-t border-amber-200/70 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-center gap-2 text-center flex-shrink-0">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <span>
        <strong>Legal Information Only:</strong> Derived strictly from Sri Lanka's Motor Traffic Act No. 14 of 1951 and official gazette regulations. This system does not provide legal advice.
      </span>
    </footer>
  );
}
