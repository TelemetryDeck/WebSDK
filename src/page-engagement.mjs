import { buildEvent, sendBeacon } from './send.mjs';

const MILESTONES = [100, 75, 50, 25];

// Percentage of the page that has been in view so far, 0–100. A page that fits
// the viewport counts as 100.
function measureScrollDepth() {
  const { documentElement, body } = document;
  const scrollHeight = Math.max(documentElement.scrollHeight, body ? body.scrollHeight : 0);

  if (!scrollHeight) {
    return 100;
  }

  const bottom = window.scrollY + window.innerHeight;

  return Math.min(100, Math.max(0, Math.round((bottom / scrollHeight) * 100)));
}

function milestone(depth) {
  return String(MILESTONES.find((value) => depth >= value) ?? 0);
}

export function trackPageEngagement() {
  let maxDepth = 0;
  let engagedMilliseconds = 0;
  let visibleSince = document.visibilityState === 'visible' ? performance.now() : undefined;
  let frame;
  let sent = false;

  const update = () => {
    frame = undefined;
    maxDepth = Math.max(maxDepth, measureScrollDepth());
  };

  // Coalesce scroll events so layout is read at most once per frame.
  const scheduleUpdate = () => {
    if (frame === undefined) {
      frame = requestAnimationFrame(update);
    }
  };

  const pause = () => {
    if (visibleSince !== undefined) {
      engagedMilliseconds += performance.now() - visibleSince;
      visibleSince = undefined;
    }
  };

  const resume = () => {
    if (visibleSince === undefined) {
      visibleSince = performance.now();
    }
  };

  // Sent exactly once, the first time the page is hidden or unloaded.
  const leave = () => {
    if (sent) {
      return;
    }

    sent = true;
    pause();
    update();

    removeEventListener('scroll', scheduleUpdate);
    removeEventListener('resize', scheduleUpdate);

    sendBeacon(
      buildEvent({
        type: 'TelemetryDeck.Web.pageLeave',
        'TelemetryDeck.PageEngagement.scrollDepth': maxDepth,
        'TelemetryDeck.PageEngagement.scrollDepthMilestone': milestone(maxDepth),
        'TelemetryDeck.PageEngagement.engagedSeconds': Math.round(engagedMilliseconds / 1000),
      })
    );
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      leave();
    } else {
      resume();
    }
  };

  addEventListener('scroll', scheduleUpdate, { passive: true });
  addEventListener('resize', scheduleUpdate, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  addEventListener('pagehide', leave);
}
