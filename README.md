# DestinyVox (dgapp) — Pythagorean Numerology & Cosmic Oracle

> **Interactive Reddit Community Application built on the Devvit Web Platform**

---

## 🌟 App Overview

### What is DestinyVox?
**DestinyVox** is an immersive, interactive personal insights and numerology application designed specifically for Reddit communities. Grounded in traditional Pythagorean numerology and archetypal analysis, the app calculates a user's unique cosmic blueprint using their birth name and birth date. 

Beyond static numbers, DestinyVox uses advanced AI to translate mathematical vibrations into deep psychological portraits, highlighting personal strengths, unconscious blind spots (shadows), and time-based cyclical forecasts (Personal Year, Month, and Day). Members can also explore **Cosmic Synastry** (compatibility) with fellow Redditors, ask questions to an interactive **AI Oracle**, manage multiple profiles (for family and friends), and share beautifully formatted dossiers directly into the subreddit discussion.

### Who is this App for?
* **Subreddit Members & Communities:** Ideal for Reddit users interested in personality analysis, self-reflection, mindfulness, astrology/numerology, and fun social interaction.
* **Community Moderators:** Perfect for moderators looking to boost subreddit engagement with a high-retention, interactive custom post experience that sparks conversation in comment threads.

### Critical Operational Notes
* **Platform Native:** DestinyVox runs entirely within Reddit's secure Devvit environment using modern Web Views (React 19, Tailwind CSS, and Vite).
* **Two View Modes:**
  * **Inline Feed View (Splash):** A lightweight, fast-loading card displayed directly in the Reddit feed where users enter their basic details or resume a saved profile.
  * **Expanded View:** An immersive full-screen experience containing deep dossier breakdowns, charts, the interactive oracle, and synastry tools.
* **Privacy & Data Storage:** User profiles are stored securely in Reddit's private Redis database tied to the user's Reddit account context. Sensitive data is never sold or shared with third parties.
* **Permissions Required:** 
  * `SUBMIT_POST`: Allows moderators and app triggers to generate interactive posts in the subreddit.
  * `SUBMIT_COMMENT`: Allows users to post their numerological dossier into the comment section and allows optional bot welcome replies.
  * `SUBSCRIBE_TO_SUBREDDIT`: Allows users to easily join the host community directly from within the app.
* **Trilingual Support:** The app natively supports **English (default)**, **Portuguese (Português)**, and **Spanish (Español)**, with persistent language selection and Dark/Light visual modes.

---

## ✨ Key Features

1. **Pythagorean Core Calculation:** Instant calculation of the five primary numerological pillars:
   * **Life Path Number:** Core existential purpose derived from the birth date.
   * **Expression / Destiny Number:** Inherent talents and vocational tools derived from the birth name.
   * **Soul Urge Number:** Deepest inner desires and subconscious motivations.
   * **Personality Number:** Social persona and how others perceive you.
   * **Personal Year, Month & Day:** Real-time vibrational temporal cycles.
2. **Deep Psychological Interpretation:** High-frequency virtues (hidden talents) paired with shadow patterns (ego defenses, karmic blind spots, and growth advice).
3. **Interactive AI Oracle:** A contextual Q&A chat where users can ask life, career, or relationship questions and receive guidance aligned with their numerological profile.
4. **Cosmic Synastry (Redditor Compatibility):** Input any Reddit username (`u/username`) to calculate vibrational compatibility, synergy scores (0–100%), relational strengths, and mutual lessons.
5. **Multi-Chart Manager:** Save up to 20 different charts (for friends, family, or partners), switch between them seamlessly, or delete old ones at any time.
6. **Community Sharing:** Post your summarized dossier directly to the Reddit post's comment thread with a single click, or copy a markdown card to your clipboard.

---

## 📖 How to Interact with the App (User Guide)

### 1. Launching from the Reddit Feed (Inline View)
1. Find any **DestinyVox** post in the subreddit feed.
2. On the welcome card:
   * Enter your **Full Name at Birth** (e.g., *Ada Lovelace*).
   * Enter your **Date of Birth** in the `MM/DD/YYYY` format (e.g., `12/10/1815`).
   * Select your preferred language (`EN`, `PT`, or `ES`) at the top right.
3. Click **CALCULATE CHART ⟶**.
4. If you have previously calculated a chart, DestinyVox will remember you! Simply click **OPEN MY CHART ⟶** to pick up where you left off.

### 2. Exploring the Cosmic Dossier (Expanded View)
Once the chart is generated, the app opens in the full expanded view:
* **Overview Tab:** Tap on any of the 5 core pillars (*Life Path*, *Expression*, *Soul Urge*, *Personality*, *Personal Year*) to view its title, frequency, and detailed archetypal breakdown.
* **Talents & Shadows Tab:** Read your high-frequency luminous gifts and examine unconscious blind spots that may cause friction in your daily life.
* **Year & Cycles Tab:** Discover strategic forecasts for your current Personal Year, current Personal Month, and the energy governing your day.

### 3. Consulting the AI Oracle
1. Tap the floating **Oracle** chat bubble in the bottom-right corner.
2. Type a specific question about your career, personal decisions, relationships, or creative paths.
3. Tap **⟶**. The Oracle will synthesize your specific numerological numbers and deliver thoughtful, reflective counsel.

### 4. Testing Cosmic Synastry with Another Redditor
1. Navigate to the **Synastry** procedure.
2. Enter the Reddit username of a friend or community member (e.g., `u/spez` or `username`).
3. Calculate Synastry:
   * If the user has already calculated their chart on DestinyVox, you will receive an immediate compatibility score, relational analysis, and advice for the duo.
   * If the user hasn't calculated their chart yet, you can invite them via comment to calculate their profile on the post.

### 5. Managing Saved Charts
* Click the **Saved Charts** dropdown in the header to switch between different profiles.
* To add another profile (e.g., for a partner or sibling), click **+ New Chart**, input their details, and save.
* To remove a chart, tap the delete icon next to the profile and confirm deletion.

### 6. Sharing Your Results
* Navigate to the **Share** tab.
* Click **Post to Reddit Comments** to automatically publish your markdown dossier to the post's comment section.
* Click **Copy Summary** to paste your results into Reddit chats, DMs, or other communities.

---

## 🛡️ Moderator Guide (Configuration & Operations)

DestinyVox is designed to be plug-and-play for subreddit moderators:

### Automated Setup
* **On App Install (`onAppInstall`):** As soon as a moderator installs DestinyVox onto their subreddit, the app automatically creates an initial **DestinyVox Calculator** post so community members can begin using it immediately.

### Moderator Menu Actions
Moderators can manage the app directly from the Subreddit action menu:
1. **Create a New Post:**
   * Open subreddit options / moderator menu on Reddit.
   * Select **"Create a new post"** under DestinyVox.
   * A fresh interactive DestinyVox post will be submitted to the subreddit, and you will be redirected to it.
2. **Delete Bot Comments ("Apagar todos comentários do bot"):**
   * If you wish to clean up comments left by the app bot user, select this option in the moderator menu.
   * The app will batch-delete recent automated bot comments and notify you with a confirmation toast.

### Automated Comment Replies (`onCommentCreate`)
* When enabled, the app can act as a friendly and witty community assistant, providing lighthearted responses to comments in the subreddit.
* Auto-replies can be configured or toggled via internal settings stored in Redis (`bot_auto_reply_enabled`).

---

## ⚙️ Technical Architecture & Stack

* **Frontend:** React 19, Tailwind CSS 4, Vite
* **Backend:** Devvit Web Server (Node.js 22 runtime), Hono, tRPC v11
* **Data Store:** Devvit Redis for persistent user profile storage, chart indexing, and configuration flags
* **AI Engine:** Google Gemini for contextual psychological interpretations and Oracle dialogue
* **Type Safety & Testing:** TypeScript 5+ and Vitest

---

## 🚀 Deployment & Development Guide

If you are reviewing, building, or deploying this application from source:

### Prerequisites
* **Node.js:** `>= 22.0.0`
* **Devvit CLI:** Installed and authenticated with Reddit (`npm install -g devvit` or via `npx devvit`)

### Local Commands
```bash
# 1. Install dependencies
npm install

# 2. Log in to Reddit Developer Platform
npm run login

# 3. Check TypeScript types
npm run test:types

# 4. Run unit test suite
npm run test:unit

# 5. Build client and server bundles
npm run build

# 6. Start playtest environment on your test subreddit
npm run dev

# 7. Upload a new version to Reddit
npm run deploy

# 8. Publish the app for review / launch
npm run launch
```

---

## 🔒 Safety, Privacy & Guidelines

* **Content Moderation:** All AI prompts and responses adhere strictly to Reddit's Content Policy and Devvit Developer Rules. No harmful, offensive, or personally identifying data is stored or exposed.
* **Data Portability & Deletion:** Users can clear or delete their saved profiles and charts at any time directly through the user interface.
* **Rate Limits:** External AI calls are bounded with token limits and fallback responses to prevent abuse and ensure high uptime.

---

## 📬 Support & Contact

For inquiries, feature requests, or support, please open an issue in the repository or reach out via Reddit to the app maintainers.
