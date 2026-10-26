import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Sparkles } from 'lucide-react';

interface CalendarPopoverProps {
  selectedDate: string; // "2026-01-15"
  onSelectDate: (date: string) => void;
  availableDates: string[];
}

const CASE_STUDIES = [
  {
    date: '2026-01-15',
    title: '15 Jan · Storm Spike',
    badge: 'Overforecast',
    badgeType: 'over',
    desc: 'Rapid Atlantic front ramp with large day-ahead forecast divergence.',
    delivery: 'Delivery: 16 Jan (D+1)',
  },
  {
    date: '2026-01-24',
    title: '24 Jan · Low Wind Lull',
    badge: 'Dunkelflaute',
    badgeType: 'under',
    desc: 'Severe anti-cyclonic calm with national output dipping below 3 GW.',
    delivery: 'Delivery: 25 Jan (D+1)',
  },
  {
    date: '2026-01-05',
    title: '05 Jan · High Fleet Peak',
    badge: 'Fleet Peak',
    badgeType: 'high',
    desc: 'Widespread sustained generation exceeding 15 GW across GB wind fleets.',
    delivery: 'Delivery: 06 Jan (D+1)',
  },
];

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({
  selectedDate,
  onSelectDate,
  availableDates,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Format date nicely: "Thu, 15 Jan 2026"
  const formatDisplayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dateStr;
    }
  };

  // Format delivery date (D+1)
  const formatDeliveryDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d + 1));
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      });
    } catch {
      return '';
    }
  };

  // January 2026 starts on Thursday (day index 4, where Monday is 1, Sunday is 7)
  const daysInJan = 31;
  const emptyLeadingCells = 3;

  const handleDayClick = (dayNum: number) => {
    const formatted = `2026-01-${String(dayNum).padStart(2, '0')}`;
    if (availableDates.includes(formatted)) {
      onSelectDate(formatted);
      setIsOpen(false);
    }
  };

  const selectedDayNum = parseInt(selectedDate.split('-')[2], 10);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="touch-press inline-flex items-center space-x-2 bg-surface hover:bg-surface-subtle/80 border border-border rounded-md px-3 py-1.5 text-xs font-medium text-text-primary shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-forecast/30 active:scale-95"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarIcon className="w-4 h-4 text-forecast flex-shrink-0" />
        <span className="font-semibold tracking-tight">{formatDisplayDate(selectedDate)}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card: Spacious 2-column horizontal layout (Calendar on Left, Case Studies on Right) */}
      {isOpen && (
        <div className="animate-fade-in-up absolute left-0 mt-2 w-[640px] max-w-[calc(100vw-2rem)] rounded-2xl bg-surface border border-border-strong shadow-2xl z-50 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
            {/* Left Column: Calendar */}
            <div className="flex flex-col justify-between sm:pr-4 sm:border-r sm:border-border">
              <div>
                {/* Calendar Header */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border">
                  <span className="font-serif font-bold text-sm text-text-primary">
                    January 2026
                  </span>
                  <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-surface-subtle border border-border">
                    31 Days
                  </span>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                    <span key={d} className="text-[10px] font-semibold text-text-tertiary">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty cells before Jan 1 */}
                  {Array.from({ length: emptyLeadingCells }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8 w-8" />
                  ))}

                  {/* Days 1 to 31 */}
                  {Array.from({ length: daysInJan }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `2026-01-${String(dayNum).padStart(2, '0')}`;
                    const isAvailable = availableDates.includes(dateStr);
                    const isSelected = selectedDayNum === dayNum;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleDayClick(dayNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all duration-150 touch-press ${
                          isSelected
                            ? 'bg-forecast text-white font-bold shadow-sm ring-2 ring-forecast/30 scale-105'
                            : isAvailable
                            ? 'text-text-primary hover:bg-surface-subtle hover:scale-105 active:scale-95'
                            : 'text-text-tertiary/30 cursor-not-allowed'
                        }`}
                        aria-label={`Select ${dateStr}`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendar bottom helper */}
              <div className="mt-3 pt-2 text-[10px] text-text-tertiary text-center border-t border-border/60">
                Click any day to evaluate procurement cutoff
              </div>
            </div>

            {/* Right Column: Verified Case Studies */}
            <div className="flex flex-col justify-between sm:pl-1">
              <div>
                <div className="flex items-center space-x-1.5 pb-2 mb-2.5 border-b border-border">
                  <Sparkles className="w-3.5 h-3.5 text-forecast" />
                  <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                    Verified Case Studies
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary mb-3 leading-snug">
                  Curated operational regimes evaluated across January 2026:
                </p>

                <div className="space-y-2">
                  {CASE_STUDIES.map((cs) => {
                    const isSelected = selectedDate === cs.date;
                    return (
                      <button
                        key={cs.date}
                        type="button"
                        onClick={() => {
                          onSelectDate(cs.date);
                          setIsOpen(false);
                        }}
                        className={`touch-press w-full text-left p-2.5 rounded-xl border transition-all duration-150 ${
                          isSelected
                            ? 'bg-forecast/10 text-text-primary border-forecast shadow-xs ring-1 ring-forecast/30'
                            : 'bg-surface-subtle/40 text-text-secondary border-border hover:bg-surface-subtle hover:border-border-strong hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                cs.badgeType === 'over'
                                  ? 'bg-forecast'
                                  : cs.badgeType === 'under'
                                  ? 'bg-underforecast'
                                  : 'bg-overforecast'
                              }`}
                            />
                            <span className="font-semibold text-xs text-text-primary truncate">
                              {cs.title}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ml-1.5 ${
                              cs.badgeType === 'over'
                                ? 'bg-forecast/15 text-forecast'
                                : cs.badgeType === 'under'
                                ? 'bg-underforecast/15 text-underforecast'
                                : 'bg-overforecast/15 text-overforecast'
                            }`}
                          >
                            {cs.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary leading-normal mb-1.5 line-clamp-2">
                          {cs.desc}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                          <span className="font-mono">{cs.delivery}</span>
                          <span className="font-mono text-text-tertiary/75">{cs.date}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 pt-2 text-[10px] text-text-tertiary flex items-center justify-between border-t border-border/60">
                <span>Decision: <strong className="text-text-secondary">{selectedDate}</strong></span>
                <span>Delivery: <strong className="text-text-secondary">{formatDeliveryDisplay(selectedDate)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
