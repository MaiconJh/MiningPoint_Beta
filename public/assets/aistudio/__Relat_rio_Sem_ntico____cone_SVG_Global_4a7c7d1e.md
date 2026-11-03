# Relatório Semântico — Ícone SVG Global dos Fóruns

> Baseado na leitura integral do repositório `MaiconJh/MiningPoint_Beta` (main). Nenhuma suposição sobre estrutura — todos os pontos abaixo têm evidência direta nos arquivos lidos.

---

## 1. Problema (verificável)

Adicionar um **ícone SVG global** configurável em *Admin → Configurações*, exibido em todos os cards de `ForumIndex` independentemente do ícone específico de cada fórum. Critério de sucesso: alterar a configuração reflete nos cards **em tempo real** (sem reload); remover a configuração restaura o fallback Lucide `<Compass>`; nenhum fórum precisa ser editado ou migrado.

**Estado:** definido · **Confiança:** alta · **Evidência:** requisito do usuário.

---

## 2. Onde armazenar (decisão)

A coleção `icons` já existe e é consumida por `listCustomIcons()` com `orderBy('name','asc')`. Isso significa que **qualquer documento sem o campo `name` fica naturalmente fora da listagem** — comportamento que o Firestore aplica por padrão em queries ordenadas por campo ausente.

Decisão: usar a própria coleção `icons`, com um documento **reservado** cujo id é literalmente `settings`. Esse documento não é um `CustomIcon`; é um **ponteiro** com três campos semânticos:

- `kind` — discriminante (`'global-forum-icon'`), protege contra colisões futuras caso outro setting precise morar ali.
- `iconId` — referência a um `icons/{iconId}` real; `null` significa "usar `<Compass>`".
- `updatedAt` / `updatedBy` — auditoria.

O SVG propriamente dito **continua** sendo um `CustomIcon` normal em `icons/{iconId}`, criado/validado pelos componentes que já existem (`SvgSourceInput` + `SvgPreview` + `createCustomIcon`). Reuso total, zero duplicação de modelo.

**Por que não uma coleção `settings` separada:** o usuário pediu explicitamente reuso de `icons`; além disso, criar uma coleção nova exigiria um segundo hook de `onSnapshot` sobre outra raiz. O discriminante `kind` cobre a evolução sem essa duplicação.

**Estado:** validado · **Confiança:** alta · **Evidência:** `lib/icons.ts` (`orderBy('name','asc')`), `types/icon.ts` (`CustomIcon` exige `name`).

---

## 3. Mapa de arquivos e alterações (semântica)

### 3.1. `src/types/icon.ts` — **alterar**

Acrescentar as constantes `GLOBAL_FORUM_ICON_DOC_ID = 'settings'` e `GLOBAL_FORUM_ICON_KIND = 'global-forum-icon'`, e a interface `GlobalForumIconSetting` com os quatro campos acima. Justificativa: o resto do código precisa de um contrato tipado para o ponteiro. **Onde:** ao final do arquivo. **Estado:** planejado.

### 3.2. `src/lib/icons.ts` — **alterar**

Três adições e uma correção:

1. **Filtro defensivo em `listCustomIcons`**: dentro do `forEach`, ignorar explicitamente qualquer documento cujo `d.id === GLOBAL_FORUM_ICON_DOC_ID`. Mesmo que o Firestore já exclua por ausência de `name`, o filtro documenta a intenção e protege contra mudanças futuras de schema. **Onde:** dentro do callback do `forEach`.

2. **Três funções novas ao final**:
   - `getGlobalForumIconConfig` — leitura pontual do doc `icons/settings`; retorna `null` se não existir ou se o `kind` não bater.
   - `setGlobalForumIconConfig(iconId, updatedBy)` — `setDoc` com `merge: true` sobre `icons/settings`, gravando `kind`, `iconId`, `updatedAt: serverTimestamp()` e `updatedBy`.
   - `subscribeGlobalForumIconConfig(callback)` — `onSnapshot` sobre o mesmo doc, retornando a função de `unsubscribe`. Mesma validação de `kind`.

3. **Auto-limpeza em `deleteCustomIcon`**: **antes** de apagar o documento do ícone, verificar se ele é o alvo da configuração global; se for, chamar `setGlobalForumIconConfig(null, 'system')` primeiro. Isso evita ponteiro órfão quando o admin apaga um ícone pela página *Admin → Ícones* e ele estava sendo usado como ícone global. **Onde:** dentro de `deleteCustomIcon`, depois da checagem de `isIconInUse` e antes do `deleteDoc`.

**Por que esse último ponto importa:** sem ele, um `iconId` referenciando um doc inexistente faria `getCustomIcon` retornar `null`, o que é tratado como fallback — mas o banco ficaria com estado inconsistente (ponteiro para o nada). A auto-limpeza mantém a invariante "se `iconId !== null`, então existe `icons/{iconId}`".

**Estado:** planejado · **Confiança:** alta · **Evidência:** contrato de `deleteCustomIcon` e `getCustomIcon` já presentes.

### 3.3. `src/hooks/useGlobalForumIcon.ts` — **novo**

Hook que combina duas leituras em um único contrato consumível:

- Assina o ponteiro via `subscribeGlobalForumIconConfig` (tempo real).
- Quando `setting.iconId` muda para um valor não-nulo, faz `getCustomIcon(iconId)` (leitura pontual, O(1)) e guarda o `CustomIcon` resolvido em estado.
- Expõe `{ setting, icon, loading }`.

**Por que não usar `useCustomIcons()` aqui:** aquele hook carrega toda a coleção via `getDocs`. Em `ForumIndex` só precisamos **de um** ícone. Fazer uma leitura cirúrgica por mudança de `iconId` custa 1 read em vez de N e evita re-renders amplos.

**Por que não assinar o ícone também com `onSnapshot`:** o ícone muda muito raramente; uma leitura pontual por mudança de `iconId` é suficiente e reduz listeners abertos. Se no futuro existir edição ao vivo do SVG, troca-se por `onSnapshot` — mudança localizada ao hook.

**Estado:** planejado · **Confiança:** alta · **Condições:** o ícone global deve ser um `CustomIcon` completo (tem `svg` e `viewBox`). **Limitações:** se `getCustomIcon` falhar por rede, o `icon` fica `null` e o card cai para `<Compass>` — comportamento desejável.

### 3.4. `src/components/admin/GlobalForumIconPicker.tsx` — **novo**

Componente composto por quatro zonas, em ordem vertical:

1. **Preview do selecionado** — card interno mostrando o ícone resolvido (via `createCustomIconComponent` importado de `data/icons/iconRegistry`, **não** de `lib/icons`) + nome + `icons/{id}` + botão `×` que chama `onSelect(null)`.
2. **Duas abas** — *Escolher existente* e *Criar novo SVG*, com underline ativo no padrão `border-b-2 border-[var(--brand-primary)]` já usado em `AdminConfig`.
3. **Aba "existente"** — grade responsiva com uma opção fixa "Padrão (Compass)" na primeira célula, seguida de cada `CustomIcon` recebido por prop `customIcons`. Estado selecionado indica com `check` no canto e borda `--brand-primary`. Não inventa filtro por categoria (o usuário não pediu).
4. **Aba "novo"** — campo de nome + `SvgSourceInput` + `SvgPreview` (condicional, só quando o SVG está válido) + botão "Criar e selecionar". Ao criar, chama `createCustomIcon` (mesma função usada em `AdminIcons`), e em seguida `onSelect(id)` e `onCreated()` para o pai recarregar a lista.

**Contrato de props:** `customIcons`, `selectedIconId`, `onSelect`, `onCreated`, `createdBy`, `disabled`. O componente **não** persiste o ponteiro global; isso fica em `AdminConfig` (separação de responsabilidade: o picker só escolhe/cria; quem salva é a página).

**Feedback:** erros inline abaixo do botão (mesmo padrão do `IconForm`); estado `creating` desabilita o botão; o hook `useCustomIcons` do pai já cuida do reload da lista de existentes.

**Estado:** planejado · **Confiança:** alta · **Evidência:** wrappers/classes copiados de `AdminConfig.tsx` e `IconForm.tsx`; `SvgSourceInput`/`SvgPreview` usados exatamente como em `IconForm`.

### 3.5. `src/pages/admin/AdminConfig.tsx` — **alterar**

Quatro mudanças coordenadas:

1. **Novo gate de permissão**: derivar `canManageForum` de `profile?.effectivePermissions?.manageForum` (mesmo padrão de `canManageUsers` que já existe). Sem esse gate, qualquer admin com `manageUsers` mas sem `manageForum` conseguiria editar o ícone global — o que seria incoerente com a regra que vamos aplicar em `icons` (ver 3.7).

2. **Novos estados**: `globalIconSaving`, `globalIconSuccess`, `globalIconError` — **apenas** para o bloco novo, não misturar com os estados de backfill existentes.

3. **Handler `handleSaveGlobalIcon(iconId)`**: chama `setGlobalForumIconConfig(iconId, profile.uid)`. Em sucesso, dispara `globalIconSuccess` com auto-clear; em erro, popula `globalIconError`. Bloqueia a ação se `!canManageForum`.

4. **Nova `<section>`** dentro do `<div className="space-y-8 max-w-4xl">`, **depois** das duas seções de manutenção existentes (ShortIds e primaryGroupId), mantendo o wrapper `p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6`, o par `ícone + título + subtítulo` no topo (mesmo layout das outras seções) e o card interno `p-5 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)]` dentro do qual mora o `GlobalForumIconPicker`.

**Onde exatamente:** no `return`, antes do `</div>` de fechamento do componente. A ordem importa: as duas seções atuais tratam de migrações; esta é configuração de produto — semanticamente isolada, mas usando o mesmo wrapper visual.

**Dados consumidos:** `useCustomIcons()` (lista para o picker) e `useGlobalForumIcon()` (config atual para marcar qual ícone está selecionado).

**Estado:** planejado · **Confiança:** alta · **Evidência:** estrutura atual de `AdminConfig.tsx` (3 seções, cada uma com o mesmo wrapper).

### 3.6. `src/components/forum/ForumIndex.tsx` — **alterar**

A mudança é cirúrgica: **substituir o conteúdo** do `<div className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--brand-primary)] border border-[var(--border-subtle)] forum-icon-hover">` que hoje contém `<Compass className="w-5 h-5" />`.

**Cadeia de resolução (ordem obrigatória, do mais específico ao mais genérico):**

1. **Ícone específico do fórum** — hoje **não existe** campo `iconId` em `Forum`, então este nível nunca resolve. Deixar o gancho preparado (`(forum as Forum & { iconId?: string }).iconId`) documenta a extensão futura sem custo em runtime.
2. **Ícone global** — vindo de `useGlobalForumIcon().icon`. Se `icon !== null`, renderizar `<CustomIconComp className="w-5 h-5" />` usando `createCustomIconComponent(icon.svg, icon.viewBox)`.
3. **Fallback Lucide** — `<Compass className="w-5 h-5" />`. Este é o comportamento atual e cobre: configuração ausente, `iconId` nulo, falha de rede em `getCustomIcon`, ícone apagado (a auto-limpeza em 3.2 cobre o caso normal; o fallback cobre o caso de corrida).

**Onde:** dentro do `map` de `filteredForums`, no bloco "Capa com campo de cor próprio". O `<div>` externo **não muda** — apenas seu conteúdo.

**Impacto em performance:** o hook resolve um ícone único por sessão de página; o `map` de cards só recebe o componente já resolvido. Nenhum `getDoc` por card.

**Onde não tocar:** `ThreadListItem.tsx` (a lista de tópicos) — o requisito é só sobre cards de fórum. `AdminForum.tsx` / `ForumList.tsx` também ficam fora do escopo, a menos que o usuário peça explicitamente que o ícone apareça na listagem administrativa.

**Estado:** planejado · **Confiança:** alta · **Evidência:** trecho do `<Compass>` em `ForumIndex.tsx` decodificado.

### 3.7. `firestore.rules` — **alterar**

**Problema verificado:** hoje, `match /icons/{iconId}` exige `manageBadges` para `create`/`update`/`delete`. Se o admin de fóruns só tiver `manageForum`, ele **consegue escolher** um ícone existente (leitura pública), mas **não consegue criar** um novo via o picker — a aba "Criar novo SVG" quebraria em produção com `permission-denied`.

**Correção proposta:** trocar `has('manageBadges')` por `has('manageBadges') || has('manageForum')` nas três regras de escrita (`create`, `update`, `delete`). Isso **não reduz segurança** — o acesso ao painel já exige `accessPanel`, e ambos os bits são staff-level. A leitura permanece `true` (os ícones são exibidos publicamente no fórum).

**Por que não a alternativa "restringir o picker a escolher existente":** seria uma UX pior e não resolveria o caso real de um admin de fórum sem `manageBadges` precisar cadastrar um ícone novo. Além disso, exigir `manageBadges` para configurar ícone de fórum acopla duas responsabilidades que não têm relação.

**Estado:** necessário · **Confiança:** alta · **Evidência:** regra atual lida literalmente.

### 3.8. `firebase-blueprint.json` — **alterar**

Documentar a entidade de configuração. Como o documento vive em `icons`, a entrada natural é estender o schema existente com um caso especial para o id `settings`, ou — mais limpo para a ferramenta — adicionar uma chave explícita `"/icons/settings"` com schema próprio (`kind`, `iconId`, `updatedAt`, `updatedBy`). Escolha entre as duas é cosmética, sem efeito em runtime; a segunda é mais legível para quem consulta o blueprint.

**Estado:** planejado · **Confiança:** média (cosmético) · **Evidência:** formato do blueprint atual.

---

## 4. Fluxo de dados (semântica)

```
Admin → Configurações
  useCustomIcons()        → lista icons/* (menos icons/settings)
  useGlobalForumIcon()    → setting atual + icon resolvido
        ↓
GlobalForumIconPicker escolhe / cria
        ↓
handleSaveGlobalIcon → setGlobalForumIconConfig(iconId, uid)
        ↓
icons/settings  ← escrita
        ↓
onSnapshot propaga
        ↓
ForumIndex (qualquer aba aberta)
  useGlobalForumIcon() recalcula `icon`
        ↓
Card renderiza <CustomIconComp> ou <Compass/>
```

Duas propriedades importantes:

- **Propagação é realtime e cross-tab:** qualquer sessão aberta em `/forum` recebe o update via `onSnapshot` sem reload.
- **Sem fan-out de leitura por card:** um único listener + uma única leitura de `getDoc` por mudança de `iconId`.

---

## 5. Casos de borda (matriz)

| Caso | Comportamento esperado | Mecanismo |
|---|---|---|
| Nenhuma configuração salva | Fallback `<Compass>` | `setting === null` |
| Configuração salva com `iconId: null` | Fallback `<Compass>` | `icon === null` |
| Ícone apagado pela página *Admin → Ícones* | Config é auto-limpa → `<Compass>` | `deleteCustomIcon` (3.2, item 3) |
| Corrida: ícone apagado por outra aba enquanto o `getCustomIcon` está em voo | `icon === null` no fim → `<Compass>` | Fallback do hook |
| Rede off no `getCustomIcon` | Fallback `<Compass>` | `getCustomIcon` já retorna `null` |
| SVG inválido colado | `SvgSourceInput` bloqueia antes do Firestore | Sanitização já existente |
| Admin com `manageUsers` mas sem `manageForum` | Seção visível mas botão não persiste | `canManageForum` gate (3.5) |
| Admin de fórum sem `manageBadges` | Consegue criar ícone via picker | Regra atualizada (3.7) |

---

## 6. Limitações conhecidas e incertezas

- **Limitação — ícone específico por fórum:** não está implementado. A cadeia de resolução (3.6) deixa o gancho pronto. Requer, quando ativado: campo `iconId` em `types/forum.ts`, um segundo `GlobalForumIconPicker` no `ForumForm` e persistência em `lib/forums.ts`. Nada disso é entregue agora.
- **Limitação — aparência nos cards:** o ícone global aparece **apenas** em `ForumIndex`. Cabeçalho do fórum, `ThreadListItem`, breadcrumbs e menu não o consomem. Se o usuário quiser consistência nesses pontos, é uma segunda entrega.
- **Incerteza — dark/light:** os cards já usam `text-[var(--brand-primary)]`, que troca de cor por tema. Ícones SVG com `stroke="currentColor"` acompanham; ícones com cores hardcoded no SVG (que o sanitizer permite em `stop-color`, `fill`, `stroke`) podem destoar visualmente no tema oposto. **Como validar:** testar o ícone escolhido em ambos os temas. Se for um problema real, a resposta é restringir o sanitizer a `currentColor` — mas isso está fora do escopo desta entrega.
- **Incerteza — volume:** assumindo uma instalação típica de fórum com poucos ícones custom (dezenas, não milhares), `getDocs` em `useCustomIcons` e `getDoc` em `useGlobalForumIcon` são baratos. Se `icons` crescer para milhares, o `onSnapshot` do ponteiro continua O(1) (é um único doc) e `useCustomIcons` já é o gargalo existente, independente desta feature.

---

## 7. Plano de validação

1. **Unidade visual** — com Firestore vazio: abrir `/admin/configuracoes`, confirmar que a nova seção aparece abaixo das duas existentes, que a aba "existente" mostra só "Padrão (Compass)", que "Criar novo SVG" aceita upload e preview.
1. **Unidade visual** — com Firestore vazio: abrir `/admin/configuracoes`, confirmar que a nova seção aparece abaixo das duas existentes, que a aba "existente" mostra só "Padrão (Compass)", que "Criar novo SVG" aceita upload e preview.
2. **Persistência** — criar um ícone pela aba nova; verificar que `icons/{id}` existe com `name`, `svg`, `viewBox`; verificar que `icons/settings` existe com `kind`, `iconId`, `updatedBy`, `updatedAt`.
3. **Realtime** — manter `/forum` aberto em outra aba; salvar a escolha em `/admin/configuracoes`; confirmar que todos os cards trocam de ícone **sem reload**.
4. **Fallback** — remover a escolha no picker; confirmar que todos os cards voltam a `<Compass>`.
5. **Auto-limpeza** — apagar o ícone escolhido em *Admin → Ícones*; confirmar que `icons/settings.iconId` virou `null` e os cards voltaram a `<Compass>`.
6. **Permissões** — logar com um usuário que tem `accessPanel` e `manageForum` mas **não** `manageBadges`; confirmar que ele consegue criar e salvar ícone (a regra 3.7 é o que viabiliza isso).
7. **Negativo** — logar com `manageUsers` mas sem `manageForum`; tentar salvar; confirmar erro inline e que o Firestore não recebeu escrita.
8. **Tema** — repetir o teste 3 em dark e light.

**Critério de rejeição:** qualquer um dos passos 2, 3, 4, 5, 6 ou 7 falhando em pelo menos um navegador significa que a implementação não atende — não apenas "não polida".