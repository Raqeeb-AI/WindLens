import React from 'react';
import { Wind, Calendar, BarChart3, BookOpen, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'decision' | 'accuracy' | 'methodology';
  onTabChange: (tab: 'decision' | 'accuracy' | 'methodology') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-forecast/10 border border-forecast/25 flex items-center justify-center text-forecast flex-shrink-0">
              <Wind className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg font-bold tracking-tight text-text-primary">WindLens</span>
                <span className="text-[11px] font-medium text-text-tertiary hidden sm:inline-block">/</span>
                <span className="text-xs font-medium text-text-secondary hidden sm:inline-block">
                  UK Electricity Procurement Intelligence
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary leading-none sm:hidden">
                UK Electricity Procurement Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5" aria-label="Main Navigation">
            <button
              onClick={() => onTabChange('decision')}
              aria-current={activeTab === 'decision' ? 'page' : undefined}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'decision'
                  ? 'bg-forecast text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Decision Day
            </button>

            <button
              onClick={() => onTabChange('accuracy')}
              aria-current={activeTab === 'accuracy' ? 'page' : undefined}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'accuracy'
                  ? 'bg-forecast text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Month Accuracy
            </button>

            <button
              onClick={() => onTabChange('methodology')}
              aria-current={activeTab === 'methodology' ? 'page' : undefined}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'methodology'
                  ? 'bg-forecast text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Data & Methodology
            </button>
          </nav>

          {/* Provenance Pill */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-text-secondary bg-surface-subtle px-2.5 py-1 rounded-md border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-underforecast" />
            <span className="font-medium text-text-secondary">Elexon BMRS Verified</span>
          </div>
        </div>
      </div>
    </header>
  );
};
