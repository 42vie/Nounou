"use client";

import { useState } from "react";
import { CODES, CODE_COLORS, type CodeJour } from "@/lib/constants/codes";

interface GrilleCodeProps {
  selectedCode: string | null;
  onSelect: (code: CodeJour) => void;
}

export default function GrilleCode({ selectedCode, onSelect }: GrilleCodeProps) {
  const [tooltipCode, setTooltipCode] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-4 gap-2">
      {CODES.map((code) => {
        const colors = CODE_COLORS[code.couleur] || CODE_COLORS.teal;
        const isSelected = selectedCode === code.code;

        return (
          <div key={code.code} className="relative">
            <button
              type="button"
              onClick={() => onSelect(code)}
              onMouseEnter={() => setTooltipCode(code.code)}
              onMouseLeave={() => setTooltipCode(null)}
              onTouchStart={() => {
                setTooltipCode((prev) => (prev === code.code ? null : code.code));
              }}
              className={`
                w-full min-h-[44px] px-2 py-2.5 rounded-xl text-sm font-semibold
                border transition-all duration-150 select-none
                ${isSelected
                  ? `${colors.bgActive} ${colors.border} ${colors.text} ring-2 ring-offset-2 ring-purple-400 shadow-md`
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
                  px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg
                  max-w-[200px] text-center leading-snug
                  pointer-events-none animate-in fade-in duration-150
                "
              >
                {code.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="w-2 h-2 bg-gray-800 rotate-45 -translate-y-1" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
