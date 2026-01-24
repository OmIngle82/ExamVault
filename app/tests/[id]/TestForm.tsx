'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext';
import styles from './test.module.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReportCard from '@/app/components/ReportCard';
import Editor from '@monaco-editor/react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

const MAX_WARNINGS = 3;

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

  // Proctoring Settings
  const settings = test.proctoring_settings || {};
  const { enable_webcam, enable_audio, enable_fullscreen, tab_lock } = settings;

  // Media Stream State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  const requestPermissions = async () => {
    try {
      const constraints = {
        video: enable_webcam,
        audio: enable_audio
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      addToast('Camera/Microphone access granted.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Permission denied. You cannot start this proctored exam.', 'error');
    }
  };

  const startTest = () => {
    if (!studentName.trim()) {
      addToast('Please enter your name', 'error');
      return;
    }

    // Proctoring Check
    if ((enable_webcam || enable_audio) && !permissionGranted) {
      addToast('You must grant camera/microphone permissions first.', 'error');
      return;
    }

    const now = Date.now();
    localStorage.setItem(`test_start_${test.id}`, now.toString());
    setHasStarted(true);
    setTimeLeft(test.duration_minutes * 60);

    if (enable_fullscreen) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.log('Fullscreen rejected', e);
      });
    }
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
      setGamification(data.gamification);
      addToast('Test submitted successfully!', 'success');

    } catch (err: any) {
      console.error('Submit Error:', err);
      addToast('Error submitting test: ' + (err.message || 'Unknown'), 'error');
      setIsSubmitting(false);
    }
  }, [isSubmitting, test.id, studentName, answers, warningCount, addToast]);

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

  // Tab Switch Monitor (Conditional)
  useEffect(() => {
    if (!hasStarted || score !== null || isSubmitting || !tab_lock) return;

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
  }, [hasStarted, score, isSubmitting, addToast, warningCount, submitTest, tab_lock]);

  // Fullscreen Monitor (Conditional)
  useEffect(() => {
    if (!hasStarted || score !== null || isSubmitting || !enable_fullscreen) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addToast('Please stay in fullscreen mode!', 'warning');
        // Optional: stricter kick
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hasStarted, enable_fullscreen]);

  // Code Execution Logic
  const [executionResults, setExecutionResults] = useState<Record<string, { output: string; status: string; isLoading: boolean }>>({});

  const runCode = async (qId: number, code: string | undefined, language: string, expectedOutput: string) => {
    if (!code) return;

    setExecutionResults(prev => ({ ...prev, [qId]: { output: 'Running...', status: 'loading', isLoading: true } }));

    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, sourceCode: code || '', expectedOutput })
      });
      const data = await res.json();

      setExecutionResults(prev => ({
        ...prev,
        [qId]: {
          output: data.output || '(No Output)',
          status: data.status,
          isLoading: false
        }
      }));

      if (data.status === 'success') {
        addToast('Test Case Passed! 🚀', 'success');
      } else if (data.status === 'failure') {
        addToast('Output did not match expected result.', 'warning');
      }

    } catch (error) {
      setExecutionResults(prev => ({ ...prev, [qId]: { output: 'Execution Failed', status: 'error', isLoading: false } }));
    }
  };


  // ... (Rest of component functions like submitTest, handleAnswer remain same)

  // 2. Welcome Screen
  if (!hasStarted) {
    return (
      <div className={styles.welcomeContainer}>
        <div className={styles.welcomeCard}>
          <h1>{test.title}</h1>
          <p style={{ color: '#666', fontWeight: '600', marginBottom: '1rem' }}>{test.description}</p>

          {/* Security Badges */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {enable_webcam && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>📷 Webcam On</span>}
            {enable_audio && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>🎤 Audio On</span>}
            {enable_fullscreen && <span style={{ background: '#ECFCCB', color: '#3F6212', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>⛶ Fullscreen</span>}
            {tab_lock && <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>👁️ No Tabs</span>}
          </div>

          <div>
            {/* Name Input Logic (Same as before) */}
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

          {/* Permissions Request Button */}
          {(enable_webcam || enable_audio) && !permissionGranted && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#9A3412', marginBottom: '1rem' }}>
                ⚠️ This exam requires media permissions.
              </p>
              <button
                onClick={requestPermissions}
                style={{
                  background: '#EA580C', color: 'white', border: 'none', padding: '0.6rem 1.2rem',
                  borderRadius: '6px', fontWeight: 600, cursor: 'pointer', width: '100%'
                }}
              >
                Grant Camera/Mic Access
              </button>
            </div>
          )}

          {/* Video Preview (Hidden/Small) */}
          <div style={{ marginTop: '1rem', display: permissionGranted ? 'block' : 'none' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100px', borderRadius: '8px', border: '2px solid #22c55e' }} />
            <p style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600 }}>● System Ready</p>
          </div>

          <button
            onClick={startTest}
            disabled={(enable_webcam || enable_audio) && !permissionGranted}
            className={styles.startBtn}
            style={{ opacity: ((enable_webcam || enable_audio) && !permissionGranted) ? 0.5 : 1 }}
          >
            Start Quiz {enable_fullscreen ? '(Fullscreen)' : ''} →
          </button>
        </div>
      </div>
    );
  }

  // Live Mode State
  const [liveState, setLiveState] = useState<{ mode: string; status: string; current_question_index: number }>({
    mode: test.mode || 'self_paced',
    status: test.status || 'active',
    current_question_index: test.current_question_index ?? -1
  });

  // Poll for Live Updates
  useEffect(() => {
    if (liveState.mode !== 'live' || score !== null) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tests/${test.id}/live`);
        const data = await res.json();

        setLiveState(prev => {
          // If status changed to ended, auto-submit
          if (prev.status === 'active' && data.status === 'ended') {
            submitTest();
          }
          return data;
        });

      } catch (e) { console.error('Polling error', e); }
    }, 2000); // Poll every 2s

    return () => clearInterval(interval);
  }, [liveState.mode, test.id, score, submitTest]);

  // LIVE MODE RENDER
  if (liveState.mode === 'live' && hasStarted && score === null) {
    const currentQIndex = liveState.current_question_index;
    // If index is -1 or waiting
    if (currentQIndex === -1 || liveState.status === 'draft') {
      return (
        <div className={styles.welcomeContainer}>
          <div className={styles.welcomeCard} style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</h1>
            <h2>Waiting for Host to Start...</h2>
            <p>Sit tight! The exam will begin shortly.</p>
            <div className={styles.spinner}></div>
          </div>
        </div>
      );
    }

    const q = questions[currentQIndex];
    if (!q) return <div>Loading Question...</div>;

    return (
      <div className={styles.layoutContainer} style={{ display: 'block', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ background: 'red', color: 'white', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold', fontSize: '0.8rem', animation: 'pulse 2s infinite' }}>🔴 LIVE SESSION</span>
        </div>

        <div className={styles.questionItem} style={{ border: '2px solid #2563eb', boxShadow: '0 10px 30px rgba(37, 99, 235, 0.1)' }}>
          <div className={styles.questionHeader}>
            <span>Question {currentQIndex + 1} of {questions.length}</span>
          </div>
          <div className={styles.prompt} style={{ fontSize: '1.5rem' }}>
            <Latex>{q.prompt}</Latex>
          </div>

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
                  <span className={styles.optionText}><Latex>{opt}</Latex></span>
                </label>
              ))}
            </div>
          ) : q.type === 'code' ? (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#64748b' }}>{q.options[0]?.toUpperCase() || 'PYTHON'}</span>
                  <button
                    onClick={() => runCode(q.id, answers[q.id], q.options[0] || 'python', q.correctAnswer)}
                    disabled={executionResults[q.id]?.isLoading}
                    style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                  >
                    {executionResults[q.id]?.isLoading ? 'Running...' : '▶ Run Code'}
                  </button>
                </div>
                <Editor
                  height="300px"
                  defaultLanguage={q.options[0] || 'python'}
                  defaultValue=""
                  value={answers[q.id] || ''}
                  onChange={(value) => handleAnswer(q.id, value || '')}
                  theme="light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false
                  }}
                />
              </div>
              {/* Console Output */}
              <div style={{
                marginTop: '0.5rem',
                background: '#1e293b',
                color: executionResults[q.id]?.status === 'success' ? '#4ade80' : executionResults[q.id]?.status === 'failure' ? '#f87171' : '#cbd5e1',
                padding: '1rem',
                borderRadius: '8px',
                fontFamily: 'monospace',
                minHeight: '60px',
                whiteSpace: 'pre-wrap'
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.7 }}>Console Output:</div>
                {executionResults[q.id]?.output || 'Run code to see logic output...'}
              </div>
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

        <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>Answer is saved automatically. Waiting for host...</p>
      </div>
    );
  }

  // 3. Exam Interface
  return (
    <div className={styles.layoutContainer}>
      {/* Hidden Overlay Camera for Monitoring */}
      {permissionGranted && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, pointerEvents: 'none' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '120px', borderRadius: '8px', border: '2px solid #ef4444', opacity: 0.8 }} />
          <div style={{ background: 'red', color: 'white', padding: '2px 8px', borderRadius: '4px', position: 'absolute', top: '5px', left: '5px', fontSize: '10px', fontWeight: 'bold' }}>REC</div>
        </div>
      )}

      {/* MAIN CONTENT: Scrollable List ... (Same as original) */}
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
              <div className={styles.prompt}>
                <Latex>{q.prompt}</Latex>
              </div>

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
                      <span className={styles.optionText}><Latex>{opt}</Latex></span>
                    </label>
                  ))}
                </div>
              ) : q.type === 'code' ? (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#64748b' }}>{q.options[0]?.toUpperCase() || 'PYTHON'}</span>
                      <button
                        onClick={() => runCode(q.id, answers[q.id], q.options[0] || 'python', q.correctAnswer)}
                        disabled={executionResults[q.id]?.isLoading}
                        style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                      >
                        {executionResults[q.id]?.isLoading ? 'Running...' : '▶ Run Code'}
                      </button>
                    </div>
                    <Editor
                      height="300px"
                      defaultLanguage={q.options[0] || 'python'}
                      defaultValue=""
                      value={answers[q.id] || ''}
                      onChange={(value) => handleAnswer(q.id, value || '')}
                      theme="light"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false
                      }}
                    />
                  </div>
                  {/* Console Output */}
                  <div style={{
                    marginTop: '0.5rem',
                    background: '#1e293b',
                    color: executionResults[q.id]?.status === 'success' ? '#4ade80' : executionResults[q.id]?.status === 'failure' ? '#f87171' : '#cbd5e1',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    minHeight: '60px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.7 }}>Console Output:</div>
                    {executionResults[q.id]?.output || 'Run code to see logic output...'}
                  </div>
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
