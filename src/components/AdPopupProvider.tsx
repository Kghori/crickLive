import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type ShowAdOptions = {
  onCloseNavigateTo?: string;
};

type AdPopupContextValue = {
  showAd: (options?: ShowAdOptions) => void;
};

const AdPopupContext = createContext<AdPopupContextValue | null>(null);

const parseAdLinks = (): string[] => {
  const raw = import.meta.env.VITE_AD_LINKS;
  if (typeof raw !== 'string' || raw.trim().length === 0) return [];
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

export const AdPopupProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [navigateTo, setNavigateTo] = useState<string | null>(null);

  const showAd = useCallback((options?: ShowAdOptions) => {
    const links = parseAdLinks();
    if (links.length === 0) {
      if (options?.onCloseNavigateTo) {
        window.location.assign(options.onCloseNavigateTo);
      }
      return;
    }
    const randomAd = links[Math.floor(Math.random() * links.length)];
    setAdUrl(randomAd);
    setNavigateTo(options?.onCloseNavigateTo || null);
    setOpen(true);
  }, []);

  const value = useMemo<AdPopupContextValue>(() => ({ showAd }), [showAd]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      const target = navigateTo;
      setNavigateTo(null);
      setAdUrl(null);
      if (target) window.location.assign(target);
    }
  };

  return (
    <AdPopupContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <DialogTitle className="text-sm">Advertisement</DialogTitle>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              Close
            </button>
          </div>
          <div className="h-[70vh] w-full bg-black">
            {adUrl ? (
              <iframe
                title="Ad"
                src={adUrl}
                className="h-full w-full"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </AdPopupContext.Provider>
  );
};

export const useAdPopup = () => {
  const ctx = useContext(AdPopupContext);
  if (!ctx) throw new Error('useAdPopup must be used within AdPopupProvider');
  return ctx;
};

