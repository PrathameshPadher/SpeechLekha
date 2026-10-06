import React from 'react';

interface BrandProps {
  dark?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Brand: React.FC<BrandProps> = ({ dark = false, className = '', onClick }) => {
  return (
    <div
      className={`brand ${dark ? 'dark' : ''} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <span className="brandwave">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      SpeechLekha
    </div>
  );
};
