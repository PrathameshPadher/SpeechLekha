import React, { useEffect } from 'react';
import { PublicNav } from './PublicNav';
import { MarketingFooter } from './MarketingFooter';

interface MarketingPageLayoutProps {
  children: React.ReactNode;
  pageClass?: string;
}

export const MarketingPageLayout: React.FC<MarketingPageLayoutProps> = ({
  children,
  pageClass = ''
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`marketing-page-root ${pageClass}`}>
      {/* Ambient background aura */}
      <div className="marketing-ambient-aura" aria-hidden="true" />

      {/* Shared Navigation Header */}
      <header className="marketing-header-wrapper">
        <PublicNav />
      </header>

      {/* Main Page Content */}
      <main className="marketing-main-content">
        {children}
      </main>

      {/* Shared Marketing Footer */}
      <MarketingFooter />
    </div>
  );
};
