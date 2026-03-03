import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, type LucideIcon } from 'lucide-react';
import { useAppColors } from '../hooks/useAppColors';

const ROOT_CLASS_PAGE_HEADER = 'page-header-visible';

const textPrimaryColor = '#2C2C2C';
const surfaceColor = '#FFFFFF';

export type PageHeaderRightAction =
  | { type: 'icon'; icon: LucideIcon; ariaLabel: string; onClick: () => void }
  | { type: 'label'; label: string; onClick?: () => void; disabled?: boolean; formId?: string };

export interface PageHeaderProps {
  /** Titolo della sezione, centrato */
  title: string;
  /** Mostra pulsante indietro con freccia */
  showBack?: boolean;
  /** Callback indietro (se assente e showBack=true usa navigate(-1)) */
  onBack?: () => void;
  /** Testo accanto alla freccia (es. "Indietro"). Se assente solo icona */
  backLabel?: string;
  /** Azione a destra: icona o label */
  rightAction?: PageHeaderRightAction;
  /** sticky (default), fixed, o static */
  variant?: 'sticky' | 'fixed' | 'static';
  /** Classi aggiuntive per l'header */
  className?: string;
  /** Stili inline aggiuntivi (es. borderColor) */
  style?: React.CSSProperties;
}

export default function PageHeader({
  title,
  showBack = false,
  onBack,
  backLabel,
  rightAction,
  variant = 'sticky',
  className = '',
  style = {},
}: PageHeaderProps) {
  const navigate = useNavigate();
  const colors = useAppColors();
  const accentColor = colors.primary;
  const accentSofter = `${colors.primary}14`;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  useEffect(() => {
    document.documentElement.classList.add(ROOT_CLASS_PAGE_HEADER);
    return () => document.documentElement.classList.remove(ROOT_CLASS_PAGE_HEADER);
  }, []);

  const baseClasses =
    'relative flex h-14 min-h-14 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800 safe-area-header';
  const variantClasses =
    variant === 'fixed'
      ? 'fixed top-0 left-0 right-0 z-10 flex-shrink-0'
      : variant === 'sticky'
        ? 'sticky top-0 z-30'
        : '';

  const borderStyle = { ...style, borderColor: style.borderColor ?? accentSofter };

  return (
    <header
      className={`${baseClasses} ${variantClasses} ${className}`.trim()}
      style={{ backgroundColor: surfaceColor, ...borderStyle }}
    >
      {/* Sinistra: indietro o spacer */}
      <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center justify-start">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-90"
            style={{ color: accentColor }}
            aria-label={backLabel ?? 'Indietro'}
          >
            <ChevronLeft className="h-6 w-6 shrink-0" />
            {backLabel != null && <span>{backLabel}</span>}
          </button>
        ) : (
          <div className="h-9 w-9" aria-hidden />
        )}
      </div>

      {/* Centro: titolo */}
      <h1
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold dark:text-white truncate max-w-[60%]"
        style={{ color: textPrimaryColor }}
      >
        {title}
      </h1>

      {/* Destra: azione o spacer */}
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-end">
        {rightAction ? (
          rightAction.type === 'icon' ? (
            <button
              type="button"
              onClick={rightAction.onClick}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-90"
              style={{ color: accentColor }}
              aria-label={rightAction.ariaLabel}
            >
              <rightAction.icon className="h-6 w-6" />
            </button>
          ) : (
            <button
              type={rightAction.formId ? 'submit' : 'button'}
              form={rightAction.formId}
              onClick={rightAction.onClick}
              disabled={rightAction.disabled}
              className="flex items-center font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ color: accentColor }}
              aria-label={rightAction.label}
            >
              {rightAction.label}
            </button>
          )
        ) : (
          <div className="h-9 w-9" aria-hidden />
        )}
      </div>
    </header>
  );
}
