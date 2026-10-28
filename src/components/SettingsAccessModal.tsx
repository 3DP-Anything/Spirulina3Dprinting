import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, X, Delete, AlertCircle } from 'lucide-react';

interface SettingsAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: 'en' | 'cy';
}

export const SettingsAccessModal: React.FC<SettingsAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
}) => {
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError(null);
      setIsSuccess(false);
      setShake(false);
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const validateCode = (inputCode: string) => {
    const trimmed = inputCode.trim();
    if (trimmed.length < 4) {
      setError(
        language === 'cy'
          ? 'Rhowch y cod 4 digid.'
          : 'Please enter the 4-digit code.'
      );
      triggerShake();
      return;
    }

    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const expectedCurrent = `${currentHH}${currentMM}`;

    // Also accept the previous minute in case the clock ticked over while typing
    const prevDate = new Date(now.getTime() - 60000);
    const prevHH = String(prevDate.getHours()).padStart(2, '0');
    const prevMM = String(prevDate.getMinutes()).padStart(2, '0');
    const expectedPrev = `${prevHH}${prevMM}`;

    if (trimmed === expectedCurrent || trimmed === expectedPrev) {
      setIsSuccess(true);
      setError(null);
      setTimeout(() => {
        onSuccess();
      }, 300);
    } else {
      setError(
        language === 'cy'
          ? 'Cod anghywir. Rhowch gynnig arall arni.'
          : 'Incorrect code. Please try again.'
      );
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleDigitClick = (digit: string) => {
    if (code.length < 4) {
      const nextCode = code + digit;
      setCode(nextCode);
      setError(null);
      if (nextCode.length === 4) {
        validateCode(nextCode);
      }
    }
  };

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setCode('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateCode(code);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(value);
    setError(null);
    if (value.length === 4) {
      validateCode(value);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              x: shake ? [-8, 8, -6, 6, -3, 3, 0] : 0,
            }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{
              type: 'spring',
              duration: 0.3,
              x: { duration: 0.4 },
            }}
            className="relative w-full max-w-sm bg-[#222227] border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#2A2A32] border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${isSuccess ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'}`}>
                  {isSuccess ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-white uppercase">
                    {language === 'cy' ? 'Mynediad Cyfyngedig' : 'Restricted Access'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {language === 'cy' ? 'Gosodiadau Argraffydd' : 'Printer Settings'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700/50 transition-colors"
                title={language === 'cy' ? 'Cau' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-stone-300">
                  {language === 'cy'
                    ? 'Rhowch y cod 4 digid i gael mynediad.'
                    : 'Enter the 4-digit code to access settings.'}
                </p>
              </div>

              {/* Hidden Real Input for physical/virtual keyboard */}
              <input
                ref={hiddenInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={code}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="opacity-0 absolute pointer-events-none w-0 h-0"
                autoFocus
              />

              {/* 4 Digit Boxes */}
              <div
                onClick={() => hiddenInputRef.current?.focus()}
                className="flex items-center justify-center gap-3 cursor-pointer py-1"
              >
                {[0, 1, 2, 3].map((index) => {
                  const digit = code[index] || '';
                  const isCurrent = code.length === index;
                  return (
                    <div
                      key={index}
                      className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center font-mono text-2xl font-bold transition-all shadow-inner ${
                        isSuccess
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : error
                          ? 'border-rose-500/80 bg-rose-500/10 text-rose-300'
                          : isCurrent
                          ? 'border-amber-400 bg-stone-800 text-white ring-2 ring-amber-400/30'
                          : digit
                          ? 'border-stone-500 bg-stone-800/90 text-white'
                          : 'border-stone-700 bg-stone-900/60 text-stone-600'
                      }`}
                    >
                      {digit}
                    </div>
                  );
                })}
              </div>

              {/* Error feedback */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-1.5 text-[11px] text-rose-400 bg-rose-500/15 border border-rose-500/30 px-3 py-2 rounded-lg w-full text-center justify-center"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* On-screen Touch Numpad for Tablets & Phones */}
              <div className="grid grid-cols-3 gap-2 w-full pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigitClick(num)}
                    className="h-11 rounded-xl bg-[#2D2D36] hover:bg-[#383842] active:bg-[#454552] border border-stone-700/60 text-base font-semibold font-mono text-white transition-all shadow-sm active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-11 rounded-xl bg-[#25252D] hover:bg-[#30303A] active:bg-[#383844] border border-stone-800 text-xs font-medium text-stone-400 hover:text-stone-200 transition-all active:scale-95 uppercase tracking-wider"
                >
                  {language === 'cy' ? 'Clirio' : 'Clear'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDigitClick('0')}
                  className="h-11 rounded-xl bg-[#2D2D36] hover:bg-[#383842] active:bg-[#454552] border border-stone-700/60 text-base font-semibold font-mono text-white transition-all shadow-sm active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-11 rounded-xl bg-[#25252D] hover:bg-[#30303A] active:bg-[#383844] border border-stone-800 flex items-center justify-center text-stone-400 hover:text-stone-200 transition-all active:scale-95"
                  title={language === 'cy' ? 'Dileu' : 'Backspace'}
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-stone-700 bg-stone-800/80 hover:bg-stone-700 text-xs font-semibold text-stone-300 hover:text-white transition-all"
                >
                  {language === 'cy' ? 'Canslo' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => validateCode(code)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{language === 'cy' ? 'Datgloi' : 'Unlock'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
