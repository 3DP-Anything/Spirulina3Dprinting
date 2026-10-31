import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, Check, X, Sparkles } from 'lucide-react';
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
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose || onReject}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container: Warm off-white canvas with solid borders */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 16 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-lg bg-[#FAF8F5] border-2 border-stone-300 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col text-stone-800 my-auto font-sans"
          >
            {/* Header: Warm Amber / Bronze matching the Settings & Cookie theme */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#B45309] text-white shrink-0 shadow-sm font-sans">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-normal leading-tight text-white font-sans">
                    {language === 'cy' ? 'Dewisiadau Cwcis' : 'Cookie Preferences'}
                  </h2>
                  <p className="text-sm text-amber-100 font-normal leading-tight mt-0.5 font-sans">
                    {language === 'cy' ? 'Rheoli preifatrwydd ac arbed gosodiadau' : 'Privacy & setting persistence control'}
                  </p>
                </div>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 font-sans"
                  title={language === 'cy' ? 'Cau' : 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body: Uniform font-sans and exact text-[13.5px] leading-[22px] across all bullet points */}
            <div className="p-5 sm:p-6 space-y-4 text-[13.5px] leading-[22px] text-stone-800 font-sans">
              
              {/* Informational Card with All 3 Bullet Points formatted identically */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-stone-200 shadow-2xs space-y-3 font-sans">
                <p className="text-[13.5px] leading-[22px] text-stone-900 font-semibold font-sans">
                  {language === 'cy'
                    ? 'Rydym yn defnyddio cwcis i wella ymarferoldeb y rhaglen hon.'
                    : 'We use cookies to improve the functionality of this app.'}
                </p>

                <ul className="space-y-3 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                  {/* Bullet Point 1 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Mae cwcis yn ddewisol, a gallwch barhau i ddefnyddio'r rhaglen hyd yn oed os ydych yn dewis peidio â'u derbyn."
                        : 'Cookies are optional, and you can continue to use the app even if you choose not to accept them.'}
                    </span>
                  </li>

                  {/* Bullet Point 2 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Os ydych yn derbyn cwcis, bydd y rhaglen yn cofio eich gosodiadau blaenorol, gan ei gwneud yn gynt i'w defnyddio ar ymweliadau yn y dyfodol."
                        : 'If you accept cookies, the app will remember your previous settings, making it quicker to use on future visits.'}
                    </span>
                  </li>

                  {/* Bullet Point 3 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? 'Nid ydym yn defnyddio cwcis ar gyfer hysbysebu, marchnata, nac olrhain eich gweithgareddau ar draws gwefannau.'
                        : 'We do not use cookies for advertising, marketing, or tracking your activities across websites.'}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Selection section */}
              <div className="space-y-3 pt-1 font-sans">
                <div className="text-[13.5px] font-bold uppercase tracking-wider text-stone-800 font-sans">
                  {language === 'cy' ? 'Dewiswch eich dewis:' : 'Please choose your preference:'}
                </div>

                {/* Option 1: Accept Cookies (Recommended) */}
                <button
                  type="button"
                  onClick={onAccept}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 shadow-sm active:scale-98 font-sans ${
                    currentConsent === 'accepted'
                      ? 'bg-[#F0FDF4] border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-[#F0FDF4] border-emerald-600 hover:border-emerald-700 hover:shadow-md'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950 text-[13.5px] leading-[22px] font-sans">
                        {language === 'cy' ? 'Derbyn Cwcis (Argymhellir)' : 'Accept Cookies (Recommended)'}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-bold uppercase bg-emerald-700 text-white rounded-md tracking-wider shadow-2xs font-sans">
                        {language === 'cy' ? 'Argymhellir' : 'Recommended'}
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-[22px] text-emerald-900 mt-0.5 font-normal font-sans">
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
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 shadow-sm active:scale-98 bg-white border-stone-300 hover:border-stone-400 hover:bg-stone-50 font-sans ${
                    currentConsent === 'rejected'
                      ? 'border-rose-400 ring-2 ring-rose-300/30'
                      : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 font-sans">
                    <div className="font-bold text-stone-900 text-[13.5px] leading-[22px] font-sans">
                      {language === 'cy' ? 'Gwrthod Cwcis' : 'Reject Cookies'}
                    </div>
                    <p className="text-[13.5px] leading-[22px] text-stone-600 mt-0.5 font-normal font-sans">
                      {language === 'cy'
                        ? "Parhau i ddefnyddio'r rhaglen heb arbed gosodiadau ar eich dyfais."
                        : 'Continue using the app without saving settings on your device.'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Footer Note */}
              <div className="pt-3 border-t border-stone-200 text-center font-sans">
                <p className="text-[13.5px] leading-[22px] text-stone-600 font-normal flex items-center justify-center gap-1.5 font-sans">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
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
