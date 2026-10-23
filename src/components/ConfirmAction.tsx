'use client'

import { useEffect, useId, useRef, useState } from 'react'

type Props = {
  /** Trigger button text, also the confirm button text unless `confirmLabel` is set. */
  label: string
  /** Shown on the trigger while `busy`. */
  busyLabel?: string
  confirmLabel?: string
  /** The question the admin answers before anything is sent. */
  confirmText: string
  busy?: boolean
  danger?: boolean
  onConfirm: () => void
}

/**
 * A button that asks before it acts. Clicking it swaps the button for the
 * question with Confirm and Cancel, so a stray click never changes anything.
 */
export function ConfirmAction({
  label,
  busyLabel = 'Updating…',
  confirmLabel,
  confirmText,
  busy = false,
  danger = false,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const textId = useId()

  // Put focus back on the trigger when the question closes.
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  if (open) {
    return (
      <div
        className="banner banner-warn confirm-panel"
        role="group"
        aria-label={label}
        aria-describedby={textId}
      >
        <p id={textId}>{confirmText}</p>
        <div className="confirm-actions">
          <button
            type="button"
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            disabled={busy}
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
          >
            {confirmLabel ?? label}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            autoFocus
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      className={danger ? 'btn btn-danger' : 'btn'}
      disabled={busy}
      onClick={() => setOpen(true)}
    >
      {busy ? busyLabel : label}
    </button>
  )
}
