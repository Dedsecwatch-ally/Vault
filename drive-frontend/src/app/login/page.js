'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/drive');
    }
  }, [user, authLoading, router]);

  if (authLoading || user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/drive');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Dot grid background */}
      <div className="auth-grid" />

      {/* Gradient glow orbs */}
      <div className="glow glow-1" />
      <div className="glow glow-2" />

      <div className="auth-wrapper">
        {/* Left: branding */}
        <div className="auth-brand">
          <div className="brand-icon"><Shield size={24} /></div>
          <h1 className="brand-title">Vault</h1>
          <p className="brand-desc">Secure, fast, and elegant cloud storage for your files.</p>

          <div className="brand-features">
            <div className="feature-row"><span className="feature-dot" /><span>End-to-end encrypted storage</span></div>
            <div className="feature-row"><span className="feature-dot" /><span>Instant file versioning</span></div>
            <div className="feature-row"><span className="feature-dot" /><span>Share with granular permissions</span></div>
            <div className="feature-row"><span className="feature-dot" /><span>15 GB free cloud storage</span></div>
          </div>
        </div>

        {/* Right: form card */}
        <div className="auth-card-wrapper">
          <div className="auth-card">
            <div className="card-header">
              <h2>Sign in</h2>
              <p>Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label>Email</label>
                <div className="field">
                  <Mail size={15} className="field-icon" />
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="field">
                  <Lock size={15} className="field-icon" />
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : <>Sign In <ArrowRight size={14} /></>}
              </button>
            </form>

            <p className="auth-switch">
              No account? <Link href="/register">Create one →</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: var(--bg-primary);
        }

        /* Dot grid */
        .auth-grid {
          position: fixed;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
          z-index: 0;
        }

        /* Gradient glow orbs */
        .glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .glow-1 {
          width: 500px;
          height: 500px;
          background: rgba(56, 232, 176, 0.08);
          top: -150px;
          right: -100px;
        }
        .glow-2 {
          width: 400px;
          height: 400px;
          background: rgba(99, 102, 241, 0.06);
          bottom: -100px;
          left: -100px;
        }

        .auth-wrapper {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 80px;
          max-width: 900px;
          width: 100%;
          padding: 20px;
        }

        /* Left branding */
        .auth-brand {
          flex: 1;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--accent), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: var(--shadow-glow-sm);
        }

        .brand-title {
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -1.5px;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .brand-desc {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feature-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
          box-shadow: 0 0 8px var(--accent-glow);
        }

        /* Right card */
        .auth-card-wrapper {
          width: 380px;
          flex-shrink: 0;
        }

        .auth-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 32px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .card-header {
          margin-bottom: 24px;
        }

        .card-header h2 {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }

        .card-header p {
          font-size: 13px;
          color: var(--text-muted);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .field {
          position: relative;
        }

        .field .input {
          padding-left: 36px;
        }

        .field :global(.field-icon) {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .submit-btn {
          width: 100%;
          padding: 10px;
          margin-top: 4px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .auth-switch {
          text-align: center;
          margin-top: 16px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .auth-switch :global(a) {
          color: var(--accent);
          font-weight: 500;
        }
        .auth-switch :global(a:hover) {
          color: var(--accent-hover);
        }

        @media (max-width: 768px) {
          .auth-wrapper {
            flex-direction: column;
            gap: 32px;
            text-align: center;
          }
          .auth-brand { max-width: 380px; }
          .brand-features { align-items: center; }
          .auth-card-wrapper { width: 100%; max-width: 380px; }
        }
      `}</style>
    </div>
  );
}
