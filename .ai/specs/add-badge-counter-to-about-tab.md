# Add badge counter to About tab

> Spec gerada automaticamente a partir da issue #9.

## Resumo

The About tab currently only shows the user's bio. This change adds a line that displays the total number of badges the user has earned, providing a quick overview of their achievements and improving profile completeness. The counter will be fetched from the userCollectibles collection and rendered below the bio using the same visual style as the ProfileSidebar.

## Abordagem tecnica

Modify AboutTab.tsx to fetch the count of documents in userCollectibles where kind is 'badge' and userId matches the profile. Use the existing useBadges hook or a direct Firestore query. Add a state variable for the count and a useEffect to load it. Render a paragraph element with the text "X insígnias" below the bio, applying the same Tailwind classes used in ProfileSidebar for consistency. Ensure the component handles missing data gracefully.

## Areas afetadas

- src/components/profile/tabs/AboutTab.tsx
- src/hooks/useBadges.ts
- src/lib/badges.ts

## Criterios de aceite

- [ ] The About tab displays the total number of badges earned by the user.
- [ ] The count is rendered as "X insígnias" immediately below the user's bio.
- [ ] The visual style matches the badge counter in ProfileSidebar.

## Riscos

- Querying userCollectibles for every profile view may cause performance issues if not indexed.
- Security rules must permit reading userCollectibles for the profile being viewed.

## Padroes aplicaveis

- Content
- Styling
- Firebase

## Metadados

| Campo | Valor |
| --- | --- |
| Complexidade | low |
| Issue original | #9 |