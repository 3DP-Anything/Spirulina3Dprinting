import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, X, Delete, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { SETTINGS_ACCESS_GRACE_PERIOD_MINUTES } from '../parameters/index';

interface SettingsAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: 'en' | 'cy';
  gracePeriodMinutes?: number;
  mode?: 'settings' | 'advanced';
}

export const SettingsAccessModal: React.FC<SettingsAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
  gracePeriodMinutes = SETTINGS_ACCESS_GRACE_PERIOD_MINUTES,
  mode = 'settings',
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
      }, 60);
    }
  }, [isOpen]);

  const validateCode = (inputCode: string) => {
    const trimmed = inputCode.trim();
    if (trimmed.length < 4) {
      setError(
        language === 'cy'
          ? 'Rhowch y cod 4 digid llawn.'
          : 'Please enter the full 4-digit code.'
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
      }, 320);
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container: Styled consistently with app popups */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              x: shake ? [-8, 8, -6, 6, -3, 3, 0] : 0,
            }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{
              type: 'spring',
              duration: 0.35,
              bounce: 0.15,
              x: { duration: 0.4 },
            }}
            className={`relative w-full ${mode === 'advanced' ? 'max-w-md sm:max-w-xl' : 'max-w-sm sm:max-w-md'} bg-[#FAF8F5] border-2 border-stone-300 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col text-stone-800 my-auto font-sans`}
          >
            {/* Header: Dark Charcoal Slate matching the app's Settings header style */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#2E2E35] text-white shrink-0 shadow-sm font-sans">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-white shrink-0 shadow-inner transition-colors ${
                    isSuccess
                      ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300'
                      : 'bg-white/15 border-white/30 text-white'
                  }`}
                >
                  {isSuccess ? (
                    <Unlock className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <Lock className="w-5 h-5 text-amber-300" />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-normal leading-tight text-white font-sans flex items-center gap-2">
                    <span>
                      {mode === 'advanced'
                        ? (language === 'cy' ? 'Cod Mynediad Modd Uwch' : 'Advanced Mode Access Code')
                        : (language === 'cy' ? 'Cod Mynediad Gosodiadau' : 'Settings Access Code')}
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300 font-normal leading-tight mt-0.5 font-sans">
                    {mode === 'advanced'
                      ? (language === 'cy' ? "Rhowch y cod 4 digid i ddatgloi'r Modd Uwch" : 'Enter the 4-digit code to unlock Advanced Mode')
                      : (language === 'cy' ? "Rhowch y cod 4 digid i ddatgloi'r gosodiadau" : 'Enter the 4-digit code to unlock settings')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 font-sans"
                title={language === 'cy' ? 'Cau' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 font-sans text-stone-800 text-[13.5px] leading-[22px]">
              
              {/* Card Container */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-stone-200 shadow-2xs space-y-3.5 font-sans">
                <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-stone-800 font-sans">
                      {mode === 'advanced'
                        ? (language === 'cy' ? 'Cyfyngiad Modd Uwch' : 'Advanced Mode Restriction')
                        : (language === 'cy' ? 'Diogelwch Gosodiadau' : 'Settings Security')}
                    </h3>
                  </div>
                  <span className="text-[11.5px] font-semibold text-stone-400 font-sans">
                    {language === 'cy' ? 'Cod 4 digid' : '4-digit code'}
                  </span>
                </div>

                {mode === 'advanced' ? (
                  <div className="space-y-2.5 text-[12.5px] leading-[19px] text-stone-600 font-sans">
                    <p>
                      {language === 'cy'
                        ? "Mae Mynediad i'r Modd Uwch wedi'i gyfyngu i ysgolion sy'n cymryd rhan yn y Prosiect Argraffu Spirulina 3D. Mae'r Modd Uwch yn darparu mwy o reolaeth dros baramedrau argraffu 3D, mynediad i osodiadau allforio, ac adnoddau ychwanegol, gan gynnwys canllawiau fformiwleiddio past, gweithdrefnau manwl, fideos cyfarwyddiadol, a dogfennaeth ategol arall."
                        : 'Access to Advanced Mode is restricted to schools participating in the 3D Printing Spirulina Project. Advanced Mode provides greater control over 3D printing parameters, access to export settings, and additional resources, including paste formulation guidelines, detailed procedures, instructional videos, and other supporting documentation.'}
                    </p>
                    <p className="text-stone-700 font-semibold bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5">
                      {language === 'cy'
                        ? "Os hoffech gael mynediad i'r Modd Uwch neu os oes angen rhagor o wybodaeth arnoch, cysylltwch â gweinyddwyr yr ap trwy glicio ar y botwm Gwybodaeth (i) a chwblhau'r ffurflen gyswllt ar-lein."
                        : 'If you would like access to Advanced Mode or require further information, please contact the app administrators by clicking the Info (i) button and completing the online contact form.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-[13px] leading-[20px] text-stone-600 font-sans">
                    {language === 'cy'
                      ? "Rhowch y cod mynediad 4 digid i gael mynediad i osodiadau'r argraffydd."
                      : 'Enter the 4-digit access code to access printer settings.'}
                  </p>
                )}

                {/* Hidden Input for Keyboard Typing */}
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
                  className="flex items-center justify-center gap-2.5 sm:gap-3 py-1 cursor-pointer"
                  title="Click to enter code"
                >
                  {[0, 1, 2, 3].map((index) => {
                    const digit = code[index] || '';
                    const isCurrent = code.length === index;
                    return (
                      <div
                        key={index}
                        className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center font-mono text-2xl font-bold transition-all shadow-2xs ${
                          isSuccess
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                            : error
                            ? 'border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-400/20'
                            : isCurrent
                            ? 'border-stone-800 bg-stone-50 text-stone-900 ring-2 ring-stone-400/30'
                            : digit
                            ? 'border-stone-400 bg-white text-stone-900'
                            : 'border-stone-200 bg-stone-50/70 text-stone-300'
                        }`}
                      >
                        {digit ? '*' : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-[12.5px] text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-center justify-center font-sans font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Touch Numpad - Reduced to half size */}
                <div className="grid grid-cols-3 gap-1.5 w-full max-w-[190px] sm:max-w-[210px] mx-auto pt-1 select-none">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDigitClick(num)}
                      className="h-6 sm:h-7 rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-300 text-stone-800 font-mono text-sm font-bold transition-all shadow-2xs active:scale-95 cursor-pointer font-sans flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-6 sm:h-7 rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-300 text-[9px] font-bold text-stone-600 hover:text-stone-900 transition-all active:scale-95 uppercase tracking-tight cursor-pointer font-sans flex items-center justify-center"
                  >
                    {language === 'cy' ? 'Clir' : 'Clear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitClick('0')}
                    className="h-6 sm:h-7 rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-300 text-stone-800 font-mono text-sm font-bold transition-all shadow-2xs active:scale-95 cursor-pointer font-sans flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-6 sm:h-7 rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-300 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-all active:scale-95 cursor-pointer font-sans"
                    title={language === 'cy' ? 'Dileu' : 'Backspace'}
                    aria-label="Backspace"
                  >
                    <Delete className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Grace Period Notice */}
                <div className="flex items-start gap-2 pt-2 border-t border-stone-100 text-[11.5px] leading-tight text-stone-500 font-sans">
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>
                    {mode === 'advanced'
                      ? (language === 'cy'
                        ? `Ar ôl nodi cod dilys, bydd y Modd Uwch a'r holl nodweddion estynedig yn cael eu datgloi am ${gracePeriodMinutes} munud.`
                        : `After entering a valid code, Advanced Mode and all extended features are unlocked for ${gracePeriodMinutes} minutes.`)
                      : (language === 'cy'
                        ? `Ar ôl nodi cod dilys, gallwch ail-agor y gosodiadau am ${gracePeriodMinutes} munud heb ail-nodi'r cod.`
                        : `After entering a valid code, you can re-enter settings for ${gracePeriodMinutes} minutes without re-entering the code.`)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1 font-sans">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border-2 border-stone-300 bg-white hover:bg-stone-100 active:bg-stone-200 text-xs font-bold text-stone-700 transition-all cursor-pointer font-sans shadow-2xs"
                >
                  {language === 'cy' ? 'Canslo' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => validateCode(code)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#2E2E35] hover:bg-[#404040] active:bg-[#1C1C21] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  {isSuccess ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Unlock className="w-4 h-4 text-amber-300" />
                  )}
                  <span>
                    {isSuccess
                      ? (language === 'cy' ? 'Datgloiwyd!' : 'Unlocked!')
                      : mode === 'advanced'
                      ? (language === 'cy' ? 'Datgloi Modd Uwch' : 'Unlock Advanced Mode')
                      : (language === 'cy' ? 'Datgloi' : 'Unlock')}
                  </span>
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
