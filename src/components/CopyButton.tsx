'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function CopyButton({
  value,
  label = 'Copy',
}: {
  value: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => void onCopy()}
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  )
}
