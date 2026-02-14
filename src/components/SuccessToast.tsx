import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SuccessToastProps {
  show: boolean;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4.5 rounded-[2rem] shadow-2xl flex items-center gap-4 z-[100] border border-slate-700 animate-in slide-in-from-bottom-5">
      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      <span className="font-black tracking-tight">Posted to Mowbray Hub!</span>
    </div>
  );
};

export default SuccessToast;
