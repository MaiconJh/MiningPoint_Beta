import React from 'react';
import {
  ForumPermissionMap,
  PermissionRule,
  PermissionMode,
} from '../../types/forum';
import { useGroups } from '../../hooks/useGroups';

interface ForumPermissionEditorProps {
  permissions: ForumPermissionMap;
  onChange: (permissions: ForumPermissionMap) => void;
}

const MODE_LABELS: Record<PermissionMode, string> = {
  anyone: 'Qualquer visitante (público)',
  authenticated: 'Qualquer membro autenticado',
  groups: 'Grupos específicos',
  staff: 'Equipe / Staff',
  admin: 'Apenas Administradores',
};

interface RuleRowProps {
  title: string;
  description: string;
  rule: PermissionRule;
  availableGroups: { id: string; name: string }[];
  onChange: (updatedRule: PermissionRule) => void;
}

const RuleRow: React.FC<RuleRowProps> = ({
  title,
  description,
  rule,
  availableGroups,
  onChange,
}) => {
  const handleModeChange = (mode: PermissionMode) => {
    onChange({
      ...rule,
      mode,
    });
  };

  const handleToggleGroup = (groupId: string) => {
    const current = new Set(rule.groupIds || []);
    if (current.has(groupId)) {
      current.delete(groupId);
    } else {
      current.add(groupId);
    }
    onChange({
      ...rule,
      groupIds: Array.from(current),
    });
  };

  return (
    <div className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </span>
          <p className="text-xs text-[var(--text-muted)] m-0">
            {description}
          </p>
        </div>
        <select
          value={rule.mode}
          onChange={(e) => handleModeChange(e.target.value as PermissionMode)}
          className="px-2.5 py-1.5 text-xs rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
        >
          {Object.entries(MODE_LABELS).map(([modeKey, label]) => (
            <option key={modeKey} value={modeKey}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {rule.mode === 'groups' && (
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
            Grupos com acesso:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableGroups.map((g) => {
              const checked = (rule.groupIds || []).includes(g.id);
              return (
                <label
                  key={g.id}
                  className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleGroup(g.id)}
                    className="rounded border-[var(--border-default)] accent-[var(--brand-primary)]"
                  />
                  <span>{g.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ForumPermissionEditor: React.FC<ForumPermissionEditorProps> = ({
  permissions,
  onChange,
}) => {
  const { groups } = useGroups();

  const handleUpdateRule = (
    section: 'view' | 'createThread' | 'comment',
    updatedRule: PermissionRule
  ) => {
    onChange({
      ...permissions,
      [section]: updatedRule,
    });
  };

  const handleUpdateModerateRule = (
    action: 'pin' | 'lock' | 'move' | 'remove',
    updatedRule: PermissionRule
  ) => {
    onChange({
      ...permissions,
      moderate: {
        ...permissions.moderate,
        [action]: updatedRule,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] m-0">
          Regras de Acesso e Permissões
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 mb-0">
          Defina com precisão quem tem permissão para visualizar, criar tópicos, comentar e moderar este fórum.
        </p>
      </div>

      <div className="space-y-3">
        <RuleRow
          title="Visualização do Fórum"
          description="Quem pode acessar e ler os tópicos deste fórum."
          rule={permissions.view}
          availableGroups={groups}
          onChange={(r) => handleUpdateRule('view', r)}
        />

        <RuleRow
          title="Criação de Tópicos"
          description="Quem pode publicar novos tópicos neste fórum."
          rule={permissions.createThread}
          availableGroups={groups}
          onChange={(r) => handleUpdateRule('createThread', r)}
        />

        <RuleRow
          title="Comentários e Respostas"
          description="Quem pode responder a tópicos existentes."
          rule={permissions.comment}
          availableGroups={groups}
          onChange={(r) => handleUpdateRule('comment', r)}
        />

        <div className="pt-2">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
            Permissões de Moderação Granular
          </span>
          <div className="space-y-3">
            <RuleRow
              title="Fixar Tópicos"
              description="Quem pode destacar ou desafixar tópicos no topo da listagem."
              rule={permissions.moderate.pin}
              availableGroups={groups}
              onChange={(r) => handleUpdateModerateRule('pin', r)}
            />

            <RuleRow
              title="Trancar Tópicos"
              description="Quem pode fechar ou reabrir tópicos para novos comentários."
              rule={permissions.moderate.lock}
              availableGroups={groups}
              onChange={(r) => handleUpdateModerateRule('lock', r)}
            />

            <RuleRow
              title="Mover Tópicos"
              description="Quem pode transferir tópicos entre subdivisões internas."
              rule={permissions.moderate.move}
              availableGroups={groups}
              onChange={(r) => handleUpdateModerateRule('move', r)}
            />

            <RuleRow
              title="Remover Conteúdo"
              description="Quem pode ocultar/remover tópicos e comentários e analisar denúncias."
              rule={permissions.moderate.remove}
              availableGroups={groups}
              onChange={(r) => handleUpdateModerateRule('remove', r)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
