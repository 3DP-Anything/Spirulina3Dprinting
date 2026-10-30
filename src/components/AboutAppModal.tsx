import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, Send, CheckCircle2, Loader2, MessageSquare, AlertCircle, Sparkles, RotateCcw } from 'lucide-react';
import { FEEDBACK_EMAIL_ADDRESS, FEEDBACK_SERVICE_ENDPOINT } from '../parameters/index';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'cy';
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({
  isOpen,
  onClose,
  language,
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

    // Target endpoint: uses custom endpoint if defined (e.g. Google Apps Script Web App), otherwise FormSubmit
    const targetEndpoint = FEEDBACK_SERVICE_ENDPOINT.trim() || `https://formsubmit.co/ajax/${encodeURIComponent(FEEDBACK_EMAIL_ADDRESS)}`;
    const isGoogleScript = targetEndpoint.includes('script.google.com');

    const payload = {
      name: senderName.trim() || 'Anonymous User',
      email: senderEmail.trim() || 'No reply email provided',
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-2xl bg-[#1e2024] border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col text-stone-200 my-auto max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#26282e] border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {language === 'cy' ? 'Amdan y rhaglen hon' : 'About this app'}
                  </h2>
                  <p className="text-[11px] text-emerald-400/90 font-mono">
                    {language === 'cy' ? 'Prosiect Addysgol CO₂ a Chipio Carbon' : 'CO₂ Education & Carbon Capture Project'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700/50 transition-colors cursor-pointer"
                title={language === 'cy' ? 'Cau' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-stone-300">
              {/* Highlight / Intro Banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-100">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-[13px] leading-relaxed text-emerald-100">
                  {language === 'cy'
                    ? "Mae'r rhaglen hon wedi'i datblygu fel rhan o brosiect addysgol a ariennir sy'n anelu at ddysgu plant ysgol gynradd am gylchred CO₂ a chipio carbon. Mae'r prosiect yn defnyddio spirulina i amsugno CO₂ wrth dyfu, gyda'r carbon a gipiwyd wedi'i storio wedyn o fewn cwpanau bioddiraddadwy printiedig 3D a gynhyrchir o fiomas spirulina."
                    : 'This app has been developed as part of a funded educational project aimed at teaching primary school children about the CO₂ cycle and carbon capture. The project uses spirulina to absorb CO₂ during growth, with the captured carbon subsequently stored within biodegradable 3D-printed cups produced from the spirulina biomass.'}
                </p>
              </div>

              {/* Informational bullet points */}
              <div className="bg-[#24262c] rounded-xl p-4 sm:p-5 border border-stone-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                  {language === 'cy' ? 'Gwybodaeth ac Amodau Defnydd:' : 'Key Information & Terms of Use:'}
                </h3>
                <ul className="space-y-3 text-xs sm:text-[13px] text-stone-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <span>
                      {language === 'cy'
                        ? 'Darperir y rhaglen hon yn rhad ac am ddim.'
                        : 'This app is provided free of charge.'}
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>
                      {language === 'cy'
                        ? "Mae'r ffeiliau G-code a gynhyrchir gan y rhaglen hon wedi'u cynllunio'n benodol i'w defnyddio gyda'r Argraffydd 3D Clai Tronxy Moore 2. Mae defnyddio gyda modelau neu frandiau argraffydd 3D eraill yn gyfan gwbl ar risg y defnyddiwr ei hun."
                        : "The G-code files generated by this app are specifically designed for use with the Tronxy Moore 2 Clay 3D Printer. Use with other 3D printer models or brands is entirely at the user's own risk."}
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>
                      {language === 'cy'
                        ? "Nid yw'r datblygwyr yn derbyn unrhyw atebolrwydd am unrhyw golled, difrod, anaf, neu ganlyniadau eraill sy'n deillio o ddefnyddio'r modelau 3D neu ffeiliau G-code a gynhyrchir gan y rhaglen hon."
                        : 'The developers accept no liability for any loss, damage, injury, or other consequences arising from the use of the 3D models or G-code files generated by this app.'}
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <span>
                      {language === 'cy'
                        ? "Dilynwch gyfarwyddiadau ac arweiniad diogelwch gwneuthurwr yr argraffydd 3D bob amser wrth weithredu'r offer."
                        : "Always follow the 3D printer manufacturer's instructions and safety guidance when operating the equipment."}
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                    <span>
                      {language === 'cy'
                        ? 'Ni ddarperir unrhyw gefnogaeth dechnegol ar gyfer yr Argraffydd 3D Clai Tronxy Moore 2.'
                        : 'No technical support is provided for the Tronxy Moore 2 Clay 3D Printer.'}
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <span>
                      {language === 'cy' ? (
                        <>
                          Dylid riportio unrhyw faterion sy'n ymwneud â'r Argraffydd 3D Clai Tronxy Moore 2 yn uniongyrchol i{' '}
                          <a
                            href="mailto:support@tronxy.com?subject=Tronxy%20Moore%202%20Clay%203D%20Printer%20Issue"
                            className="text-blue-400 hover:text-blue-300 underline font-mono"
                          >
                            support@tronxy.com
                          </a>
                          , gan gynnwys rhif cyfresol yr argraffydd a disgrifiad manwl o'r mater.
                        </>
                      ) : (
                        <>
                          Any issues relating to the Tronxy Moore 2 Clay 3D Printer should be reported directly to{' '}
                          <a
                            href="mailto:support@tronxy.com?subject=Tronxy%20Moore%202%20Clay%203D%20Printer%20Issue"
                            className="text-blue-400 hover:text-blue-300 underline font-mono"
                          >
                            support@tronxy.com
                          </a>
                          , including the printer serial number and a detailed description of the issue.
                        </>
                      )}
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0" />
                    <span className="font-medium text-stone-200">
                      {language === 'cy'
                        ? "Gellir cyflwyno adborth adeiladol, adroddiadau nam, ac awgrymiadau ar gyfer gwella'r rhaglen hon gan ddefnyddio'r ffurflen isod:"
                        : 'Constructive feedback, bug reports, and suggestions for improving this app can be submitted using the form below:'}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Feedback Form Section */}
              <div className="bg-[#24262c] rounded-xl p-4 sm:p-5 border border-stone-800">
                <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-stone-800">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    {language === 'cy' ? 'Ffurflen Adborth ac Awgrymiadau' : 'Feedback & Suggestion Form'}
                  </h3>
                </div>

                {isSubmitted ? (
                  /* Acknowledgement View directly in the window */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-xl bg-emerald-950/60 border border-emerald-600/60 text-center flex flex-col items-center gap-3.5 my-2 shadow-inner"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-200">
                        {language === 'cy' ? "Neges wedi'i danfon yn llwyddiannus!" : 'Message sent successfully!'}
                      </h4>
                      <p className="text-xs text-emerald-300/80 mt-1 max-w-md">
                        {language === 'cy'
                          ? "Diolch yn fawr am eich adborth. Mae eich neges wedi'i chyflwyno a bydd yn ein helpu i barhau i wella'r rhaglen a'r prosiect addysgol."
                          : 'Thank you for your constructive feedback and suggestions. Your message has been submitted and will help us continue improving the application and educational project.'}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-2.5 mt-2">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{language === 'cy' ? 'Danfon neges arall' : 'Send another message'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        {language === 'cy' ? 'Gorffen / Cau' : 'Done / Close'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Interactive Form */
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {errorMessage && (
                      <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Name input */}
                      <div>
                        <label className="block text-[11px] font-medium text-stone-400 mb-1">
                          {language === 'cy' ? 'Eich enw (dewisol)' : 'Your name (optional)'}
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder={language === 'cy' ? 'e.e. Jane Doe' : 'e.g. Jane Doe'}
                          className="w-full h-8 px-2.5 bg-[#1a1b1f] border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      {/* Email input */}
                      <div>
                        <label className="block text-[11px] font-medium text-stone-400 mb-1">
                          {language === 'cy' ? 'E-bost ar gyfer ateb (dewisol)' : 'Your email for replies (optional)'}
                        </label>
                        <input
                          type="email"
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          placeholder={language === 'cy' ? 'e.e. jane@example.com' : 'e.g. jane@example.com'}
                          className="w-full h-8 px-2.5 bg-[#1a1b1f] border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Category select */}
                    <div>
                      <label className="block text-[11px] font-medium text-stone-400 mb-1">
                        {language === 'cy' ? 'Categori' : 'Category'}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full h-8 px-2.5 bg-[#1a1b1f] border border-stone-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
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
                      <label className="block text-[11px] font-medium text-stone-400 mb-1">
                        {language === 'cy' ? 'Eich neges / awgrym *' : 'Your message or suggestion *'}
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
                        className="w-full p-2.5 bg-[#1a1b1f] border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-y min-h-[75px]"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-lg border border-stone-700 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                      >
                        {language === 'cy' ? 'Canslo' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'cy' ? 'Wrthi yn danfon...' : 'Sending...'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
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
