import React from 'react';
import { Wind, Calendar, BarChart3, BookOpen, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'decision' | 'accuracy' | 'methodology';
  onTabChange: (tab: 'decision' | 'accuracy' | 'methodology') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-forecast/10 border border-forecast/20 flex items-center justify-center text-forecast">
              <Wind className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-xl font-bold tracking-tight text-text-primary">WindLens</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-subtle text-text-secondary border border-border">
                  UK Electricity Procurement
                </span>
              </div>
              <p className="text-xs text-text-tertiary">Cutoff-Aware National Wind Forecast Intelligence</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onTabChange('decision')}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'decision'
                  ? 'bg-forecast text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Decision Day
            </button>

            <button
              onClick={() => onTabChange('accuracy')}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'accuracy'
                  ? 'bg-forecast text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Month Accuracy
            </button>

            <button
              onClick={() => onTabChange('methodology')}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'methodology'
                  ? 'bg-forecast text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Data & Methodology
            </button>
          </nav>

          {/* Provenance Badge */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-text-secondary bg-surface-subtle px-2.5 py-1 rounded border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-underforecast" />
            <span>January 2026 Verified Scope</span>
          </div>
        </div>
      </div>
    </header>
  );
};
