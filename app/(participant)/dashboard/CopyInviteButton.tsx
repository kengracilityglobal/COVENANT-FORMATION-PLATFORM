// @ts-nocheck
'use client'

import { useState } from 'react'

export function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Clipboard API unavailable — the code is still shown on screen to copy by hand.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" onClick={handleCopy} className="btn-gold text-sm">
      {copied ? '✓ Copied' : 'Copy code'}
    </button>
  )
}
