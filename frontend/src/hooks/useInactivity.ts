import { useEffect, useRef } from 'react';

const useInactivity = (logoutCallback: () => void, timeoutMs: number = 30 * 60 * 1000): void => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      console.log('[Inactivity Monitor] 30 minutes of inactivity reached. Logging out...');
      logoutCallback();
    }, timeoutMs);
  };

  useEffect(() => {
    // List of events that indicate user activity
    const events: string[] = [
      'mousemove',
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Initialize timer
    resetTimer();

    // Attach event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Clean up
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoutCallback, timeoutMs]);
};

export default useInactivity;
