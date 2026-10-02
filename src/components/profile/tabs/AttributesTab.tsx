import React from 'react';
import { UserAttributes } from '../../../types/profile';

interface AttributesTabProps {
  attributes: UserAttributes;
}

interface AttributeItem {
  key: keyof UserAttributes;
  label: string;
}

const ATTRIBUTE_ITEMS: AttributeItem[] = [
  { key: 'exploration', label: 'Exploração' },
  { key: 'gathering', label: 'Coleta & Refino' },
  { key: 'knowledge', label: 'Conhecimento' },
  { key: 'community', label: 'Comunidade' },
  { key: 'endurance', label: 'Resistência de campo' },
  { key: 'economy', label: 'Economia MP' },
];

export const AttributesTab: React.FC<AttributesTabProps> = ({ attributes }) => {
  return (
    <div className="py-2 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ATTRIBUTE_ITEMS.map((item) => {
          const rawValue = attributes[item.key] ?? 0;
          const clampedValue = Math.min(100, Math.max(0, Number(rawValue) || 0));

          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--text-primary)]">
                  {item.label}
                </span>
                <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                  {clampedValue}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] transition-[width] duration-300 ease-out"
                  style={{ width: `${clampedValue}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
