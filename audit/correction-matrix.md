# Matriz de Correção — PROJECT_STANDARDS.md vs. Código

Esta matriz realiza a triagem de todos os achados (R-01 a R-08) e práticas não documentadas (ND-01 a ND-08) identificados no relatório de auditoria (`audit/project-standards-audit.md`), classificando-os por tipo de ação (`DOC`, `DECISÃO` ou `CÓDIGO`), severidade e dependências de execução.

---

## Tabela de Triagem

| ID | Seção alvo | Resumo | Tipo | Severidade | Ação proposta | Bloqueia | Bloqueado por |
|---|---|---|---|---|---|---|---|
| **R-01** | Firebase | Ausência de arquivo `firebase.json` na raiz do workspace | `CÓDIGO` | CRÍTICA | fora do escopo — referência apenas | — | — |
| **R-02** | Firestore schema | Contradição no teto de insígnias destacadas (`featuredBadges`: linha 85 diz máx 8 vs. linha 239 e UI dizem máx 4) | `DECISÃO` | ALTA | Qual deve ser o teto definitivo de insígnias destacadas no perfil: 4 (conforme UI, carrossel e linha 239) ou 8 (conforme schema da linha 85)? | P-R02 | — |
| **R-03** | Firebase | Fallback de credenciais Firebase para JSON empacotado (`firebase-applet-config.json`) em vez de estritamente variáveis de ambiente | `DECISÃO` | ALTA | O fallback para `firebase-applet-config.json` em ambientes preview do AI Studio deve ser formalizado no documento como exceção permitida ou removido do código para exigir variáveis estritas de ambiente? | P-R03 | — |
| **R-04** | Firestore schema | Migração de `groupId` para `primaryGroupId` incompleta na persistência (leitura faz fallback, mas sem `deleteField()`) | `CÓDIGO` | MÉDIA | fora do escopo — referência apenas | — | — |
| **R-05** | Language | Chave de armazenamento local em português (`mp.tema` em vez de `mp.theme`) | `CÓDIGO` | MÉDIA | fora do escopo — referência apenas | — | — |
| **R-06** | Navigation & Account Routes | Ícone de engrenagem administrativa na NavBar visível para administradores banidos | `CÓDIGO` | MÉDIA | fora do escopo — referência apenas | — | — |
| **ND-01** | Firestore schema | Sistema de identificador único (`shortId`) e apelido amigável (`handle` / `@nick`) no perfil | `DOC` | MÉDIA | Adicionar campos `shortId`, `handle`, `hasRedefinedHandle` e `bannerUrl` no schema de `users/{uid}` e descrever regras de unicidade e redefinição. | — | — |
| **ND-02** | Firebase | Gerenciamento de imagens de perfil e banner via Firebase Storage (`src/lib/storage.ts`) | `DOC` | MÉDIA | Documentar no bloco Firebase a inclusão do serviço Cloud Storage restrito a uploads de avatares e banners com tratamento resiliente de erros. | — | — |
| **ND-03** | Styling / Badges & Icons | Arquitetura visual Effect Stack (8 efeitos de superfície e partículas acelerados por GPU) | `DOC` | MÉDIA | Documentar a fundação Effect Stack (Tilt, Spotlight, Holo, Aurora, Prism, Shimmer, Neon, Ember) e distinguir seu escopo dos efeitos em chips. | — | — |
| **ND-04** | Firestore schema | Associação opcional de tema visual (`theme?: EffectStack`) na coleção de raridades | `DOC` | MÉDIA | Incluir a propriedade opcional `theme?: EffectStack` no schema de `rarities/{rarityId}` para parametrização de efeitos em itens catalogados. | — | — |
| **ND-05** | Colour tokens | Paleta semântica de feedback no CSS global (`--feedback-*`) | `DOC` | MÉDIA | Documentar os tokens semânticos `--feedback-success`, `--feedback-warning`, `--feedback-error` e `--feedback-info` nas paletas Dark e Light. | — | — |
| **ND-06** | Colour tokens | Tokens de acento secundário/comunitário e overlays (`--brand-secondary`, `--brand-community`, etc.) | `DOC` | MÉDIA | Documentar tokens `--brand-secondary`, `--brand-community`, bordas de foco/reforço e superfícies de overlay em `:root` e `[data-theme="light"]`. | — | — |
| **ND-07** | Styling | Política de exceções controladas para tokens de design com comentários inline justificativos | `DOC` | MÉDIA | Formalizar no padrão a política de exceção inline com comentário obrigatório para camadas decorativas com fundo escuro fixo em ambos os temas. | — | — |
| **ND-08** | Firestore schema | Suporte a `chipStyle` na coleção `groups` e abstração transversal em `userCollectibles` | `DOC` | MÉDIA | Adicionar `chipStyle?: ChipStyle` no schema de `groups/{groupId}` e consolidar a unificação de insígnias e títulos sob `userCollectibles`. | — | — |
| **R-07** | Styling | Uso de literal de cor `white` em regras de animação de faísca no `effects.css` | `CÓDIGO` | BAIXA | fora do escopo — referência apenas | — | — |
| **R-08** | Navigation & Account Routes | Rota de perfil público documentada como `/perfil/:id` e implementada como `/perfil/:slug` | `DOC` | BAIXA | Atualizar rota pública para `/perfil/:slug` documentando a resolução transparente por UID, `@nick` ou `shortId`. | — | — |
