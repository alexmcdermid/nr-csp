import { useEffect, useRef } from 'react';

const CHANNEL_NAME = 'csp-auth-idle';
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;
/** Local activity events are collapsed to at most one reset per this window. */
const ACTIVITY_THROTTLE_MS = 5000;

type IdleMessage = { type: 'activity' } | { type: 'logout' };

interface UseIdleTimeoutOptions {
  /** Only tracks activity / schedules the timeout while true. */
  enabled: boolean;
  /** Milliseconds of inactivity before onTimeout fires. */
  timeoutMs: number;
  /** Called when this tab (or another tab, via broadcast) goes idle. */
  onTimeout: () => void;
  onActivity?: () => void;
}

/**
 * Signs the user out after a period of inactivity, independent of any auth
 * token TTL. Activity in any browser tab resets the timer in every tab, and
 * going idle in any tab logs all tabs out together.
 */
export function useIdleTimeout({ enabled, timeoutMs, onTimeout, onActivity }: UseIdleTimeoutOptions): void {
  const activityRef = useRef(onActivity);
  activityRef.current = onActivity;
  useEffect(() => {
    if (!enabled) return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    let timeoutId: ReturnType<typeof setTimeout>;
    let lastActivityBroadcast = 0;

    function resetTimer() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        channel.postMessage({ type: 'logout' } satisfies IdleMessage);
        onTimeout();
      }, timeoutMs);
    }

    function handleLocalActivity() {
      resetTimer();
      const now = Date.now();
      if (now - lastActivityBroadcast < ACTIVITY_THROTTLE_MS) return;
      lastActivityBroadcast = now;
      activityRef.current?.();
      channel.postMessage({ type: 'activity' } satisfies IdleMessage);
    }

    function handleChannelMessage({ data }: MessageEvent<IdleMessage>) {
      if (data.type === 'activity') {
        resetTimer();
      } else if (data.type === 'logout') {
        onTimeout();
      }
    }

    channel.addEventListener('message', handleChannelMessage);
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleLocalActivity, { passive: true });
    }
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      channel.removeEventListener('message', handleChannelMessage);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleLocalActivity);
      }
      channel.close();
    };
  }, [enabled, timeoutMs, onTimeout]);
}
