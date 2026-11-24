import React from 'react';
import { CustomIcon } from '../../types/icon';
import { BadgeIconPicker } from './BadgeIconPicker';

export interface ForumIconPickerProps {
  customIcons: CustomIcon[];
  selectedIconId: string | null;
  onSelect: (iconId: string | null) => void;
  onCreated: () => Promise<void> | void;
  createdBy: string;
  disabled?: boolean;
}

export const ForumIconPicker: React.FC<ForumIconPickerProps> = ({
  customIcons,
  selectedIconId,
  onSelect,
  onCreated,
  createdBy,
  disabled = false,
}) => {
  return (
    <BadgeIconPicker
      value={selectedIconId}
      onChange={(slug) => onSelect(slug)}
      onClear={() => onSelect(null)}
      defaultValue={null}
      externalCustomIcons={customIcons}
      onCustomIconCreated={onCreated}
      createdBy={createdBy}
      defaultTitle="Padrão do sistema"
      defaultSubtitle="Ícone Lucide padrão (MessageSquare)"
      disabled={disabled}
    />
  );
};


