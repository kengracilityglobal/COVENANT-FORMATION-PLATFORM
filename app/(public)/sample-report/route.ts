// A public, fictional example of a full report — rendered by the real report
// builder from invented answers (lib/report/sample.ts). No auth, no database.
//   /sample-report                 married-couple example, with the Perception Gap
//   /sample-report?track=readiness solo readiness example
import { NextResponse } from 'next/server'
import { buildSampleReport } from '@/lib/report/sample'

export async function GET(request: Request) {
  const track = new URL(request.url).searchParams.get('track') === 'readiness' ? 'readiness' : 'married'
  return new NextResponse(buildSampleReport(track), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
