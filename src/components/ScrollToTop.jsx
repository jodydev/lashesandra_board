import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }

    const scrollingEl = document.scrollingElement;
    if (scrollingEl) {
      scrollingEl.scrollTop = 0;
      scrollingEl.scrollLeft = 0;
    }
  }, [location.pathname]);

  return null;
}
