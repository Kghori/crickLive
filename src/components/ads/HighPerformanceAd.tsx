import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    atOptions?: unknown;
  }
}

type HighPerformanceAdProps = {
  className?: string;
};

export default function HighPerformanceAd({ className }: HighPerformanceAdProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
  
    const MOBILE = {
      key: '564586386b38090073cac69b01d41aa7',
      width: 300,
      height: 250,
      invoke: 'https://www.highperformanceformat.com/564586386b38090073cac69b01d41aa7/invoke.js',
    };
  
    const DESKTOP = {
      key: '2640c4b0da116dd6da478923dbfa8cb5',
      width: 728,
      height: 90,
      invoke: 'https://www.highperformanceformat.com/2640c4b0da116dd6da478923dbfa8cb5/invoke.js',
    };
  
    const renderAd = () => {
      const isMobile = window.innerWidth < 768;
      const variant = isMobile ? MOBILE : DESKTOP;
  
      if (host.dataset.variant === variant.key) return;
  
      host.dataset.variant = variant.key;
      host.innerHTML = '';
  
      (window as Window).atOptions = {
        key: variant.key,
        format: 'iframe',
        height: variant.height,
        width: variant.width,
        params: {},
      };
  
      const script = document.createElement('script');
      script.src = variant.invoke;
      script.async = true;
      host.appendChild(script);
    };
  
    renderAd();
  
    // Optional: re-render on resize
    window.addEventListener('resize', renderAd);
  
    return () => {
      window.removeEventListener('resize', renderAd);
    };
  }, []);
  

  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-[728px] overflow-hidden bg-transparent">
        <div ref={hostRef} className="w-full" />
      </div>
    </div>
  );
}

