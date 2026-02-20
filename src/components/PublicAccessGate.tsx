import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { PUBLIC_PASSCODE } from '../constants';

interface PublicAccessGateProps {
  onAuthorized: () => void;
}

const PublicAccessGate: React.FC<PublicAccessGateProps> = ({ onAuthorized }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === PUBLIC_PASSCODE) {
      localStorage.setItem('public_access_authorized', 'true');
      onAuthorized();
    } else {
      setError(true);
      setPasscode('');
      setTimeout(() => setError(false), 500);
    }
  };

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsAnimating(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
      </div>

      <div className={`w-full max-w-md transition-all duration-1000 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 relative overflow-hidden backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80">

          <div className="relative z-10 text-center">
            <div className={`w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-all ${error ? 'animate-shake bg-red-100 dark:bg-red-900/30' : ''}`}>
              {error ? (
                <ShieldAlert className="w-10 h-10 text-red-500" />
              ) : (
                <Lock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
              School Community Only
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10">
              Please enter the 4-digit community passcode to access Mowbray Lost & Found.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Enter passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border-2 rounded-2xl py-5 px-6 text-center text-2xl font-black tracking-[0.5em] focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-bold ${error ? 'border-red-500' : 'border-transparent focus:border-blue-500'
                    }`}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={passcode.length < 4}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 group hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98]"
              >
                Access Site
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Private Community Tool
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PublicAccessGate;
