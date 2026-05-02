import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

let scrollLockCount = 0;
let originalBodyOverflow: string | null = null;

const lockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  if (scrollLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
};

const unlockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = originalBodyOverflow ?? '';
    originalBodyOverflow = null;
  }
};

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
};

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: ModalSize;
  footer?: React.ReactNode;
  loading?: boolean;
  dismissible?: boolean;
  zIndex?: number;
  children?: React.ReactNode;
  contentClassName?: string;
  hideCloseButton?: boolean;
  ariaLabel?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  footer,
  loading = false,
  dismissible = true,
  zIndex = 100,
  children,
  contentClassName = '',
  hideCloseButton = false,
  ariaLabel,
}) => {
  const reduceMotion = useReducedMotion();

  const handleClose = useCallback(() => {
    if (loading || !dismissible) return;
    onOpenChange(false);
  }, [loading, dismissible, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (typeof document === 'undefined') return null;

  const backdropTransition = reduceMotion ? { duration: 0 } : { duration: 0.18 };
  const panelInitial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 16, scale: 0.96 };
  const panelAnimate = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, scale: 1 };
  const panelExit = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 8, scale: 0.98 };
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 24, stiffness: 280, mass: 0.8 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          <motion.button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            className="absolute inset-0 bg-black/40 cursor-default"
            onClick={handleClose}
            disabled={loading || !dismissible}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          />
          <motion.div
            className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col ${contentClassName}`}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
          >
            {(title || !hideCloseButton) && (
              <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-gray-100">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <div className="mt-1 text-sm text-gray-600">{description}</div>
                  )}
                </div>
                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading || !dismissible}
                    aria-label="Close"
                    className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
            {footer && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-lg">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
