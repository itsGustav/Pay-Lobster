import { Button } from './Button';
import { Card } from './Card';

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="text-center py-8 px-6 border-red-900/50 bg-red-950/20">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold mb-2 text-red-400">Something went wrong</h3>
      <p className="text-gray-400 text-sm mb-4">
        {error.message || 'Failed to load data'}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </Card>
  );
}
