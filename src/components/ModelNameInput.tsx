import React from 'react';
import { FileText } from 'lucide-react';

export interface ModelNameInputProps {
  modelName: string;
  onChange: (value: string) => void;
  language: 'en' | 'cy';
  highlightedSection?: string | null;
  theme?: 'emerald' | 'amber' | 'orange';
  className?: string;
}

export const ModelNameInput: React.FC<ModelNameInputProps> = ({
  modelName,
  onChange,
  language,
  highlightedSection,
  theme = 'emerald',
  className = '',
}) => {
  const themeColors = {
    emerald: {
      dot: 'bg-[#15803D]',
      highlight: 'ring-4 ring-[#15803D]/50 border-[#15803D]',
      border: 'border-stone-200',
      focusBorder: 'focus-within:border-[#15803D]',
      headerText: 'text-emerald-900',
    },
    amber: {
      dot: 'bg-[#854D0E]',
      highlight: 'ring-4 ring-[#854D0E]/50 border-[#854D0E]',
      border: 'border-stone-200',
      focusBorder: 'focus-within:border-[#854D0E]',
      headerText: 'text-amber-900',
    },
    orange: {
      dot: 'bg-[#EA580C]',
      highlight: 'ring-4 ring-[#EA580C]/50 border-[#EA580C]',
      border: 'border-stone-200',
      focusBorder: 'focus-within:border-[#EA580C]',
      headerText: 'text-orange-900',
    },
  };

  const currentTheme = themeColors[theme] || themeColors.emerald;
  const isHighlighted = highlightedSection === 'subsec-save-name';

  return (
    <div
      id="subsec-save-name-container"
      className={`rounded-xl p-2.5 pb-2 border-2 transition-all duration-300 relative bg-[#FAF8F5] ${
        isHighlighted
          ? `${currentTheme.highlight} scale-[1.01] shadow-[0_0_20px_rgba(0,0,0,0.15)]`
          : currentTheme.border
      } ${className}`}
    >
      <div className="text-[10px] font-black uppercase tracking-wider font-sans mb-1 flex items-center justify-between text-stone-600">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.dot}`} />
          {language === 'cy' ? 'Enwch eich model yma' : 'Name your model here'}
        </div>
      </div>
      <div className={`flex items-center gap-2 bg-stone-50 border-2 border-stone-300 rounded-lg px-2 py-1 ${currentTheme.focusBorder} transition-all`}>
        <FileText className="w-4 h-4 text-stone-400 shrink-0" />
        <input
          type="text"
          value={modelName}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent w-full font-bold text-xs text-stone-900 outline-none font-mono"
          placeholder={language === 'cy' ? 'enw-model' : 'model'}
          maxLength={30}
        />
      </div>
    </div>
  );
};
