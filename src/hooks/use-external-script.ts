import { useEffect } from 'react';

export function useExternalScriptOnce(src: string, id: string) {
  useEffect(() => {
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }, [src, id]);
}

