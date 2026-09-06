import { afterEach, describe, expect, it, vi } from 'vitest';

let requestExpandedModeMock: ReturnType<typeof vi.fn>;
let navigateToMock: ReturnType<typeof vi.fn>;

vi.mock('@devvit/web/client', () => {
  requestExpandedModeMock = vi.fn();
  navigateToMock = vi.fn();

  return {
    // used in the footer
    navigateTo: navigateToMock,
    // used in the greeting
    context: {
      username: 'test-user',
    },
    // used by the "Tap to Start" button
    requestExpandedMode: requestExpandedModeMock,
  };
});

vi.mock('./trpc', () => {
  return {
    trpc: {
      destinyvox: {
        getSavedProfile: {
          query: vi.fn().mockResolvedValue({ exists: false, charts: [], username: 'test-user', isVip: false }),
        },
      },
    },
  };
});

afterEach(() => {
  requestExpandedModeMock?.mockReset();
  navigateToMock?.mockReset();
});

describe('Splash', () => {
  it('renders DestinyVox brand correctly', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    // `src/splash.tsx` renders immediately on import (createRoot(...).render(...))
    await import('./splash');

    // Let React commit the initial render.
    await new Promise((r) => setTimeout(r, 50));

    expect(document.body.textContent).toContain('DESTINYVOX');
  });
});
