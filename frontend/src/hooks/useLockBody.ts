import { useEffect, useRef } from 'react';

/** Locks page scroll on iOS/Android while a drawer/menu is open. */
export function useLockBody(locked: boolean) {
  const scrollY = useRef(0);

  useEffect(() => {
    if (!locked) return;
    scrollY.current = window.scrollY;
    const { body, documentElement } = document;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';
      documentElement.style.overflow = '';
      window.scrollTo(0, scrollY.current);
    };
  }, [locked]);
}
