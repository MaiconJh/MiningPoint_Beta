# Add badge counter to profile About tab

> Spec gerada automaticamente a partir da issue #6.

## Resumo

The profile's About tab currently only displays the user's bio. To provide a clearer overview of achievements, we will add a badge counter showing the total number of badges the user has earned. This aligns with the existing UI pattern used in ProfileSidebar, where badge counts are displayed alongside icons.

The implementation will query the userCollectibles collection filtered by kind 'badge' and the user's uid, then render the count in Portuguese as 'X insígnias' beneath the bio. A new reusable component, BadgeCount, will be created to encapsulate the query logic and presentation, and it will be integrated into AboutTab.

By reusing the styling from ProfileSidebar, we maintain visual consistency across the application. The change is minimal and does not affect existing functionality, improving user engagement by highlighting achievements.

## Abordagem tecnica

1. Create a new hook useBadgeCountin src/hooks/that returns the number of badge collectibles for the current user. The hook will use Firebase Firestore collection('userCollectibles')with a query where userIdequals the current user's uid and kindequals 'badge', then count the documents.
2. Create a presentational component BadgeCountin src/components/that receives the count as a prop and renders it with the same classes as the badge counter in ProfileSidebar.
3. Import and render BadgeCountin src/profile/tabs/AboutTab.tsxbelow the bio element.
4. Ensure the component is wrapped in a fragment or div with appropriate ARIA label for accessibility.
5. Update Firestore security rules if necessary to allow the read (already covered by existing rules).

## Areas afetadas

- src/hooks/useBadgeCount.ts
- src/components/BadgeCount.tsx
- src/profile/tabs/AboutTab.tsx
- firestore.rules

## Criterios de aceite

- [ ] The About tab displays the total badge count directly below the user's bio.
- [ ] The count is rendered in Portuguese as "X insígnias".
- [ ] The visual style matches the badge counter in ProfileSidebar.
- [ ] The component correctly reads from userCollectibles and updates in real-time.
- [ ] The UI remains accessible (aria-label present).

## Riscos

- Potential performance impact if the query is not indexed; ensure composite index exists.
- Security rules must allow read of userCollectibles for the current user.
- If the user has no badges, the counter should display "0 insígnias" gracefully.

## Padroes aplicaveis

- Language
- Styling
- Content
- Firebase
- Firestore schema

## Metadados

| Campo | Valor |
| --- | --- |
| Complexidade | low |
| Issue original | #6 |