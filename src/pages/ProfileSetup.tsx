import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertTriangleIcon from 'lucide-react/dist/esm/icons/alert-triangle';
import AtSignIcon from 'lucide-react/dist/esm/icons/at-sign';
import CheckIcon from 'lucide-react/dist/esm/icons/check';
import LogOutIcon from 'lucide-react/dist/esm/icons/log-out';
import UserIcon from 'lucide-react/dist/esm/icons/user';
import { useAuth } from '../context/AuthContext';
import { validateHandle } from '../lib/handle';
import { completeProfileSetup, validateDisplayName } from '../lib/users';

const mapSetupErrorMessage = (error: unknown, isBanned: boolean): string => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  if (code === 'permission-denied') {
    return isBanned
      ? 'Sua conta está suspensa e não possui permissão para concluir o perfil.'
      : 'Você não tem permissão para concluir a configuração do perfil no momento.';
  }

  if (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'network-request-failed'
  ) {
    return 'Falha de conexão com o servidor. Verifique sua internet e tente novamente.';
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Não foi possível concluir a configuração do perfil. Tente novamente.';
};

export const ProfileSetup: React.FC = () => {
  const { user, profile, refreshProfile, signOutUser } = useAuth();
  const navigate = useNavigate();

  // Never prefill displayName from Google; require an explicit user choice.
  const [displayName, setDisplayName] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [touchedDisplayName, setTouchedDisplayName] = useState(false);
  const [touchedHandle, setTouchedHandle] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [retryingProfile, setRetryingProfile] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isBanned = profile?.isBanned === true;

  const displayNameResult = validateDisplayName(displayName);
  const handleResult = validateHandle(handleInput);

  const showDisplayNameError =
    (touchedDisplayName || hasSubmitted) && !displayNameResult.valid;
  const displayNameError = showDisplayNameError ? displayNameResult.reason : null;

  const showHandleError = (touchedHandle || hasSubmitted) && !handleResult.valid;
  const handleError = showHandleError ? handleResult.reason : null;

  const trimmedDisplayNameLength = displayName.trim().length;

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      setSubmitError(null);
      await signOutUser();
      navigate('/entrar', { replace: true });
    } catch (err: unknown) {
      console.error('Error signing out during profile setup:', err);
      setSubmitError('Não foi possível sair da conta agora. Tente novamente.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleRetryProfile = async () => {
    try {
      setRetryingProfile(true);
      setSubmitError(null);
      await refreshProfile();
    } catch (err: unknown) {
      console.error('Error refreshing profile during setup:', err);
      setSubmitError('Não foi possível carregar os dados da conta. Tente novamente.');
    } finally {
      setRetryingProfile(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    setSubmitError(null);

    if (!user) {
      setSubmitError('Sessão expirada. Entre novamente com sua conta Google.');
      return;
    }

    if (isBanned) {
      setSubmitError(
        'Sua conta está suspensa e não possui permissão para concluir o perfil.'
      );
      return;
    }

    const nameCheck = validateDisplayName(displayName);
    const nickCheck = validateHandle(handleInput);

    if (!nameCheck.valid || !nickCheck.valid) {
      return;
    }

    try {
      setSubmitting(true);
      await completeProfileSetup(user.uid, displayName, handleInput);
      await refreshProfile();
      navigate('/perfil', { replace: true });
    } catch (err: unknown) {
      console.error('Error completing profile setup:', err);
      setSubmitError(mapSetupErrorMessage(err, isBanned));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-default)] text-[var(--text-primary)] flex flex-col items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-lg flex flex-col gap-4">
        {/* Compact top bar without global navigation */}
        <header className="flex items-center justify-between gap-4 px-1">
          <span className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
            MiningPoint
          </span>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut || submitting}
            aria-label="Sair da conta"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] text-xs font-medium text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <LogOutIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
            <span>{signingOut ? 'Saindo...' : 'Sair'}</span>
          </button>
        </header>

        {/* Main onboarding card */}
        <main className="w-full rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] m-0 leading-tight">
              Configure sua identidade pública
            </h1>
            <p className="text-sm text-[var(--text-secondary)] m-0 leading-relaxed">
              Antes de acessar a comunidade, escolha como você será apresentado publicamente.
            </p>
            {user?.email && (
              <p className="text-xs text-[var(--text-muted)] m-0">
                Conta conectada: <span className="font-medium text-[var(--text-secondary)]">{user.email}</span>
              </p>
            )}
          </div>

          {profile === null ? (
            <div className="flex flex-col gap-4 p-4 rounded-xl border border-[color-mix(in_srgb,var(--feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)]">
              <p className="text-sm text-[var(--feedback-error)] m-0 leading-relaxed" role="alert">
                Não foi possível carregar os dados do seu perfil. Tente recarregar ou saia para entrar novamente.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetryProfile}
                  disabled={retryingProfile}
                  className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] hover:opacity-90 text-[var(--text-on-primary)] text-xs font-semibold transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {retryingProfile ? 'Recarregando...' : 'Tentar novamente'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {isBanned && (
                <div
                  role="alert"
                  className="p-4 rounded-xl border border-[color-mix(in_srgb,var(--feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] flex items-start gap-3"
                >
                  <AlertTriangleIcon
                    className="w-5 h-5 text-[var(--feedback-error)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-[var(--feedback-error)] leading-relaxed m-0">
                    Sua conta está suspensa e não pode concluir a configuração do perfil. Utilize o botão Sair para trocar de conta Google.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                {/* Field 1: Display Name */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="profile-setup-display-name"
                      className="text-sm font-semibold text-[var(--text-primary)]"
                    >
                      Nome de exibição <span className="text-[var(--feedback-error)]" aria-hidden="true">*</span>
                    </label>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {trimmedDisplayNameLength}/50
                    </span>
                  </div>

                  <p
                    id="profile-setup-display-name-help"
                    className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed"
                  >
                    Este nome será exibido publicamente no seu perfil, no fórum e na lista de membros.
                  </p>

                  <div className="relative flex items-center mt-1">
                    <UserIcon
                      className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="profile-setup-display-name"
                      name="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (!touchedDisplayName) setTouchedDisplayName(true);
                        if (submitError) setSubmitError(null);
                      }}
                      onBlur={() => setTouchedDisplayName(true)}
                      maxLength={50}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(displayNameError)}
                      aria-describedby={
                        displayNameError
                          ? 'profile-setup-display-name-help profile-setup-display-name-error'
                          : 'profile-setup-display-name-help'
                      }
                      autoComplete="off"
                      disabled={submitting || signingOut || isBanned}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[var(--bg-surface-elevated)] text-sm text-[var(--text-primary)] focus:outline-none transition-colors disabled:opacity-50 ${
                        displayNameError
                          ? 'border-[var(--feedback-error)] focus:border-[var(--feedback-error)]'
                          : 'border-[var(--border-default)] focus:border-[var(--brand-primary)]'
                      }`}
                    />
                  </div>

                  {displayNameError && (
                    <p
                      id="profile-setup-display-name-error"
                      role="alert"
                      className="text-xs text-[var(--feedback-error)] m-0 mt-0.5"
                    >
                      {displayNameError}
                    </p>
                  )}
                </div>

                {/* Field 2: @nick */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="profile-setup-handle"
                    className="text-sm font-semibold text-[var(--text-primary)]"
                  >
                    @nick <span className="text-[var(--feedback-error)]" aria-hidden="true">*</span>
                  </label>

                  <p
                    id="profile-setup-handle-help"
                    className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed"
                  >
                    Identificador exclusivo usado na URL do seu perfil e para encontrar você na comunidade. Use de 3 a 20 caracteres (letras minúsculas, números e sublinhado, começando por letra).
                  </p>

                  <div className="relative flex items-center mt-1">
                    <AtSignIcon
                      className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="profile-setup-handle"
                      name="handle"
                      type="text"
                      value={handleInput}
                      onChange={(e) => {
                        setHandleInput(e.target.value);
                        if (!touchedHandle) setTouchedHandle(true);
                        if (submitError) setSubmitError(null);
                      }}
                      onBlur={() => setTouchedHandle(true)}
                      maxLength={20}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(handleError)}
                      aria-describedby={
                        handleError
                          ? 'profile-setup-handle-help profile-setup-handle-warning profile-setup-handle-error'
                          : 'profile-setup-handle-help profile-setup-handle-warning'
                      }
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      disabled={submitting || signingOut || isBanned}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[var(--bg-surface-elevated)] text-sm font-mono text-[var(--text-primary)] focus:outline-none transition-colors disabled:opacity-50 ${
                        handleError
                          ? 'border-[var(--feedback-error)] focus:border-[var(--feedback-error)]'
                          : 'border-[var(--border-default)] focus:border-[var(--brand-primary)]'
                      }`}
                    />
                  </div>

                  {handleError && (
                    <p
                      id="profile-setup-handle-error"
                      role="alert"
                      className="text-xs text-[var(--feedback-error)] m-0 mt-0.5"
                    >
                      {handleError}
                    </p>
                  )}

                  {!handleError && handleResult.valid && (
                    <p className="text-xs text-[var(--feedback-success)] m-0 mt-0.5 inline-flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        Identificador formatado: <strong className="font-mono">@{handleResult.handle}</strong>
                      </span>
                    </p>
                  )}

                  <div
                    id="profile-setup-handle-warning"
                    className="mt-2 p-3.5 rounded-lg border border-[color-mix(in_srgb,var(--feedback-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--feedback-warning)_10%,transparent)] flex items-start gap-2.5"
                  >
                    <AlertTriangleIcon
                      className="w-4 h-4 text-[var(--feedback-warning)] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-[var(--feedback-warning)] leading-relaxed m-0">
                      Escolha seu @nick com atenção: depois desta confirmação inicial, ele só poderá ser redefinido uma única vez.
                    </p>
                  </div>
                </div>

                {/* Submission / network / permission / uniqueness error */}
                {submitError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg border border-[color-mix(in_srgb,var(--feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] text-xs text-[var(--feedback-error)] leading-relaxed"
                  >
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || signingOut || isBanned}
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[var(--brand-primary)] hover:opacity-90 disabled:opacity-45 text-[var(--text-on-primary)] text-sm font-semibold tracking-wide transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? 'Salvando identidade...' : 'Confirmar e continuar'}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
