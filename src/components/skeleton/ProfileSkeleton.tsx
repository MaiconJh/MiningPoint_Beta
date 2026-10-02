import React from 'react';
import { SkeletonBlock, SkeletonCircle, SkeletonLine } from './Skeleton';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-8" aria-hidden="true">
      <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm overflow-hidden">
        {/* 1. Banner */}
        <SkeletonBlock width="100%" height={200} radius="0px" />

        {/* 2. Header row */}
        <div className="relative z-20 px-6 pt-0 pb-0">
          <div className="flex items-start gap-4">
            {/* Avatar: 60px diameter, -30px overlapping banner */}
            <div className="relative shrink-0 -mt-[30px] rounded-full border-4 border-[var(--bg-default)] shadow-[0_0_0_1px_var(--border-default)] z-30">
              <SkeletonCircle size={52} />
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 pt-2 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonLine width={220} height={26} radius="6px" />
                <SkeletonBlock width={80} height={20} radius="9999px" />
              </div>
              <SkeletonLine width={140} height={14} radius="4px" />
            </div>
          </div>
        </div>

        {/* 3. Tabs row */}
        <div className="mt-6 px-6 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-6 py-3">
            <SkeletonLine width={60} height={16} radius="4px" />
            <SkeletonLine width={60} height={16} radius="4px" />
            <SkeletonLine width={75} height={16} radius="4px" />
            <SkeletonLine width={65} height={16} radius="4px" />
          </div>
        </div>

        {/* 4. Two-column body */}
        <div className="p-6 flex flex-col lg:flex-row gap-6 items-start">
          {/* Main content column */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-3 py-2">
            <SkeletonLine width="100%" height={16} radius="4px" />
            <SkeletonLine width="92%" height={16} radius="4px" />
            <SkeletonLine width="75%" height={16} radius="4px" />
          </div>

          {/* Sidebar column */}
          <div className="hidden lg:flex lg:w-80 shrink-0 flex-col gap-4">
            <SkeletonBlock width="100%" height={120} radius="12px" />
            <SkeletonBlock width="100%" height={90} radius="12px" />
          </div>
        </div>
      </div>
    </div>
  );
};
