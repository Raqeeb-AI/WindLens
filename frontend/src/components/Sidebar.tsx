import React from 'react';
import {
  Compass,
  LineChart,
  BarChart3,
  Database,
  Wind,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

export type NavTab = 'overview' | 'forecast' | 'accuracy' | 'data';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen,
  onMobileToggle,
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      desc: 'Executive cutoff review',
      icon: Compass,
    },
    {
      id: 'forecast' as NavTab,
      label: 'Forecast',
      desc: 'Day-ahead deep dive',
      icon: LineChart,
    },
    {
      id: 'accuracy' as NavTab,
      label: 'Accuracy',
      desc: 'Monthly reliability stats',
      icon: BarChart3,
    },
    {
      id: 'data' as NavTab,
      label: 'Data',
      desc: 'Sources, checks & limits',
      icon: Database,
    },
  ];

  return (
    <>
      {/* Mobile Top App Bar (visible on < md screens) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-40 transition-all">
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onMobileToggle}
            className="p-1.5 -ml-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle active:scale-95 transition-transform"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-forecast/10 flex items-center justify-center text-forecast">
              <Wind className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <span className="font-serif font-bold text-base tracking-tight text-text-primary">
              WINDLENS
            </span>
          </div>
        </div>
        <span className="text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-text-tertiary">
          Jan 2026
        </span>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-text-primary/20 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={onMobileToggle}
        />
      )}

      {/* Main Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:w-60 lg:w-72 bg-surface border-r border-border flex flex-col transition-all duration-200 ease-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-forecast/10 border border-forecast/25 flex items-center justify-center text-forecast shadow-xs transition-transform hover:scale-105 flex-shrink-0">
              <Wind className="w-5 h-5 lg:w-6 lg:h-6 text-forecast stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="font-serif font-bold text-lg lg:text-xl xl:text-2xl tracking-tight text-text-primary block leading-none">
                WINDLENS
              </span>
              <span className="text-[10px] lg:text-[11px] text-text-tertiary uppercase tracking-wider font-semibold block mt-1.5 font-sans">
                Forecast Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Dataset Scope Pill */}
        <div className="px-4 sm:px-5 lg:px-6 py-2.5 lg:py-3 bg-surface-subtle/50 border-b border-border flex items-center justify-between text-[11px] lg:text-xs">
          <span className="text-text-secondary font-medium">Dataset Scope</span>
          <span className="font-mono text-text-tertiary text-[10px] lg:text-[11px] px-2.5 py-0.5 rounded-md bg-surface border border-border shadow-2xs">
            Jan 2026 Snapshot
          </span>
        </div>

        {/* Navigation Items (Overview, Forecast, Accuracy, Data) */}
        <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1.5 lg:space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  if (mobileOpen) onMobileToggle();
                }}
                className={`w-full group flex items-center justify-between px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-xl text-left transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'bg-forecast text-white font-medium shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-text-tertiary group-hover:text-forecast'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs lg:text-[13px] font-semibold leading-none">{item.label}</div>
                    <div
                      className={`text-[10px] lg:text-[11px] font-normal leading-tight mt-1 truncate ${
                        isActive ? 'text-white/85' : 'text-text-tertiary'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${
                    isActive
                      ? 'text-white translate-x-0.5'
                      : 'text-text-tertiary/40 group-hover:text-text-tertiary group-hover:translate-x-0.5'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Provenance Footer */}
        <div className="p-4 lg:p-5 border-t border-border bg-surface-subtle/40 text-[11px] lg:text-xs text-text-tertiary">
          <div className="flex items-center space-x-2 mb-1 text-underforecast font-semibold text-[11px] lg:text-xs">
            <span className="w-2 h-2 rounded-full bg-underforecast animate-pulse flex-shrink-0" />
            <span>Elexon BMRS Live Feeds</span>
          </div>
          <p className="text-[10px] lg:text-[11px] leading-tight text-text-tertiary">
            FUELHH Actuals & WINDFOR Forecasts
          </p>
        </div>
      </aside>
    </>
  );
};
