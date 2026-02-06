# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Fantasy Golf web application** built with Astro as a static site generator. The application displays fantasy golf data including teams, tournaments, players, and leaderboards, all sourced from a GraphQL backend.

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server (localhost:4321)
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Architecture

### Data Layer

All data is fetched from a GraphQL API at build time:

- **Central GraphQL client**: [src/lib/graphql.ts](src/lib/graphql.ts) - Single `fetchGraphQL()` function used across all pages
- **GraphQL endpoint**: Configured via `PUBLIC_GRAPHQL_ENDPOINT` environment variable (defaults to `http://localhost:3000/graphql`)
- **Static generation**: All GraphQL queries execute during build; no runtime data fetching
- **Dynamic routes**: Tournament detail pages use `getStaticPaths()` to pre-generate routes from GraphQL data

### Pages & Routes

- [/](src/pages/index.astro) - Redirects to `/leaderboard`
- [/leaderboard](src/pages/leaderboard.astro) - Teams standings with owner info and player rosters
- [/tournaments](src/pages/tournaments.astro) - List of all tournaments with status chips
- [/tournaments/[id]](src/pages/tournaments/[id].astro) - Tournament detail page with player results
- [/players](src/pages/players.astro) - Searchable player roster with stats

### Key Patterns

**GraphQL queries in pages**: Each page defines its GraphQL query as a string constant in the frontmatter:

```typescript
const GET_DATA = `query { ... }`;
const data = await fetchGraphQL<ResponseType>(GET_DATA, variables);
```

**Error handling**: Pages implement try/catch blocks and display error states in the UI rather than throwing

**Client-side search**: Leaderboard and players pages use vanilla JavaScript to filter rows client-side via URL query params (`?q=search-term`)

**View transitions**: Astro's built-in view transitions are enabled in [BaseLayout.astro](src/layouts/BaseLayout.astro) for smooth page navigation

**PlayerAvatar component**: Displays player headshots using PGA Tour player IDs (pgaId) - images are fetched from external source via [astro-preload](https://www.npmjs.com/package/astro-preload) integration

### Styling

- CSS custom properties defined in [BaseLayout.astro](src/layouts/BaseLayout.astro) for consistent theming
- Scoped styles per page/component
- Mobile-first responsive design with breakpoints at 768px and 1024px
- Light theme only (no dark mode)

### Components

- [BaseLayout](src/layouts/BaseLayout.astro) - Main layout wrapper with navigation and view transitions
- [Navigation](src/components/Navigation.astro) - Top navigation bar
- [PlayerAvatar](src/components/PlayerAvatar.astro) - Player headshot component using PGA Tour images
- [PromoBanner](src/components/PromoBanner.astro) - Promotional banner component (currently unused)

## Environment Variables

Required environment variables (see [src/env.d.ts](src/env.d.ts)):

- `PUBLIC_GRAPHQL_ENDPOINT` - GraphQL API endpoint URL

## Important Considerations

- **Build-time only data**: All data must be available at build time. Runtime data fetching is not configured.
- **Static output**: Configured as `output: 'static'` in [astro.config.mjs](astro.config.mjs)
- **TypeScript interfaces**: Each page defines its own GraphQL response types inline; there is no shared type library
- **No state management**: Pure static site with client-side search; no complex state or reactivity needed
