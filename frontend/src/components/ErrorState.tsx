interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/60 bg-error/10 px-5 py-4" role="alert">
      <span className="text-text">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-10 cursor-pointer rounded-lg border border-border bg-transparent px-4 font-sans text-sm font-medium text-text hover:border-muted"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
