"use client";

import { useState, useCallback } from "react";
import { CODES, CODE_COLORS, type CodeJour } from "@/lib/constants/codes";

interface GrilleCodeProps {
  selectedCode: string | null;
  onSelect: (code: CodeJour) => void;
}

export default function GrilleCode({ selectedCode, onSelect }: GrilleCodeProps) {
  const [tooltipCode, setTooltipCode] = useState<string | null>(null);

  const handleTouchStart = useCallback((code: string) => {
    setTooltipCode((prev) => (prev === code ? null : code));
  }, []);

  const handleMouseEnter = useCallback((code: string) => {
    setTooltipCode(code);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltipCode(null);
  }, []);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Type de journée
      </label>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {CODES.map((code) => {
          const colors = CODE_COLORS[code.couleur] || CODE_COLORS.teal;
          const isSelected = selectedCode === code.code;

          return (
            <div key={code.code} className="relative">
              <button
                type="button"
                onClick={() => {
                  onSelect(code);
                  setTooltipCode(null);
                }}
                onMouseEnter={() => handleMouseEnter(code.code)}
                onMouseLeave={handleMouseLeave}
                onTouchStart={() => {
                  // On long press show tooltip, on quick tap just select
                  handleTouchStart(code.code);
                }}
                className={`
                  w-full min-h-[44px] px-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold
                  border-2 transition-all duration-150 select-none
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
                  ${isSelected
                    ? `${colors.bgActive} ${colors.border} ${colors.text} ring-2 ring-offset-2 ring-purple-400 shadow-md scale-[1.02]`
                    : `${colors.bg} ${colors.border} ${colors.text} hover:shadow-sm active:scale-95`
                  }
                `}
              >
                {code.label}
              </button>

              {/* Tooltip */}
              {tooltipCode === code.code && (
                <div
                  className="
                    absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
                    px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-xl
                    max-w-[220px] text-center leading-snug
                    pointer-events-none
                    animate-in fade-in slide-in-from-bottom-1 duration-150
                  "
                  role="tooltip"
                >
                  {code.tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="w-2 h-2 bg-gray-900 rotate-45 -translate-y-1" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
