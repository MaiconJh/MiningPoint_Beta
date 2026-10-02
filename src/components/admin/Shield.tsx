import React from 'react';

interface ShieldProps {
  color: string;
}

export const Shield: React.FC<ShieldProps> = ({ color }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Membro da equipe"
      role="img"
      className="shrink-0"
      style={{ height: '16px', width: '16px' }}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
};
