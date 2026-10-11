// lib/couples/helpers.ts
//
// Small shared helpers for the couple-pairing model — the one genuinely
// new construct this platform adds over EIKON (see types/index.ts's
// Couple interface for the full rationale).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type TypedClient = SupabaseClient<Database>

/** Readable invite code: 8 uppercase alphanumeric chars, no ambiguous O/0/I/1. */
export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

/** The couple a given profile belongs to, on either side. Null if they
 *  haven't registered/joined a couple yet (shouldn't happen post-onboarding). */
export async function getCoupleForUser(supabase: TypedClient, userId: string) {
  const { data } = await supabase
    .from('couples')
    .select('*')
    .or(`partner_a_id.eq.${userId},partner_b_id.eq.${userId}`)
    .maybeSingle()
  return data
}

/** Which slot (partner_a/partner_b) this user occupies in a couple they're in. */
export function partnerSlot(couple: { partner_a_id: string; partner_b_id: string | null }, userId: string): 'partner_a' | 'partner_b' | null {
  if (couple.partner_a_id === userId) return 'partner_a'
  if (couple.partner_b_id === userId) return 'partner_b'
  return null
}

export function otherPartnerId(couple: { partner_a_id: string; partner_b_id: string | null }, userId: string): string | null {
  if (couple.partner_a_id === userId) return couple.partner_b_id
  if (couple.partner_b_id === userId) return couple.partner_a_id
  return null
}
