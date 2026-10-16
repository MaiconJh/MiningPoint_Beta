import React from 'react';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { ForumCategory } from '../../types/forum';

interface ForumCategoryEditorProps {
  categories: ForumCategory[];
  onChange: (categories: ForumCategory[]) => void;
}

export const ForumCategoryEditor: React.FC<ForumCategoryEditorProps> = ({
  categories,
  onChange,
}) => {
  const handleAddCategory = () => {
    const newId = `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newCat: ForumCategory = {
      id: newId,
      name: '',
      description: '',
      order: categories.length + 1,
    };
    onChange([...categories, newCat]);
  };

  const handleUpdateCategory = (id: string, field: keyof ForumCategory, value: string | number) => {
    onChange(
      categories.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat))
    );
  };

  const handleRemoveCategory = (id: string) => {
    onChange(categories.filter((cat) => cat.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] m-0">
            Subdivisões internas (Categorias)
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-0">
            Organize os tópicos deste fórum em categorias temáticas. Caso não adicione nenhuma, os tópicos serão exibidos de forma direta.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddCategory}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors cursor-pointer border border-[var(--border-default)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar subdivisão
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="p-4 rounded-lg border border-dashed border-[var(--border-default)] text-center">
          <p className="text-sm text-[var(--text-muted)] m-0">
            Nenhuma subdivisão cadastrada. Os tópicos serão listados diretamente na raiz do fórum.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] flex flex-col sm:flex-row gap-3 items-start sm:items-center"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => handleUpdateCategory(cat.id, 'name', e.target.value)}
                    placeholder="Ex: Anúncios, Dúvidas, Bugs"
                    className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={cat.description}
                    onChange={(e) => handleUpdateCategory(cat.id, 'description', e.target.value)}
                    placeholder="Finalidade desta subdivisão"
                    className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cat.order}
                    onChange={(e) =>
                      handleUpdateCategory(cat.id, 'order', parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveCategory(cat.id)}
                aria-label={`Remover subdivisão ${cat.name || index + 1}`}
                className="self-end sm:self-center p-2 text-[var(--text-muted)] hover:text-[var(--feedback-error)] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
