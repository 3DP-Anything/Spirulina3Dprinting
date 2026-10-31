import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ScrewdriverSpannerIcon } from './ScrewdriverSpannerIcon';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'cy';
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
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
            {/* Header: Warm Amber / Engineering theme */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#D97706] text-white shrink-0 shadow-sm font-sans">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <ScrewdriverSpannerIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-normal leading-tight text-white font-sans">
                    {language === 'cy' ? 'Cynnal a Chadw ac Atgyweirio' : 'Maintenance & Repair'}
                  </h2>
                  <p className="text-sm text-amber-100 font-normal leading-tight mt-0.5 font-sans">
                    {language === 'cy'
                      ? 'Gofal ac Arweiniad Argraffydd 3D Clai Tronxy Moore 2'
                      : 'Tronxy Moore 2 Clay 3D Printer Care & Guidance'}
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

            {/* Scrollable Body: Uniform font-sans, exact text-[13.5px] leading-[22px] */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-[13.5px] leading-[22px] custom-scrollbar font-sans text-stone-800">
              
              {/* Card: Maintenance & Repair Instructions */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-stone-200 shadow-2xs space-y-3 font-sans">
                <div className="flex items-center gap-2 pb-2.5 border-b border-stone-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <h3 className="text-[13.5px] font-bold uppercase tracking-wider text-stone-800 font-sans">
                    {language === 'cy' ? 'Arweiniad Cynnal a Chadw:' : 'Maintenance & Care Guidelines:'}
                  </h3>
                </div>

                <ul className="space-y-3 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                  {/* Item 1 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Mwydwch y pen printio/ffrwyn mewn dŵr ar ôl pob print er mwyn atal y spirulina rhag sychu a chlocio'r pen printio."
                        : 'Soak the printhead/nozzle in water after every print to prevent spirulina drying out and clogging the print head.'}
                    </span>
                  </li>

                  {/* Item 2 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Cadwch yr argraffydd 3D yn lân, yn enwedig y rhannau symudol a'r rheiliau canllaw."
                        : 'Keep the 3D printer clean, especially the moving parts and guide rails.'}
                    </span>
                  </li>

                  {/* Item 3 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? 'Glanhewch yr argraffydd yn drylwyr cyn unrhyw gyfnod estynedig o anweithgarwch.'
                        : 'Thoroughly clean the printer before any extended period of inactivity.'}
                    </span>
                  </li>

                  {/* Item 4 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Gwiriwch lefel y platfform adeiladu'n rheolaidd ac addaswch yn ôl yr angen."
                        : 'Regularly check the build platform levelling and adjust as required.'}
                    </span>
                  </li>

                  {/* Item 5 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Gwiriwch densiwn y gwregysau'n rheolaidd ac addaswch os oes angen."
                        : 'Regularly check belt tension regularly and adjust if necessary.'}
                    </span>
                  </li>

                  {/* Item 6 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? 'Dilynwch gyfarwyddiadau gweithredu ac arweiniad diogelwch y gwneuthurwr bob amser.'
                        : "Always follow the manufacturer's operating instructions and safety guidance."}
                    </span>
                  </li>

                  {/* Item 7 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy'
                        ? "Ni ddarperir cefnogaeth dechnegol ar gyfer yr Argraffydd 3D Clai Tronxy Moore 2 trwy'r prosiect/ap hwn."
                        : 'Technical support for the Tronxy Moore 2 Clay 3D Printer is not provided through this project/app.'}
                    </span>
                  </li>

                  {/* Item 8 */}
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600 mt-2 shrink-0" />
                    <span className="flex-1 text-[13.5px] leading-[22px] text-stone-800 font-normal font-sans">
                      {language === 'cy' ? (
                        <>
                          Dylid riportio unrhyw ddiffygion neu faterion technegol yn uniongyrchol i{' '}
                          <a
                            href="mailto:support@tronxy.com?subject=Tronxy%20Moore%202%20Clay%203D%20Printer%20Fault%20or%20Issue"
                            className="text-blue-700 hover:text-blue-900 underline font-normal font-sans"
                          >
                            support@tronxy.com
                          </a>
                          . O fewn eich e-bost, cynhwyswch rif cyfresol yr argraffydd a disgrifiad manwl o'r broblem.
                        </>
                      ) : (
                        <>
                          Any faults or technical issues should be reported directly to{' '}
                          <a
                            href="mailto:support@tronxy.com?subject=Tronxy%20Moore%202%20Clay%203D%20Printer%20Fault%20or%20Issue"
                            className="text-blue-700 hover:text-blue-900 underline font-normal font-sans"
                          >
                            support@tronxy.com
                          </a>
                          . Within your email, include the printer serial number and a detailed description of the problem.
                        </>
                      )}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Close Action Button */}
              <div className="flex items-center justify-end pt-1 font-sans">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] text-white text-[13px] font-bold shadow-md cursor-pointer transition-all active:scale-95 font-sans"
                >
                  {language === 'cy' ? 'Cau' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
