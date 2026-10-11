// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuestionForm from '../QuestionForm'

export default async function NewQuestionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>QUESTION BANK</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Question</h1>
      </div>
      <QuestionForm mode="create" />
    </div>
  )
}
