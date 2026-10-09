import React from 'react';
import { SkeletonBlock, SkeletonCircle, SkeletonLine } from './Skeleton';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6" aria-hidden="true">
      {/* 1. Header Card (Banner + Header) */}
      <div className="rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm overflow-hidden">
        <SkeletonBlock width="100%" height={200} radius="0px" />

        <div className="relative z-20 px-6 pt-0 pb-5">
          <div className="flex items-start gap-5">
            {/* Avatar: 80px diameter, -40px overlapping banner */}
            <div className="relative shrink-0 -mt-[40px] rounded-full border-4 border-[var(--bg-surface)] shadow-[0_0_0_1px_var(--border-default)] z-30">
              <SkeletonCircle size={72} />
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
      </div>

      {/* 2. Two-column body */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main content column with tabs and card surface */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
          <div className="border-b border-[var(--border-default)]">
            <div className="flex items-center gap-6 py-3">
              <SkeletonLine width={60} height={16} radius="4px" />
              <SkeletonLine width={60} height={16} radius="4px" />
              <SkeletonLine width={75} height={16} radius="4px" />
              <SkeletonLine width={65} height={16} radius="4px" />
            </div>
          </div>

          <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 min-h-[220px] flex flex-col gap-3">
            <SkeletonLine width="100%" height={16} radius="4px" />
            <SkeletonLine width="92%" height={16} radius="4px" />
            <SkeletonLine width="75%" height={16} radius="4px" />
          </div>
        </div>

        {/* Sidebar column */}
        <div className="hidden lg:flex lg:w-[258px] shrink-0 flex-col gap-6">
          <SkeletonBlock width="100%" height={120} radius="12px" />
          <SkeletonBlock width="100%" height={90} radius="12px" />
        </div>
      </div>
    </div>
  );
};
