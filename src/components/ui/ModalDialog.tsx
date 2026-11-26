"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  sheetOnMobile?: boolean;
  maxWidthClass?: string;
}

export function ModalDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  sheetOnMobile = true,
  maxWidthClass,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Fallback for browsers without native <dialog closedby="any"> support (e.g. Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = "";
      onClose();
    };
    dialog.addEventListener("close", handleNativeClose);

    let cleanupFallback: (() => void) | undefined;
    if (typeof HTMLDialogElement !== "undefined" && !("closedBy" in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!isDialogContent) {
          dialog.close();
        }
      };
      dialog.addEventListener("click", handleBackdropClick);
      cleanupFallback = () => dialog.removeEventListener("click", handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener("close", handleNativeClose);
      cleanupFallback?.();
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={`${sheetOnMobile ? "mob-sheet" : ""} ${maxWidthClass ?? ""}`}
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div className="flex flex-col max-h-[86dvh]">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h1
              id={titleId}
              className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-display), var(--font-sans), sans-serif" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <form method="dialog">
            <button
              type="submit"
              aria-label="Cerrar ventana"
              className="p-2 -mr-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  );
}
