import { useEffect, useRef } from 'react';

const useInactivity = (logoutCallback, timeoutMs = 30 * 60 * 1000) => {
  const timeoutRef = useRef(null);

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
    const events = [
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
  }, [logoutCallback, timeoutMs]);
};

export default useInactivity;
