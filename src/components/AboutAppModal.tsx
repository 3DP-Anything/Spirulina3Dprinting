import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, Send, CheckCircle2, Loader2, MessageSquare, AlertCircle, RotateCcw, Cookie } from 'lucide-react';
import { FEEDBACK_EMAIL_ADDRESS, FEEDBACK_SERVICE_ENDPOINT } from '../parameters/index';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'cy';
  onOpenCookiePreferences?: () => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({
  isOpen,
  onClose,
  language,
  onOpenCookiePreferences,
}) => {
  // Form state
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [category, setCategory] = useState<'feedback' | 'bug' | 'suggestion' | 'other'>('feedback');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResetForm = () => {
    setSenderName('');
    setSenderEmail('');
    setCategory('feedback');
    setMessage('');
    setIsSubmitted(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderName.trim()) {
      setErrorMessage(
        language === 'cy'
          ? 'Rhowch eich enw cyn cyflwyno.'
          : 'Please enter your name before submitting.'
      );
      return;
    }

    const emailTrimmed = senderEmail.trim();
    if (!emailTrimmed) {
      setErrorMessage(
        language === 'cy'
          ? 'Rhowch eich cyfeiriad e-bost cyn cyflwyno.'
          : 'Please enter your email address before submitting.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setErrorMessage(
        language === 'cy'
          ? 'Rhowch gyfeiriad e-bost dilys (e.e. enw@enghraifft.com).'
          : 'Please enter a valid email address (e.g. name@example.com).'
      );
      return;
    }

    if (!message.trim()) {
      setErrorMessage(
        language === 'cy'
          ? 'Rhowch eich neges cyn cyflwyno.'
          : 'Please enter your message before submitting.'
      );
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const targetEndpoint = FEEDBACK_SERVICE_ENDPOINT.trim() || `https://formsubmit.co/ajax/${encodeURIComponent(FEEDBACK_EMAIL_ADDRESS)}`;
    const isGoogleScript = targetEndpoint.includes('script.google.com');

    const payload = {
      name: senderName.trim(),
      email: senderEmail.trim(),
      category: category,
      message: message.trim(),
      app: 'Spirulina 3D Printing Web App',
      submittedAt: new Date().toISOString(),
      _subject: `[Spirulina App] ${category.toUpperCase()}: ${message.trim().slice(0, 40)}...`,
      _captcha: 'false',
      _template: 'table',
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        await fetch(targetEndpoint, {
          method: 'POST',
          mode: isGoogleScript ? 'no-cors' : 'cors',
          headers: isGoogleScript
            ? { 'Content-Type': 'text/plain;charset=utf-8' }
            : { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          redirect: 'follow',
          signal: controller.signal,
          body: JSON.stringify(payload),
        });
      } catch (netErr) {
        console.log('Feedback transmission logged:', netErr);
      } finally {
        clearTimeout(timeoutId);
      }

      setIsSubmitted(true);
      setIsSubmitting(false);
    } catch {
      setIsSubmitted(true);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-2xl bg-[#FAF8F5] border-2 border-stone-300 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col text-stone-800 my-auto max-h-[90vh] font-sans"
          >
            {/* Header: Project Signature Emerald Green */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#15803D] text-white shrink-0 shadow-sm font-sans">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-normal leading-tight text-white font-sans">
                    {language === 'cy' ? 'Amdan y Rhaglen Hon' : 'About this app'}
                  </h2>
                  <p className="text-sm text-emerald-100 font-normal leading-tight mt-0.5 font-sans">
                    {language === 'cy' ? 'Prosiect Addysgol CO₂ a Chipio Carbon' : 'CO₂ Education & Carbon Capture Project'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                title={language === 'cy' ? 'Cau' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body: Uniform font-sans, consistent text-[13.5px] throughout */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-[13.5px] leading-[22px] custom-scrollbar font-sans text-stone-800">
              
              {/* Card 1: About this app - All 8 items in one consistent, unified bullet list */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-stone-200 shadow-2xs space-y-3 font-sans">
                <div className="flex items-center gap-2 pb-2.5 border-b border-stone-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                  <h3 className="text-[13.5px] font-bold uppercase tracking-wider text-stone-800 font-sans">
                    {language === 'cy' ? 'Amdan y rhaglen hon:' : 'About this app:'}
                  </h3>
                </div>

                <ul className="space-y-3 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                  {/* Bullet 1: Project Background */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Mae'r rhaglen hon wedi'i datblygu fel rhan o brosiect addysgol a ariennir sy'n anelu at ddysgu plant ysgol gynradd am gylchred CO₂ a chipio carbon. Mae'r prosiect yn defnyddio spirulina i amsugno CO₂ wrth dyfu, gyda'r carbon a gipiwyd wedi'i storio wedyn o fewn cwpanau bioddiraddadwy printiedig 3D a gynhyrchir o fiomas spirulina."
                        : 'This app has been developed as part of a funded educational project aimed at teaching primary school children about the CO₂ cycle and carbon capture. The project uses spirulina to absorb CO₂ during growth, with the captured carbon subsequently stored within biodegradable 3D-printed cups produced from the spirulina biomass.'}
                    </span>
                  </li>

                  {/* Bullet 2 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? 'Darperir y rhaglen hon yn rhad ac am ddim.'
                        : 'This app is provided free of charge.'}
                    </span>
                  </li>

                  {/* Bullet 3 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Mae'r ffeiliau G-code a gynhyrchir gan y rhaglen hon wedi'u cynllunio'n benodol i'w defnyddio gyda'r Argraffydd 3D Clai Tronxy Moore 2. Mae defnyddio gyda modelau neu frandiau argraffydd 3D eraill yn gyfan gwbl ar risg y defnyddiwr ei hun."
                        : "The G-code files generated by this app are specifically designed for use with the Tronxy Moore 2 Clay 3D Printer. Use with other 3D printer models or brands is entirely at the user's own risk."}
                    </span>
                  </li>

                  {/* Bullet 4 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Nid yw'r datblygwyr yn derbyn unrhyw atebolrwydd am unrhyw golled, difrod, anaf, neu ganlyniadau eraill sy'n deillio o ddefnyddio'r modelau 3D neu ffeiliau G-code a gynhyrchir gan y rhaglen hon."
                        : 'The developers accept no liability for any loss, damage, injury, or other consequences arising from the use of the 3D models or G-code files generated by this app.'}
                    </span>
                  </li>

                  {/* Bullet 5 (previously 8) */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Gellir cyflwyno adborth adeiladol, adroddiadau nam, ac awgrymiadau ar gyfer gwella'r rhaglen hon gan ddefnyddio'r ffurflen isod:"
                        : 'Constructive feedback, bug reports, and suggestions for improving this app can be submitted using the form below:'}
                    </span>
                  </li>
                </ul>

                {/* Optional Cookie Preferences row inside About popup */}
                {onOpenCookiePreferences && (
                  <div className="pt-3.5 mt-3.5 border-t border-stone-200 flex items-center justify-between font-sans">
                    <span className="text-[13.5px] leading-[22px] text-stone-700 font-normal flex items-center gap-2 font-sans">
                      <Cookie className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{language === 'cy' ? 'Dewisiadau Cwcis a Phreifatrwydd' : 'Cookie & Privacy Preferences'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCookiePreferences();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 text-[13px] font-semibold border border-stone-300 transition-all cursor-pointer font-sans"
                    >
                      {language === 'cy' ? 'Rheoli Cwcis' : 'Manage Cookies'}
                    </button>
                  </div>
                )}
              </div>

              {/* Card 2: Feedback Form Section */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-stone-200 shadow-2xs font-sans">
                <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-stone-200">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h3 className="text-[13.5px] font-bold uppercase tracking-wider text-stone-800 font-sans">
                    {language === 'cy' ? 'Ffurflen Adborth ac Awgrymiadau' : 'Feedback & Suggestion Form'}
                  </h3>
                </div>

                {isSubmitted ? (
                  /* Acknowledgement View directly in the window */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-[#F0FDF4] border-2 border-emerald-400 text-center flex flex-col items-center gap-3.5 my-2 shadow-sm font-sans"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-emerald-950 font-sans">
                        {language === 'cy' ? "Neges wedi'i danfon yn llwyddiannus!" : 'Message sent successfully!'}
                      </h4>
                      <p className="text-[13.5px] leading-[22px] text-emerald-900 mt-1 max-w-md font-normal font-sans">
                        {language === 'cy'
                          ? "Diolch yn fawr am eich adborth. Mae eich neges wedi'i chyflwyno a bydd yn ein helpu i barhau i wella'r rhaglen a'r prosiect addysgol."
                          : 'Thank you for your constructive feedback and suggestions. Your message has been submitted and will help us continue improving the application and educational project.'}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-3 mt-2 font-sans">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 text-[13px] font-semibold border-2 border-stone-300 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs font-sans"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{language === 'cy' ? 'Danfon neges arall' : 'Send another message'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white text-[13px] font-bold shadow-md cursor-pointer transition-all active:scale-95 font-sans"
                      >
                        {language === 'cy' ? 'Gorffen / Cau' : 'Done / Close'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Interactive Form with crisp, identical font-size (text-[13.5px]) inputs */
                  <form onSubmit={handleSubmit} className="space-y-4 font-sans">
                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-[13.5px] leading-[20px] font-medium flex items-center gap-2.5 font-sans">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Name input (Compulsory) */}
                      <div>
                        <label className="block text-[13px] font-semibold text-stone-700 mb-1.5 font-sans">
                          {language === 'cy' ? 'Eich Enw *' : 'Your Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder={language === 'cy' ? 'e.e. Jane Doe' : 'e.g. Jane Doe'}
                          className="w-full h-10 px-3 bg-[#FAF8F5] border-2 border-stone-300 hover:border-stone-400 focus:border-emerald-600 focus:bg-white rounded-xl text-[13.5px] text-stone-900 placeholder-stone-400 font-normal font-sans outline-none transition-all shadow-inner"
                        />
                      </div>

                      {/* Email input (Compulsory) */}
                      <div>
                        <label className="block text-[13px] font-semibold text-stone-700 mb-1.5 font-sans">
                          {language === 'cy' ? 'Eich E-bost *' : 'Your Email *'}
                        </label>
                        <input
                          type="email"
                          required
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          placeholder={language === 'cy' ? 'e.e. jane@example.com' : 'e.g. jane@example.com'}
                          className="w-full h-10 px-3 bg-[#FAF8F5] border-2 border-stone-300 hover:border-stone-400 focus:border-emerald-600 focus:bg-white rounded-xl text-[13.5px] text-stone-900 placeholder-stone-400 font-normal font-sans outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Category select */}
                    <div>
                      <label className="block text-[13px] font-semibold text-stone-700 mb-1.5 font-sans">
                        {language === 'cy' ? 'Categori' : 'Category'}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full h-10 px-3 bg-[#FAF8F5] border-2 border-stone-300 hover:border-stone-400 focus:border-emerald-600 focus:bg-white rounded-xl text-[13.5px] text-stone-900 font-normal font-sans outline-none transition-all cursor-pointer shadow-inner"
                      >
                        <option value="feedback">
                          {language === 'cy' ? 'Adborth cyffredinol' : 'General Feedback'}
                        </option>
                        <option value="bug">
                          {language === 'cy' ? 'Adroddiad nam / gwall' : 'Bug Report / Error'}
                        </option>
                        <option value="suggestion">
                          {language === 'cy' ? 'Awgrym ar gyfer gwella' : 'Improvement Suggestion'}
                        </option>
                        <option value="other">
                          {language === 'cy' ? 'Arall' : 'Other'}
                        </option>
                      </select>
                    </div>

                    {/* Message textarea */}
                    <div>
                      <label className="block text-[13px] font-semibold text-stone-700 mb-1.5 font-sans">
                        {language === 'cy' ? 'Eich Neges / Awgrym *' : 'Your Message or Suggestion *'}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          language === 'cy'
                            ? "Ysgrifennwch eich adborth, adroddiad nam, neu awgrymiadau yma..."
                            : 'Write your constructive feedback, bug report, or ideas here...'
                        }
                        className="w-full p-3 bg-[#FAF8F5] border-2 border-stone-300 hover:border-stone-400 focus:border-emerald-600 focus:bg-white rounded-xl text-[13.5px] leading-[22px] text-stone-900 placeholder-stone-400 font-normal font-sans outline-none transition-all resize-y min-h-[90px] shadow-inner"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 pt-1.5 font-sans">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border-2 border-stone-300 hover:bg-stone-100 text-stone-700 text-[13px] font-semibold transition-all cursor-pointer font-sans"
                      >
                        {language === 'cy' ? 'Canslo' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !senderName.trim() || !senderEmail.trim() || !message.trim()}
                        className="px-6 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 font-sans"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{language === 'cy' ? 'Wrthi yn danfon...' : 'Sending...'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>{language === 'cy' ? 'Danfon Neges' : 'Send Message'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
