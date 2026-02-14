import React from 'react';
import { KeyRound } from 'lucide-react';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (passcode: string) => void;
  loginError: boolean;
  passcodeAttempt: string;
  setPasscodeAttempt: (passcode: string) => void;
}

const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  loginError,
  passcodeAttempt,
  setPasscodeAttempt
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLogin(passcodeAttempt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-10 shadow-2xl">
        <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <KeyRound className="text-emerald-600 w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-center text-slate-800 mb-2">Staff Access</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            placeholder="••••"
            autoFocus
            className={`w-full text-center text-3xl tracking-[0.5em] bg-slate-50 border-2 rounded-2xl py-4 outline-none ${loginError ? 'border-rose-200' : 'border-slate-100'
              }`}
            value={passcodeAttempt}
            onChange={(e) => setPasscodeAttempt(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-400 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 text-white font-black rounded-2xl"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffLoginModal;
