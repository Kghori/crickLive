import { memo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = memo(({ message = 'Something went wrong', onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20">
    <AlertTriangle className="h-10 w-10 text-destructive" />
    <p className="text-sm text-muted-foreground">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    )}
  </div>
));

ErrorState.displayName = 'ErrorState';
export default ErrorState;
