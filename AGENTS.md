You are writing a Devvit web application that will be executed on Reddit.com.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Vite
- **Backend**: Node.js v22 serverless environment (Devvit), Hono, tRPC
- **Communication**: tRPC v11 for end-to-end type safety
- **Testing**: Vitest, ESLint, TypeScript Build (`tsc --build`)

## Layout & Architecture

The codebase is organized in clean, decoupled modules across backend, frontend, and shared domains:

### 1. `/src/server` (Backend Code)
Runs in a secure, serverless Devvit environment. Access `redis`, `reddit`, and `context` via `@devvit/web/server`.

- `index.ts`: Main server entry point (Hono web framework).
- `context.ts`: Server context definition for tRPC.
- `trpc.ts`: Root tRPC router composition aggregating modular sub-routers (`AppRouter`).
- `destinyVoxEngine.ts`: Facade re-exporting the core engine domain.

#### Modular Engine (`/src/server/engine/`):
- `types.ts`: Domain models (`CosmicReadingResult`, `SynastryResult`, Gemini payloads).
- `gemini.ts`: Unified HTTP client for Google Gemini 2.5 Flash / 3.1 Flash-Lite.
- `reading.ts`: Pythagorean calculations, Gemini interpretations, and Redis persistence.
- `oracle.ts`: Interactive Oracle consultation engine.
- `synastry.ts`: Cosmic relationship and karmic compatibility calculator.
- `notifications.ts`: Telegram webhook dispatcher for real-time chart generation alerts.

#### Modular tRPC Routers (`/src/server/trpc/`):
- `init.ts`: Base tRPC initialization (`router`, `publicProcedure`).
- `routers/profileRouter.ts`: Saved profiles, chart generation, Redis caching, chart deletion.
- `routers/oracleRouter.ts`: Oracle interactive Q&A procedure.
- `routers/synastryRouter.ts`: User-to-user synastry calculation.
- `routers/socialRouter.ts`: Reddit comment submission, subreddit subscription, user token encryption.
- `routers/stripeRouter.ts`: Stripe VIP checkout session creation with AES-256-GCM token protection.

---

### 2. `/src/client` (Frontend Code)
Executed inside of an iframe on reddit.com. Entry points are registered in `devvit.json`.

- `splash.html` / `splash.tsx`: Feed view (inline). Lightweight initial screen for name/birth entry or loading existing charts (~310 lines).
- `game.html` / `game.tsx`: Expanded view. Main application orchestrator for archetypes, polarity, cycles, dossier, and oracle (~280 lines).
- `trpc.ts`: Typed tRPC client instance.
- `i18n.ts` & `splashI18n.ts`: Multilingual dictionaries (EN, PT, ES).

#### Modular UI Components (`/src/client/components/`):
- `Header.tsx`: Editorial top bar, theme toggle, saved charts dropdown, and quick links.
- `PillarMatrix.tsx`: Co—Star style 5-pillar numerology matrix (Life Path, Expression, Soul Urge, Personality, Personal Year).
- `TabArchetype.tsx`: Deep archetype analysis with dynamic dictum and operative forces.
- `TabPolarity.tsx`: Karmic polarity tab (High Gifts vs. Shadow Challenges).
- `TabCycles.tsx`: Time cycles (Personal Day, Personal Month, Personal Year).
- `TabDossier.tsx`: Minimalist receipt/dossier with one-click Reddit comment sharing and links.
- `OracleChat.tsx`: Floating bottom-right bubble and fullscreen expandable modal responsive to mobile virtual keyboards (`visualViewport`).
- `Modals.tsx`: In-app delete confirmation modal (`DeleteChartModal`) and new chart modal (`NewChartModal`).
- `PortalModal.tsx`: Username linking modal for external access to DestinyVox 360°.
- `SavedProfilesList.tsx`: Saved charts list and multi-chart switcher.
- `BirthChartForm.tsx`: Clean name and birthdate input form with masks and validation.
- `renderParagraphs.tsx`: Typography helper for balanced, readable AI text chunks.

#### Custom Hooks (`/src/client/hooks/`):
- `useTheme.ts`: Dark/light mode state, `localStorage` caching, and real-time synchronization with Reddit theme.
- `useOracle.ts`: Oracle dialog state, question handling, smooth auto-scroll, and mobile keyboard offset.
- `useCharts.ts`: Saved charts selection, in-app deletion, and date format masking.
- `useSharing.ts`: Dossier markdown formatting, Reddit comment posting, and clipboard copying.
- `useProfileInit.ts`: Initial state hydration, Redis retrieval, and chart calculation management.

---

### 3. `/src/shared` (Shared Code)
Shared between client and server:
- `numerology.ts`: Core Pythagorean mathematical algorithms, master numbers, and archetype metadata.
- `transformer.ts`: Superjson serialization transformer for tRPC.

---

## Data Fetching (tRPC)

This project uses tRPC for end-to-end type safety between client and server:
1. **Define Procedure**: Add the procedure to the appropriate router in `src/server/trpc/routers/`.
2. **Mount**: Include the procedure in `appRouter` inside `src/server/trpc.ts`.
3. **Call in Client**: Use `trpc.destinyvox.<procedureName>.query()` or `.mutate()`.

---

## Frontend Rules & Platform Limitations

- **Navigation**: Instead of `window.location` or `window.assign`, use `navigateTo` from `@devvit/web/client`.
- **View Expansion**: Use `requestExpandedMode(ev.nativeEvent, 'game')` to transition from `splash` to `game`.
- **Modals & Dialogs**: Avoid `window.alert` or `window.confirm`. Use in-app React modals (e.g., `DeleteChartModal`).
- **File Downloads**: Use clipboard API with user feedback instead.
- **Mobile Viewport**: Use `window.visualViewport` to adapt overlays and avoid UI occlusion when virtual keyboards open.

---

## Quality & Commands

- `npm test`: Runs type check (`tsc --build`), linter (`eslint`), unit tests (`vitest run`), and production build (`vite build`).
- `npm run test:types`: Runs TypeScript build check.
- `npm run lint`: Runs ESLint across `src/**/*.{ts,tsx}`.
- `npm run test:unit`: Runs Vitest test suite.
- `npm run build`: Compiles and bundles client assets via Vite.

---

## Code Style

- Prefer type aliases over interfaces when writing TypeScript.
- Prefer named exports over default exports.
- Never cast TypeScript types unsafely.
- Keep entry points (`game.tsx`, `splash.tsx`) concise; delegate logic to custom hooks and components.
