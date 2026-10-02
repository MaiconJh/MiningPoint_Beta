import React from 'react';
import { Link } from 'react-router-dom';

export const AdminNotFound: React.FC = () => {
  return (
    <div className="py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
        Página não encontrada
      </h1>
      <Link
        to="/admin/visao-geral"
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] text-sm font-semibold text-[var(--text-primary)] transition-colors"
      >
        Voltar à visão geral
      </Link>
    </div>
  );
};
