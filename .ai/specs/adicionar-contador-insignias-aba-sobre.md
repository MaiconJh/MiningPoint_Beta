# Adicionar contador de insígnias na aba Sobre do perfil

> Spec gerada automaticamente a partir da issue #3.

## Resumo

A aba Sobre (/perfil e /perfil/:id) atualmente exibe apenas a bio do usuário. Esta feature adiciona a contagem total de insígnias (badges) que o usuário possui, lida da coleção userCollectibles com kind 'badge', renderizada no formato "X insígnias" abaixo da bio. O estilo visual será reutilizado do ProfileSidebar, que já exibe essa informação com a formatação adequada.

## Abordagem tecnica

1. Verificar se já existe hook/função para contar badges do usuário em src/hooks/useBadges.tsou src/lib/badges.ts/src/lib/collectibles.ts. Se não existir, criar função getUserBadgeCount(userId)em src/lib/badges.tsque consulta userCollectiblescom kind='badge'.
2. Criar hook useUserBadgeCount(userId)em src/hooks/useBadges.tsque usa a função acima com listener em tempo real.
3. Modificar src/components/profile/tabs/AboutTab.tsxpara consumir o hook e renderizar a contagem abaixo da bio.
4. Reutilizar classes CSS/Tailwind do ProfileSidebarpara o contador (provavelmente algo como text-text-muted text-smou similar).
5. Garantir que funcione tanto no próprio perfil (/perfil) quanto no perfil público (/perfil/:id).

## Areas afetadas

- src/components/profile/tabs/AboutTab.tsx
- src/hooks/useBadges.ts
- src/lib/badges.ts
- src/lib/collectibles.ts

## Criterios de aceite

- [ ] A aba Sobre exibe a contagem total de insígnias no formato "X insígnias" abaixo da bio
- [ ] A contagem é atualizada em tempo real quando insígnias são adicionadas/removidas
- [ ] O estilo visual é consistente com o contador do ProfileSidebar
- [ ] Funciona tanto no próprio perfil (/perfil) quanto em perfis públicos (/perfil/:id)
- [ ] Exibe "0 insígnias" quando o usuário não possui nenhuma

## Riscos

- Se não existir hook/função para contar badges, será necessário criar consulta Firestore em userCollectiblescom filtro por userId e kind='badge', o que pode exigir índice composto
- O ProfileSidebar pode usar formatação específica (pluralização, abreviação para números grandes) que precisa ser replicada exatamente

## Padroes aplicaveis

- language - Code in English, interface in Portuguese
- content - A page shows real content or shows nothing
- styling - Tailwind utility classes, reuse existing visual patterns

## Metadados

| Campo | Valor |
| --- | --- |
| Complexidade | low |
| Issue original | #3 |