/**
 * usePDFDownload
 *
 * Client-side PDF export — runs entirely in the user's browser.
 * No Vercel serverless function, no Supabase storage, no paid plan required.
 *
 * Strategy: capture each named report section as a separate html2canvas
 * canvas, then stitch them into a multi-page jsPDF document.
 *
 * Usage:
 *   const { downloadPDF, generating } = usePDFDownload()
 *   <button onClick={() => downloadPDF('assessment-123', 'John Okafor')}>
 *     Download Report
 *   </button>
 *
 * Each section of the report page should have a data-pdf-section attribute:
 *   <div data-pdf-section="cover">…</div>
 *   <div data-pdf-section="summary">…</div>
 *   <div data-pdf-section="humility">…</div>
 *   … etc.
 *
 * If no sections are found it falls back to capturing the entire
 * #report-root element as a single long page.
 */

'use client'

import { useState } from 'react'

// CSS variable values — html2canvas cannot resolve var(--x) inside SVGs,
// so we pass resolved hex values directly to the capture options and also
// use them when pre-processing SVG elements before capture.
const CSS_VARS: Record<string, string> = {
  '--gold':           '#B8972A',
  '--gold-light':     '#D4AA4A',
  '--gold-pale':      '#FBF6EC',
  '--gold-muted':     '#8A7340',
  '--bg-primary':     '#0D0B08',
  '--bg-surface':     '#141008',
  '--bg-card':        '#1A1510',
  '--bg-elevated':    '#221C12',
  '--bg-border':      '#2A2218',
  '--text-primary':   '#F5E6C0',
  '--text-secondary': '#C4A96A',
  '--text-muted':     '#8A7340',
  '--text-faint':     '#4A3F2F',
}

/**
 * Resolve CSS custom property references in SVG element attributes.
 * html2canvas does not compute CSS variables on SVG attributes (stroke,
 * fill, etc.), so we inline the resolved values before capture and restore
 * them afterwards.
 */
function resolveSVGVars(root: HTMLElement): () => void {
  const SVG_ATTRS = ['fill', 'stroke', 'color']
  const patches: Array<{ el: Element; attr: string; original: string }> = []

  root.querySelectorAll('svg *').forEach(el => {
    SVG_ATTRS.forEach(attr => {
      const val = el.getAttribute(attr)
      if (val && val.startsWith('var(')) {
        // Extract var name: var(--gold) → --gold
        const varName = val.replace(/^var\(\s*(--[^),\s]+).*\)$/, '$1').trim()
        const resolved = CSS_VARS[varName]
        if (resolved) {
          patches.push({ el, attr, original: val })
          el.setAttribute(attr, resolved)
        }
      }
    })
  })

  // Return a restore function
  return () => {
    patches.forEach(({ el, attr, original }) => el.setAttribute(attr, original))
  }
}

export function usePDFDownload() {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress]     = useState(0)   // 0-100

  async function downloadPDF(assessmentId: string, participantName?: string) {
    setGenerating(true)
    setProgress(0)

    try {
      // Lazy-load heavy libraries — only downloaded when the user clicks
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const A4_W_MM = 210
      const A4_H_MM = 297
      const A4_W_PX = 794   // approx A4 at 96dpi
      const SCALE   = 2     // retina quality

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      // Gather sections
      const sections = Array.from(
        document.querySelectorAll('[data-pdf-section]')
      ) as HTMLElement[]

      const targets: HTMLElement[] = sections.length > 0
        ? sections
        : [document.getElementById('report-root') as HTMLElement].filter(Boolean)

      if (targets.length === 0) {
        console.warn('usePDFDownload: no capturable elements found')
        return
      }

      const options = {
        scale: SCALE,
        useCORS: true,
        backgroundColor: '#0D0B08',
        logging: false,
        // Constrain width to A4 so text doesn't reflow
        windowWidth: A4_W_PX,
        // Inline CSS variable values so html2canvas can read computed styles
        onclone: (clonedDoc: Document) => {
          // Apply resolved CSS variable values on the cloned document's root
          // so computed styles inside html2canvas reflect the brand colours
          const root = clonedDoc.documentElement
          Object.entries(CSS_VARS).forEach(([prop, val]) => {
            root.style.setProperty(prop, val)
          })
        },
      }

      let firstPage = true

      for (let idx = 0; idx < targets.length; idx++) {
        const el = targets[idx]

        setProgress(Math.round((idx / targets.length) * 85))

        // Resolve SVG CSS variable attributes before capture, restore after
        const restoreSVG = resolveSVGVars(el)
        const canvas = await html2canvas(el, options)
        restoreSVG()

        // Canvas pixel dimensions (already scaled by SCALE factor)
        const canvasW = canvas.width
        const canvasH = canvas.height

        // Height of one A4 page in canvas pixels
        const pageH_px = Math.round(canvasW * (A4_H_MM / A4_W_MM))

        // How many A4 pages does this section span?
        const pagesNeeded = Math.ceil(canvasH / pageH_px)

        for (let page = 0; page < pagesNeeded; page++) {
          if (!firstPage) pdf.addPage()
          firstPage = false

          // Source rectangle within the full canvas for this page slice
          const srcX      = 0
          const srcY      = page * pageH_px
          const srcW      = canvasW
          const srcH      = Math.min(pageH_px, canvasH - srcY)

          if (srcH <= 0) break

          // Create a canvas slice of exactly this page's content
          const slice    = document.createElement('canvas')
          slice.width    = srcW
          slice.height   = srcH
          const ctx      = slice.getContext('2d')!

          // FIX: use 9-argument drawImage to read from source rect, not shift destination
          ctx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)

          const sliceData  = slice.toDataURL('image/jpeg', 0.92)
          const sliceH_mm  = A4_W_MM * (srcH / srcW)

          pdf.addImage(sliceData, 'JPEG', 0, 0, A4_W_MM, sliceH_mm)
        }
      }

      setProgress(95)

      // Metadata
      pdf.setProperties({
        title:    'EIKON Formation Profile Report',
        subject:  'Character Formation Assessment',
        author:   "God's Kingdom Malak Ministries",
        keywords: 'eikon, formation, character, ministry',
        creator:  'EIKON Platform',
      })

      const safeName = (participantName ?? 'participant')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      pdf.save(`eikon-report-${safeName}-${assessmentId.slice(0, 8)}.pdf`)

      // Show 100% briefly before resetting so user sees completion
      setProgress(100)
      await new Promise(resolve => setTimeout(resolve, 600))

    } catch (err) {
      console.error('PDF generation failed:', err)
      alert("PDF could not be generated. Please try again or use your browser's print function (Ctrl+P / ⌘+P).")
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  return { downloadPDF, generating, progress }
}
