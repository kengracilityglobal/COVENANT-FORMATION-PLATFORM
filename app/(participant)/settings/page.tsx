'use client'
// @ts-nocheck
export const dynamic = 'force-dynamic'
import type { Profile } from '@/types'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fullName, setFullName] = useState('')
  const [notifications, setNotifications] = useState({
    formation_reminders: true,
    guide_messages: true,
    partner_activity: true,
  })

  useEffect(() => {
    fetch('/api/profile/me')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setFullName(data.full_name || '')
        if (data.notification_preferences) {
          setNotifications(data.notification_preferences)
        }
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    await fetch('/api/profile/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, notification_preferences: notifications }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">

      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>ACCOUNT</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Profile */}
        <div className="eikon-card p-6">
          <p className="pillar-number text-xs mb-5" style={{ color: 'var(--gold-muted)' }}>PROFILE</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="eikon-input"
              />
            </div>
            <div>
              <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                Email address
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="eikon-input"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="eikon-card p-6">
          <p className="pillar-number text-xs mb-5" style={{ color: 'var(--gold-muted)' }}>NOTIFICATIONS</p>
          <div className="space-y-4">
            {([
              { key: 'formation_reminders', label: 'Formation reminders', desc: 'Prompts to continue or return to your formation assessment' },
              { key: 'guide_messages',      label: 'Guide communications', desc: 'Messages and updates from your Formation Guide' },
              { key: 'partner_activity',    label: 'Partner activity',    desc: 'Notifications when your spouse joins, progresses, or completes their assessment' },
            ] as const).map(item => (
              <label key={item.key} className="flex items-start gap-4 cursor-pointer">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={e => setNotifications(n => ({ ...n, [item.key]: e.target.checked }))}
                    style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }}
                  />
                </div>
                <div>
                  <p className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    {item.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 justify-end">
          {saved && (
            <span className="text-sm font-display" style={{ color: '#7ABF7C' }}>
              ✓ Saved
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-gold"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="eikon-card p-6" style={{ border: '1px solid rgba(139,32,32,0.3)' }}>
        <p className="pillar-number text-xs mb-4" style={{ color: '#8B2020' }}>ACCOUNT</p>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm font-display" style={{ color: '#D47070', background: 'transparent', cursor: 'pointer' }}>
            Sign out of all devices →
          </button>
        </form>
      </div>

    </div>
  )
}
