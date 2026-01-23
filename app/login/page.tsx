'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, ArrowRight, CheckCircle, GraduationCap } from 'lucide-react';
import { z } from 'zod';
import styles from './login.module.css';

// ... (Zod Schemas remain the same)
const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const SignupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 chars'),
  password: z.string().min(6, 'Password must be at least 6 chars'),
  role: z.enum(['student', 'admin']),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student' as 'student' | 'admin'
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  // Schema Selection
  const ClientLoginSchema = LoginSchema;
  const ClientSignupSchema = SignupSchema;

  const validateForm = () => {
    try {
      if (isLogin) {
        ClientLoginSchema.parse(formData);
      } else {
        ClientSignupSchema.parse(formData);
      }
      setFieldErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach(err => {
          if (err.path[0]) errors[err.path[0].toString()] = err.message;
        });
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!validateForm()) return;

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isLogin ? 'Login failed' : 'Signup failed'));
      }

      // Success - Redirect
      router.push('/');
      router.refresh();

    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.splitLayout}>
      {/* Left Panel - Visual / Art */}
      <div className={styles.leftPanel}>
        <div className={styles.artContent}>
          <div className={styles.brand}>
            <div className={styles.logoIcon}>EV</div>
            <span>ExamVault</span>
          </div>

          <h1 className={styles.artTitle}>
            Master Your<br />
            <span className={styles.highlight}>Efficiency.</span>
          </h1>
          <p className={styles.artSubtitle}>
            Join thousands of students and faculty managing timed assessments with ease and precision.
          </p>

          {/* Floating Glass Cards as Deco - Positioned safely away from text */}
          <div className={styles.floatingCard} style={{ bottom: '80px', right: '10px' }}>
            <div className={styles.floatIcon} style={{ background: '#DCFCE7', color: '#15803D' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>100+ Tests</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Created Daily</div>
            </div>
          </div>

          <div className={styles.floatingCard} style={{ top: '40px', left: '40px' }}>
            <div className={styles.floatIcon} style={{ background: '#E0F2FE', color: '#0369A1' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Top Rated</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>By Faculty</div>
            </div>
          </div>

          {/* Abstract Background Shapes */}
          <div className={styles.circleShape}></div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h1>{isLogin ? 'Welcome back!' : 'Create account'}</h1>
            <p className={styles.subtitle}>
              {isLogin ? 'Please enter your details.' : 'Start your journey today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Role Toggle (Signup Only) */}
            {!isLogin && (
              <div className={styles.roleGroup}>
                <label className={styles.roleLabel}>I am a:</label>
                <div className={styles.toggles}>
                  <button
                    type="button"
                    className={`${styles.toggle} ${formData.role === 'student' ? styles.active : ''}`}
                    onClick={() => setFormData({ ...formData, role: 'student' })}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggle} ${formData.role === 'admin' ? styles.active : ''}`}
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                  >
                    Faculty
                  </button>
                </div>
              </div>
            )}

            {/* Username */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Username</label>
              <div className={styles.inputWrapper}>
                <User className={styles.icon} size={18} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  className={styles.input}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              {fieldErrors.username && <span className={styles.fieldError}>{fieldErrors.username}</span>}
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.icon} size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className={styles.input}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
            </div>

            {globalError && (
              <div className={styles.errorAlert}>
                ⚠️ {globalError}
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Processing...' : (isLogin ? 'Log in' : 'Sign up')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className={styles.footer}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className={styles.linkBtn}>
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
