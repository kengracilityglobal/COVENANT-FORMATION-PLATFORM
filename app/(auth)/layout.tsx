// @ts-nocheck
export const dynamic = 'force-dynamic'
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'var(--bg-primary)',
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(184,151,42,0.05) 0%, transparent 60%)',
      }}
    >
      <div className="w-full max-w-md">
        <style>{`
          .auth-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .auth-container > .eikon-card {
            width: 100%;
          }
        `}</style>
        {children}
      </div>
    </div>
  )
}
