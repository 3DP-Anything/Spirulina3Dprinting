import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, Check, X, ShieldCheck, Sparkles } from 'lucide-react';
import { CookieConsent } from '../lib/cookies';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose?: () => void;
  currentConsent?: CookieConsent;
  language: 'en' | 'cy';
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  onClose,
  currentConsent,
  language,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose || onReject}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 16 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-lg bg-[#1f2227] border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col text-stone-200 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#262a30] border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {language === 'cy' ? 'Dewisiadau Cwcis' : 'Cookie Preferences'}
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    {language === 'cy' ? 'Rheoli preifatrwydd ac arbed gosodiadau' : 'Privacy & setting persistence control'}
                  </p>
                </div>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700/50 transition-colors cursor-pointer"
                  title={language === 'cy' ? 'Cau' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-[13px] leading-relaxed text-stone-300">
              <p className="text-stone-200 font-medium">
                {language === 'cy'
                  ? 'Rydym yn defnyddio cwcis i wella ymarferoldeb y rhaglen hon.'
                  : 'We use cookies to improve the functionality of this app.'}
              </p>

              <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2.5 text-stone-300 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    {language === 'cy'
                      ? "Mae cwcis yn ddewisol, a gallwch barhau i ddefnyddio'r rhaglen hyd yn oed os ydych yn dewis peidio â'u derbyn."
                      : 'Cookies are optional, and you can continue to use the app even if you choose not to accept them.'}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    {language === 'cy'
                      ? "Os ydych yn derbyn cwcis, bydd y rhaglen yn cofio eich gosodiadau blaenorol, gan ei gwneud yn gynt i'w defnyddio ar ymweliadau yn y dyfodol."
                      : 'If you accept cookies, the app will remember your previous settings, making it quicker to use on future visits.'}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-emerald-300/90 font-medium">
                    {language === 'cy'
                      ? 'Nid ydym yn defnyddio cwcis ar gyfer hysbysebu, marchnata, nac olrhain eich gweithgareddau ar draws gwefannau.'
                      : 'We do not use cookies for advertising, marketing, or tracking your activities across websites.'}
                  </span>
                </div>
              </div>

              {/* Selection section */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  {language === 'cy' ? 'Dewiswch eich dewis:' : 'Please choose your preference:'}
                </div>

                {/* Option 1: Accept Cookies (Recommended) */}
                <button
                  type="button"
                  onClick={onAccept}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 active:scale-98 ${
                    currentConsent === 'accepted'
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-[#272b32] hover:bg-emerald-950/40 border-stone-700 hover:border-emerald-600'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-[13px]">
                        {language === 'cy' ? 'Derbyn Cwcis (Argymhellir)' : 'Accept Cookies (Recommended)'}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                        {language === 'cy' ? 'Argymhellir' : 'Recommended'}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5">
                      {language === 'cy'
                        ? "Caniatáu i'r rhaglen arbed eich gosodiadau ar gyfer ymweliadau yn y dyfodol."
                        : 'Allow the app to save your settings for future visits.'}
                    </p>
                  </div>
                </button>

                {/* Option 2: Reject Cookies */}
                <button
                  type="button"
                  onClick={onReject}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 active:scale-98 ${
                    currentConsent === 'rejected'
                      ? 'bg-stone-900 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'bg-[#272b32] hover:bg-stone-800 border-stone-700 hover:border-stone-600'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-stone-800 text-stone-400 border border-stone-700 shrink-0 mt-0.5">
                    <X className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-stone-200 text-xs sm:text-[13px]">
                      {language === 'cy' ? 'Gwrthod Cwcis' : 'Reject Cookies'}
                    </div>
                    <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5">
                      {language === 'cy'
                        ? "Parhau i ddefnyddio'r rhaglen heb arbed gosodiadau ar eich dyfais."
                        : 'Continue using the app without saving settings on your device.'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Footer Note */}
              <div className="pt-2 text-center border-t border-stone-800">
                <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {language === 'cy'
                      ? 'Gallwch newid eich dewis cwcis ar unrhyw adeg.'
                      : 'You can change your cookie preference at any time.'}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
