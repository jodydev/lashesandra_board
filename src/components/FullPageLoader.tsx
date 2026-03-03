import { useAppColors } from '../hooks/useAppColors';

const textSecondaryColor = '#7A7A7A';

/** Spinner + testo identico a HomePage, per uso in full-page o inline */
export function LoaderContent({ message = 'Caricamento in corso...' }: { message?: string }) {
  const colors = useAppColors();
  const accentColor = colors.primary;
  const accentSofter = `${colors.primary}14`;
  return (
    <>
      <div
        className="h-12 w-12 rounded-full border-2 animate-spin"
        style={{ borderColor: accentSofter, borderTopColor: accentColor }}
      />
      <p className="text-sm font-medium" style={{ color: textSecondaryColor }}>{message}</p>
    </>
  );
}

interface FullPageLoaderProps {
  /** Testo sotto lo spinner (default: "Caricamento in corso...") */
  message?: string;
  /** Classi aggiuntive per il wrapper esterno */
  className?: string;
}

export default function FullPageLoader({ message = 'Caricamento in corso...', className = '' }: FullPageLoaderProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center px-6 bg-white ${className}`.trim()}>
      <div className="flex flex-col items-center gap-4">
        <LoaderContent message={message} />
      </div>
    </div>
  );
}
