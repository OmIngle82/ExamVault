'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext';
import styles from './test.module.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReportCard from '@/app/components/ReportCard';

export default function TestForm({ test, questions, username, fullName, avatarUrl }: { test: any, questions: any[], username?: string, fullName?: string, avatarUrl?: string }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName, setStudentName] = useState(username || '');
  const [hasStarted, setHasStarted] = useState(false);

  // Ref for scrolling
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Result State
  const [score, setScore] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, { correct: boolean; correctAnswer: string }>>({});
  const [gamification, setGamification] = useState<any>(null); // New State
  const [isReviewing, setIsReviewing] = useState(false);

  // Security State
  const [warningCount, setWarningCount] = useState(0);
  const MAX_WARNINGS = 3;

  // Initialize checks
  useEffect(() => {
    // Load saved state
    const storedStart = localStorage.getItem(`test_start_${test.id}`);
    const storedAnswers = localStorage.getItem(`test_answers_${test.id}`);

    if (storedStart) {
      const startTime = parseInt(storedStart, 10);
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = (test.duration_minutes * 60) - elapsed;

      if (remaining <= 0) {
        return;
      }

      setTimeLeft(remaining);
      setHasStarted(true);
      if (storedAnswers) {
        try {
          setAnswers(JSON.parse(storedAnswers));
        } catch (e) { console.error('Failed to parse answers', e); }
      }
    }
  }, [test.id, test.duration_minutes]);

  // Persist answers
  useEffect(() => {
    if (hasStarted) {
      localStorage.setItem(`test_answers_${test.id}`, JSON.stringify(answers));
    }
  }, [answers, test.id, hasStarted]);



  const startTest = () => {
    if (!studentName.trim()) {
      addToast('Please enter your name', 'error');
      return;
    }
    const now = Date.now();
    localStorage.setItem(`test_start_${test.id}`, now.toString());
    setHasStarted(true);
    setTimeLeft(test.duration_minutes * 60);
    document.documentElement.requestFullscreen().catch((e) => {
      console.log('Fullscreen rejected', e);
    });
  };

  const submitTest = useCallback(async (overrideViolationCount?: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }

    try {
      const storedStart = localStorage.getItem(`test_start_${test.id}`);
      const startTime = storedStart ? new Date(parseInt(storedStart)).toISOString() : new Date().toISOString();

      // Use check for override, otherwise fallback to state
      // Note: If calling from event handler, pass explicit value to avoid stale state
      const finalViolationCount = typeof overrideViolationCount === 'number' ? overrideViolationCount : warningCount;


      const res = await fetch(`/api/tests/${test.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          answers,
          startTime,
          violationCount: finalViolationCount
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      const data = await res.json();
      localStorage.removeItem(`test_start_${test.id}`);
      localStorage.removeItem(`test_answers_${test.id}`);

      setScore(data.score);
      setTotalQuestions(data.total);
      setFeedback(data.feedback);
      setGamification(data.gamification); // Save gamification result
      addToast('Test submitted successfully!', 'success');

    } catch (err: any) {
      console.error('Submit Error:', err);
      addToast('Error submitting test: ' + (err.message || 'Unknown'), 'error');
      setIsSubmitting(false);
    }
  }, [isSubmitting, test.id, studentName, answers, warningCount, addToast]);

  // Tab Switch Monitor
  useEffect(() => {
    if (!hasStarted || score !== null || isSubmitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = warningCount + 1;
        setWarningCount(newCount);

        if (newCount >= MAX_WARNINGS) {
          addToast(`Violation Limit Reached! Auto-submitting. Tabs switched ${newCount} times.`, 'error');
          submitTest(newCount);
        } else {
          addToast(`Warning! Tab switching forbidden. Warning ${newCount}/${MAX_WARNINGS}.`, 'warning');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasStarted, score, isSubmitting, addToast, warningCount, submitTest]);

  // Timer Logic
  useEffect(() => {
    if (!hasStarted || timeLeft === null || score !== null) return;

    if (timeLeft <= 0) {
      submitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, submitTest, score]);

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const scrollToQuestion = (id: string) => {
    const el = questionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const reportCardRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!reportCardRef.current) return;

    try {
      addToast('Generating Report Card...', 'info');
      const canvas = await html2canvas(reportCardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${studentName || 'Student'}_Report_${test.title}.pdf`);
      addToast('Report Card Downloaded!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to generate PDF', 'error');
    }
  };

  // ----- RENDERS -----

  // 1. Success / Score Screen
  if (score !== null) {
    if (isReviewing) {
      // --- REVIEW MODE ---
      return (
        <div className={styles.layoutContainer} style={{ display: 'block', maxWidth: '800px' }}>
          <h2 style={{ marginBottom: '2rem', textAlign: 'center', fontSize: '2.5rem', position: 'relative', zIndex: 2 }}>Submission Review</h2>

          {questions.map((q, idx) => {
            const qFeedback = feedback[q.id];
            const isCorrect = qFeedback?.correct;
            return (
              <div
                key={q.id}
                className={styles.reviewCard}
                style={{
                  borderColor: isCorrect ? '#4ade80' : '#f87171',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>Question {idx + 1}</span>
                  <span style={{ fontWeight: 'bold', color: isCorrect ? 'green' : 'red' }}>
                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <h3 className={styles.prompt}>{q.prompt}</h3>

                <p><strong>Your Answer:</strong> {answers[q.id] || '(No Answer)'}</p>
                {!isCorrect && (
                  <p style={{ color: '#d32f2f', background: '#ffebee', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                    <strong>Correct Answer:</strong> {qFeedback?.correctAnswer}
                  </p>
                )}
              </div>
            );
          })}

          <button onClick={() => window.location.href = '/'} className={styles.submitBtnSidebar} style={{ width: '100%', maxWidth: '300px', display: 'block', margin: '0 auto', position: 'relative', zIndex: 2 }}>
            Back to Home
          </button>
        </div>
      );
    }

    return (
      <div className={styles.welcomeContainer}>
        <div className={styles.scoreCard}>
          <div className={styles.scoreIcon}>{score === totalQuestions ? '🏆' : (score > totalQuestions / 2 ? '⭐' : '😅')}</div>
          <h2>Test Completed!</h2>
          <div className={styles.bigScore}>{score}/{totalQuestions}</div>

          {gamification && (
            <div style={{ margin: '1rem 0', padding: '1rem', background: '#f0f9ff', borderRadius: '12px', border: '2px solid #bae6fd' }}>
              <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0284c7', marginBottom: '0.5rem' }}>
                +{gamification.xpEarned} XP
              </div>

              {gamification.badgesUnlocked.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {gamification.badgesUnlocked.map((b: any) => (
                    <div key={b.id} title={b.description} style={{ background: 'white', padding: '5px 10px', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>{b.icon}</span> {b.name}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                Total XP: {gamification.newTotalXp}
              </div>
            </div>
          )}

          <p>Check "Review" to see what you missed.</p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button onClick={downloadPDF} className={styles.submitBtnSidebar} style={{ background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📄 Download Report
            </button>
            <button onClick={() => setIsReviewing(true)} className={styles.submitBtnSidebar} style={{ background: 'var(--color-pink)', color: '#fff' }}>
              Review Answers 🔍
            </button>
            <button onClick={() => window.location.href = '/'} className={styles.submitBtnSidebar} style={{ background: 'transparent', color: 'var(--text-main)' }}>
              Home 🏠
            </button>
          </div>
        </div>

        {/* Hidden Report Card for Generation */}
        <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          <ReportCard
            ref={reportCardRef}
            testTitle={test.title}
            studentName={studentName || fullName || 'Student'}
            score={score}
            totalQuestions={totalQuestions}
            date={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            xpEarned={gamification?.xpEarned}
            badgesUnlocked={gamification?.badgesUnlocked}
          />
        </div>
      </div>
    );
  }

  // 2. Welcome Screen
  if (!hasStarted) {
    return (
      <div className={styles.welcomeContainer}>
        <div className={styles.welcomeCard}>
          <h1>{test.title}</h1>
          <p style={{ color: '#666', fontWeight: '600', marginBottom: '1rem' }}>{test.description}</p>
          <div>
            {username ? (
              <div style={{ background: '#F3F4F6', padding: '1.25rem', borderRadius: '12px', textAlign: 'left', border: '1px solid #E5E7EB' }}>
                <p style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#6B7280', fontWeight: '600' }}>
                  You are attempting this test as:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                    alt="avatar"
                    style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', border: '2px solid white', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                      {fullName || username}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                      @{username}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', textAlign: 'left', marginBottom: '0.5rem' }}>Enter your Full Name to begin:</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className={styles.input}
                  placeholder="John Doe"
                />
              </div>
            )}
          </div>
          <div className={styles.warningNote}>
            ⚠️ <strong>Proctored Exam:</strong> Switching tabs is monitored. 3 warnings triggers auto-submit.
          </div>
          <button onClick={startTest} className={styles.startBtn}>Start Quiz (Fullscreen) →</button>
        </div>
      </div>
    );
  }

  // 3. Exam Interface (Grid + List)
  return (
    <div className={styles.layoutContainer}>
      {/* MAIN CONTENT: Scrollable List */}
      <div className={styles.questionsList}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '3px solid var(--text-main)', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{test.title}</h1>
          <p style={{ color: '#666' }}>Answer all questions below.</p>
        </div>

        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          return (
            <div
              key={q.id}
              className={styles.questionItem}
              ref={(el) => { questionRefs.current[q.id] = el; }}
              id={`q-${q.id}`}
            >
              <div className={styles.questionHeader}>
                <span>Question {idx + 1}</span>
                <span style={{ color: isAnswered ? 'green' : '#ccc' }}>
                  {isAnswered ? '✓ Answered' : '○ Pending'}
                </span>
              </div>
              <div className={styles.prompt}>{q.prompt}</div>

              {q.type === 'mcq' ? (
                <div className={styles.optionsGrid}>
                  {q.options.map((opt: string, optIdx: number) => (
                    <label
                      key={optIdx}
                      className={`${styles.optionLabel} ${answers[q.id] === opt ? styles.selected : ''}`}
                    >
                      <div className={styles.optionLetter}>{String.fromCharCode(65 + optIdx)}</div>
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        style={{ display: 'none' }}
                      />
                      <span className={styles.optionText}>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className={styles.input}
                  rows={5}
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* SIDEBAR: Timer + Palette */}
      <div className={styles.sidebar}>
        <div className={styles.timerBox}>
          ⏳ {timeLeft !== null ? formatTime(timeLeft) : '...'}
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Question Palette</h3>
          <div className={styles.questionPalette}>
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              return (
                <button
                  key={q.id}
                  className={`${styles.paletteBtn} ${isAnswered ? styles.paletteAttempted : styles.paletteUnattempted}`}
                  onClick={() => scrollToQuestion(q.id)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', textAlign: 'center' }}>
            {Object.keys(answers).length} / {questions.length} Attempted
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              submitTest();
            }}
            disabled={isSubmitting}
            className={styles.submitBtnSidebar}
            style={{ width: '100%' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      {warningCount > 0 && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', background: 'red', color: 'white', padding: '1rem', borderRadius: '12px', zIndex: 200, fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
          ⚠️ Warnings: {warningCount}/{MAX_WARNINGS}
        </div>
      )}
    </div>
  );
}
