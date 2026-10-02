import React, { useState, useEffect } from 'react';

interface AccountEditableRowProps {
  label: string;
  value: string;
  maxLength: number;
  isMultiline?: boolean;
  rows?: number;
  onChange: (newValue: string) => void;
}

export const AccountEditableRow: React.FC<AccountEditableRowProps> = ({
  label,
  value,
  maxLength,
  isMultiline = false,
  rows = 4,
  onChange,
}) => {
  const [draftVal, setDraftVal] = useState(value);

  useEffect(() => {
    setDraftVal(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDraftVal(val);
    onChange(val);
  };

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-[var(--border-subtle)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="text-[11px] text-[var(--text-muted)]">
          {draftVal.length}/{maxLength}
        </span>
      </div>

      {isMultiline ? (
        <textarea
          rows={rows}
          maxLength={maxLength}
          value={draftVal}
          onChange={handleChange}
          placeholder="Escreva algo sobre você..."
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)] resize-none transition-colors"
        />
      ) : (
        <input
          type="text"
          maxLength={maxLength}
          value={draftVal}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
        />
      )}
    </div>
  );
};
