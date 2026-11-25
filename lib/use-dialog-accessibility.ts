"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Provides WCAG-compliant modal dialog keyboard & focus management:
 * 1. Captures the previously focused opener element on open and restores focus on close.
 * 2. Moves initial focus inside the dialog (`initialFocusRef` or first focusable control).
 * 3. Closes on Escape and traps Tab / Shift+Tab cycling within the dialog.
 */
export function useDialogAccessibility(
  isOpen: boolean,
  onClose: () => void,
  dialogRef: RefObject<HTMLElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
  restoreFocusOnCloseRef?: MutableRefObject<boolean>,
) {
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    openerRef.current =
      typeof document !== "undefined" && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (restoreFocusOnCloseRef) {
      restoreFocusOnCloseRef.current = true;
    }

    const focusTimer = window.setTimeout(() => {
      if (initialFocusRef?.current && !initialFocusRef.current.hasAttribute("disabled")) {
        initialFocusRef.current.focus();
        return;
      }
      const container = dialogRef.current;
      if (!container) return;
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        container.focus();
      }
    }, 10);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const container = dialogRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      const opener = openerRef.current;
      openerRef.current = null;
      const shouldRestore = restoreFocusOnCloseRef ? restoreFocusOnCloseRef.current : true;
      if (shouldRestore && opener && opener.isConnected) {
        window.requestAnimationFrame(() => opener.focus());
      }
    };
  }, [isOpen, dialogRef, initialFocusRef, restoreFocusOnCloseRef]);
}
