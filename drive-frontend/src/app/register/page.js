'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowRight, Loader, Shield } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
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
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created!');
      router.push('/drive');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-grid" />
      <div className="glow glow-1" />
      <div className="glow glow-2" />

      <div className="auth-wrapper">
        <div className="auth-brand">
          <div className="brand-icon"><Shield size={24} /></div>
          <h1 className="brand-title">Vault</h1>
          <p className="brand-desc">Your secure cloud storage starts here. Create an account and get 15 GB free.</p>

          <div className="brand-features">
            <div className="feature-row"><span className="feature-dot" /><span>Upload any file type</span></div>
            <div className="feature-row"><span className="feature-dot" /><span>Organize with nested folders</span></div>
            <div className="feature-row"><span className="feature-dot" /><span>Full-text search across files</span></div>
            <div className="feature-row"><span className="feature-dot" /><span>Restore deleted files anytime</span></div>
          </div>
        </div>

        <div className="auth-card-wrapper">
          <div className="auth-card">
            <div className="card-header">
              <h2>Create account</h2>
              <p>Start your secure storage journey</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label>Name</label>
                <div className="field">
                  <User size={15} className="field-icon" />
                  <input type="text" className="input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label>Email</label>
                <div className="field">
                  <Mail size={15} className="field-icon" />
                  <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="field">
                  <Lock size={15} className="field-icon" />
                  <input type="password" className="input" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : <>Create Account <ArrowRight size={14} /></>}
              </button>
            </form>

            <p className="auth-switch">
              Have an account? <Link href="/login">Sign in →</Link>
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
        .auth-grid {
          position: fixed;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
          z-index: 0;
        }
        .glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .glow-1 { width: 500px; height: 500px; background: rgba(99,102,241,0.07); top: -150px; left: -100px; }
        .glow-2 { width: 400px; height: 400px; background: rgba(56, 232, 176, 0.06); bottom: -100px; right: -100px; }
        .auth-wrapper {
          position: relative; z-index: 1; display: flex; align-items: center; gap: 80px; max-width: 900px; width: 100%; padding: 20px;
        }
        .auth-brand { flex: 1; }
        .brand-icon {
          width: 44px; height: 44px; border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--secondary), var(--accent));
          display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
          box-shadow: 0 0 15px var(--secondary-glow);
        }
        .brand-title {
          font-size: 38px; font-weight: 800; letter-spacing: -1.5px;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--secondary) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          margin-bottom: 8px;
        }
        .brand-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 32px; }
        .brand-features { display: flex; flex-direction: column; gap: 12px; }
        .feature-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); }
        .feature-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--secondary); flex-shrink: 0; box-shadow: 0 0 8px var(--secondary-glow); }
        .auth-card-wrapper { width: 380px; flex-shrink: 0; }
        .auth-card {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
          padding: 32px; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        }
        .card-header { margin-bottom: 24px; }
        .card-header h2 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 4px; }
        .card-header p { font-size: 13px; color: var(--text-muted); }
        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .field { position: relative; }
        .field .input { padding-left: 36px; }
        .field :global(.field-icon) { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .submit-btn { width: 100%; padding: 10px; margin-top: 4px; font-size: 14px; font-weight: 600; }
        .auth-switch { text-align: center; margin-top: 16px; font-size: 13px; color: var(--text-muted); }
        .auth-switch :global(a) { color: var(--accent); font-weight: 500; }
        .auth-switch :global(a:hover) { color: var(--accent-hover); }
        @media (max-width: 768px) {
          .auth-wrapper { flex-direction: column; gap: 32px; text-align: center; }
          .auth-brand { max-width: 380px; }
          .brand-features { align-items: center; }
          .auth-card-wrapper { width: 100%; max-width: 380px; }
        }
      `}</style>
    </div>
  );
}
