import React, { useState, useEffect } from 'react';
import { UserAttributes, AttributeKey } from '../../types/profile';

interface UserAttributesEditorProps {
  attributes: UserAttributes;
  onSave: (attributes: UserAttributes) => Promise<void>;
  disabled?: boolean;
}

const ATTRIBUTE_LABELS: { key: AttributeKey; label: string }[] = [
  { key: 'exploration', label: 'Exploração' },
  { key: 'gathering', label: 'Coleta & Refino' },
  { key: 'knowledge', label: 'Conhecimento' },
  { key: 'community', label: 'Comunidade' },
  { key: 'endurance', label: 'Resistência de campo' },
  { key: 'economy', label: 'Economia MP' },
];

export const UserAttributesEditor: React.FC<UserAttributesEditorProps> = ({
  attributes,
  onSave,
  disabled = false,
}) => {
  const [localValues, setLocalValues] = useState<UserAttributes>(attributes);
  const [savingKey, setSavingKey] = useState<AttributeKey | null>(null);

  useEffect(() => {
    setLocalValues(attributes);
  }, [attributes]);

  const handleChange = (key: AttributeKey, value: number) => {
    setLocalValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCommit = async (key: AttributeKey) => {
    if (disabled) return;
    if (localValues[key] === attributes[key]) return;

    setSavingKey(key);
    try {
      await onSave(localValues);
    } catch (err) {
      console.error(`Failed to save attribute ${key}:`, err);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ATTRIBUTE_LABELS.map(({ key, label }) => {
        const val = localValues[key] ?? 0;
        const isSaving = savingKey === key;

        return (
          <div
            key={key}
            className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--text-primary)]">{label}</span>
              <span className="font-mono font-bold text-[var(--brand-primary)] tabular-nums">
                {isSaving ? 'Salvando...' : val}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={val}
              disabled={disabled}
              onChange={(e) => handleChange(key, parseInt(e.target.value, 10))}
              onMouseUp={() => handleCommit(key)}
              onTouchEnd={() => handleCommit(key)}
              onKeyUp={() => handleCommit(key)}
              className="w-full accent-[var(--brand-primary)] cursor-pointer"
            />
          </div>
        );
      })}
    </div>
  );
};
