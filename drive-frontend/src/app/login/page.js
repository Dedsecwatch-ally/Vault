'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div className="auth-container">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">V</div>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Welcome back</h1>
            <p>Sign in to your Vault account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Email</label>
              <div className="auth-field">
                <Mail size={16} className="auth-field-icon" />
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
              <div className="auth-field">
                <Lock size={16} className="auth-field-icon" />
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <Loader size={16} className="spinner" /> : <>Sign in <ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link href="/register">Create one</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 20px;
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-logo {
          margin-bottom: 32px;
        }

        .auth-logo-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--accent);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          box-shadow: var(--shadow-md);
        }

        .auth-card {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 36px 32px;
          box-shadow: var(--shadow-lg);
        }

        .auth-card-header {
          margin-bottom: 28px;
          text-align: center;
        }

        .auth-card-header h1 {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .auth-card-header p {
          font-size: 14px;
          color: var(--text-muted);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .auth-field {
          position: relative;
        }

        .auth-field .input {
          padding-left: 40px;
        }

        .auth-field :global(.auth-field-icon) {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .auth-submit {
          width: 100%;
          padding: 11px;
          margin-top: 4px;
          font-size: 14px;
          font-weight: 600;
          border-radius: var(--radius-sm);
        }

        .auth-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .auth-footer :global(a) {
          color: var(--accent);
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .auth-footer :global(a:hover) {
          color: var(--accent-hover);
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 28px 24px;
          }
        }
      `}</style>
    </div>
  );
}
