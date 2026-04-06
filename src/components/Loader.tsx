import { memo } from 'react';
import { Loader2 } from 'lucide-react';

const Loader = memo(({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
));

Loader.displayName = 'Loader';
export default Loader;
