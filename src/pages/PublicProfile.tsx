import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resolveSlugToUid } from '../lib/handle';
import { ProfileView } from '../components/profile/ProfileView';
import { ProfileSkeleton } from '../components/skeleton/ProfileSkeleton';

export const PublicProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [resolvedUid, setResolvedUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setResolvedUid(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    resolveSlugToUid(slug)
      .then((uid) => {
        if (isMounted) {
          setResolvedUid(uid);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao resolver slug do perfil:', err);
        if (isMounted) {
          setResolvedUid(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!resolvedUid) {
    return (
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
          Perfil não encontrado
        </h1>
        <p className="text-base text-[var(--text-secondary)] mb-6 max-w-md">
          O perfil solicitado não está disponível ou não foi encontrado.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] text-sm font-semibold text-[var(--text-primary)] transition-colors"
        >
          Voltar para o início
        </Link>
      </div>
    );
  }

  return <ProfileView userId={resolvedUid} ownMode={false} />;
};
