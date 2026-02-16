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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-[2.5rem] p-10 shadow-2xl">
        <div className="bg-blue-50 dark:bg-blue-900/30 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <KeyRound className="text-blue-600 dark:text-blue-400 w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-center text-slate-800 dark:text-slate-100 mb-6">Staff Access</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            placeholder="••••"
            autoFocus
            className={`w-full text-center text-3xl tracking-[0.5em] bg-slate-50 dark:bg-slate-700 dark:text-white border-2 rounded-2xl py-4 outline-none transition-colors ${loginError ? 'border-rose-200 dark:border-rose-800 focus:border-rose-500' : 'border-slate-100 dark:border-slate-600 focus:border-blue-500'
              }`}
            value={passcodeAttempt}
            onChange={(e) => setPasscodeAttempt(e.target.value)}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
            <div className="flex-1">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all"
              >
                Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffLoginModal;
