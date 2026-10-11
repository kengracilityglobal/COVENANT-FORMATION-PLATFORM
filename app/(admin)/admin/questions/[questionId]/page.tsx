// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuestionForm from '../QuestionForm'

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>
}) {
  const { questionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: question } = await supabase.from('questions').select('*').eq('id', questionId).single()
  if (!question) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>QUESTION BANK</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Edit Question <span className="font-light text-xl" style={{ color: 'var(--text-faint)' }}>{question.code}</span>
        </h1>
      </div>
      <QuestionForm mode="edit" question={question} />
    </div>
  )
}
