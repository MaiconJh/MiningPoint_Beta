import React from 'react';
import { SkeletonLine } from './Skeleton';

interface AccountSectionSkeletonProps {
  rows?: number;
}

export const AccountSectionSkeleton: React.FC<AccountSectionSkeletonProps> = ({
  rows = 4,
}) => {
  return (
    <section
      className="rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col"
      aria-hidden="true"
    >
      {/* Section label */}
      <div className="mb-3">
        <SkeletonLine width={90} height={11} radius="3px" />
      </div>

      <div className="flex flex-col">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={`flex flex-col gap-1 py-3 ${
              index < rows - 1 ? 'border-b border-[var(--border-subtle)]' : ''
            }`}
          >
            <SkeletonLine width={60} height={11} radius="3px" />
            <SkeletonLine width={140} height={16} radius="4px" className="mt-1" />
          </div>
        ))}
      </div>
    </section>
  );
};
