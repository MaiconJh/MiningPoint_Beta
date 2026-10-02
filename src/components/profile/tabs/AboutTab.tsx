import React from 'react';

interface AboutTabProps {
  bio?: string;
}

export const AboutTab: React.FC<AboutTabProps> = ({ bio }) => {
  if (!bio || bio.trim() === '') {
    return null;
  }

  return (
    <div className="py-2">
      <p className="text-base text-[var(--text-secondary)] leading-relaxed m-0 whitespace-pre-line max-w-2xl">
        {bio}
      </p>
    </div>
  );
};
