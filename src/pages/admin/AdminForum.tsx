import React, { useState } from 'react';
import { useForums } from '../../hooks/useForums';
import { useAuth } from '../../context/AuthContext';
import { Forum, ForumFormData } from '../../types/forum';
import { createForum, updateForum, deleteForum } from '../../lib/forums';
import { ForumList } from '../../components/admin/ForumList';
import { ForumForm } from '../../components/admin/ForumForm';

type ViewMode = 'list' | 'create' | 'edit';

export const AdminForum: React.FC = () => {
  const { user } = useAuth();
  const { forums, loading, error, reload } = useForums();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleNew = () => {
    setSelectedForum(null);
    setFormError(null);
    setSuccessMessage(null);
    setViewMode('create');
  };

  const handleEdit = (forum: Forum) => {
    setSelectedForum(forum);
    setFormError(null);
    setSuccessMessage(null);
    setViewMode('edit');
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedForum(null);
    setFormError(null);
  };

  const handleSave = async (data: ForumFormData) => {
    if (!user) return;
    setSaving(true);
    setFormError(null);
    try {
      if (selectedForum) {
        await updateForum(selectedForum.id, data, user.uid);
        setSuccessMessage(`Fórum "${data.title}" atualizado com sucesso.`);
      } else {
        await createForum(data, user.uid);
        setSuccessMessage(`Fórum "${data.title}" criado com sucesso.`);
      }
      await reload();
      setViewMode('list');
      setSelectedForum(null);
    } catch (err: unknown) {
      console.error('Failed to save forum:', err);
      setFormError('Erro ao salvar as configurações do fórum.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (forumId: string) => {
    setFormError(null);
    try {
      await deleteForum(forumId);
      setSuccessMessage('Fórum excluído com sucesso.');
      await reload();
      setViewMode('list');
      setSelectedForum(null);
    } catch (err: unknown) {
      console.error('Failed to delete forum:', err);
      setFormError('Erro ao excluir o fórum.');
    }
  };

  const handleToggleActive = async (forum: Forum) => {
    if (!user) return;
    try {
      await updateForum(forum.id, { isActive: !forum.isActive }, user.uid);
      await reload();
    } catch (err) {
      console.error('Failed to toggle forum active state:', err);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-4 rounded-lg bg-[var(--feedback-success)] text-[var(--text-inverse)] text-sm font-semibold flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[var(--text-inverse)] hover:opacity-80 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-[var(--feedback-error)] text-[var(--text-inverse)] text-sm font-semibold">
          {error}
        </div>
      )}

      {viewMode === 'list' ? (
        <ForumList
          forums={forums}
          loading={loading}
          onNew={handleNew}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
        />
      ) : (
        <ForumForm
          initialForum={selectedForum}
          existingForums={forums}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={selectedForum ? handleDelete : undefined}
          saving={saving}
          inlineError={formError}
        />
      )}
    </div>
  );
};
