# Regras de Lint para Design Tokens

Este diretório contém os guardrails automatizados de design tokens do MiningPoint, implementados como regras locais do ESLint.

## Fundamentação e Normas

De acordo com o `PROJECT_STANDARDS.md`:

> **Styling**  
> Tailwind utility classes for layout, typography, flexbox, grid and structure.  
> CSS custom properties in the global CSS file, exclusively for the colour and theme system. Colours defined in `:root`. **Never use Tailwind colour utilities directly** (no `bg-slate-900`, no `text-blue-500`).

Para garantir aderência estrita a essa diretriz e prevenir regressões visuais e problemas de contraste nos temas claro e escuro, definimos duas regras locais:

---

## Regras

### 1. `design-tokens/no-tailwind-color-utilities`
- **O que faz:** Proíbe classes utilitárias de cor da paleta padrão do Tailwind (como `text-emerald-400`, `bg-amber-500/10`, `border-rose-300`, `hover:text-red-500`, `bg-white`, `text-black`, `from-sky-500`).
- **Por que existe:** O projeto utiliza um sistema baseado em variáveis CSS customizadas (`var(--...)`) e `color-mix` no arquivo global (`src/index.css`), garantindo a integridade dos temas claro e escuro. Cores utilitárias hardcoded quebram o contraste em um dos temas.
- **Alternativa correta:** Usar tokens semânticos do tema, por exemplo: `text-[var(--feedback-success)]`, `bg-[var(--bg-surface)]`, `border-[color-mix(in_srgb,var(--feedback-warning)_30%,transparent)]`.

### 2. `design-tokens/no-raw-color-literals`
- **O que faz:** Proíbe o uso de literais de cor cruas (códigos hexadecimais como `#fff` ou funções como `rgb(...)`, `rgba(...)`, `hsl(...)`) em classes utilitárias arbitrárias do Tailwind (`className="text-[#fff]"`) e em propriedades de estilo inline JSX (`style={{ backgroundColor: '#333B46' }}`).
- **Por que existe:** Impede o acoplamento de valores de cor estáticos aos componentes, assegurando que todas as cores sejam governadas pelos tokens semânticos e propriedades customizadas no `:root` e `[data-theme="light"]`.
- **Alternativa correta:** Usar referências a tokens de tema (`style={{ color: 'var(--brand-primary)' }}`) ou classes baseadas nos tokens.

---

## Política de Exceções

1. **Apenas desativações inline:** É terminantemente proibido adicionar `ignores` globais no `eslint.config.js` para silenciar as regras `design-tokens/*`.
2. **Formato obrigatório:** Qualquer exceção pontual deve ser feita estritamente no local de uso com `/* eslint-disable-next-line <regra> */` acompanhado de um comentário de uma linha justificando a necessidade técnica.
3. **Casos legítimos conhecidos:**
   - `ProfileBanner.tsx` e `BadgeCarousel.tsx`: utilizam cores literais deliberadamente para criar a textura gráfica do banner decorativo (que deve permanecer escura em ambos os temas para manter a legibilidade das insígnias e ilustrações). Nesses casos, a desativação é feita inline com o comentário explicativo correspondente.
