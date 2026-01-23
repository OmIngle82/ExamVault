'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext';
import styles from './create.module.css';

type Question = {
  type: 'text' | 'mcq';
  prompt: string;
  options: string[];
  correctAnswer: string;
};

export default function CreateTestPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    startTime: '',
    endTime: '',
    communityId: '' as string | number,
    proctoringSettings: {
      enable_webcam: false,
      enable_audio: false,
      enable_fullscreen: true,
      tab_lock: true
    }
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/communities')
      .then(async res => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('API returned non-JSON:', text.slice(0, 100)); // Log for debugging
          throw new Error('Invalid JSON response');
        }
      })
      .then(data => {
        if (data.communities) setCommunities(data.communities)
      })
      .catch(err => {
        console.error(err);
        addToast('Failed to load communities', 'error');
      });
  }, [addToast]);

  const addQuestion = (type: 'text' | 'mcq') => {
    setQuestions([...questions, { type, prompt: '', options: type === 'mcq' ? ['', '', '', ''] : [], correctAnswer: '' }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (formData.startTime && formData.endTime) {
      if (new Date(formData.startTime) >= new Date(formData.endTime)) {
        addToast('End Time must be after Start Time', 'warning');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Filter out empty options
      const payload = {
        ...formData,
        questions: questions.map(q => {
          if (q.type === 'mcq') {
            return { ...q, options: q.options.filter(o => o.trim() !== '') };
          }
          return q;
        })
      };

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create');
      }

      addToast('Test Created Successfully!', 'success');
      router.push('/admin');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error creating test', 'error');
      setIsSubmitting(false);
    }
  };

  // AI Generation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuestions = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, count: 5 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQuestions([...questions, ...data.questions]);
      addToast(`Generated ${data.questions.length} questions!`, 'success');
      setShowAiModal(false);
      setAiTopic('');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Create New Test</h1>

      {/* AI Modal */}
      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0 }}>✨ AI Generator</h2>
            <p>Enter a topic, and we'll creates 5 questions for you.</p>

            <input
              autoFocus
              placeholder="e.g. History of Rome, Javascript Loops..."
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', border: '2px solid #ddd', borderRadius: '8px', marginBottom: '1rem', fontSize: '1rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                style={{ padding: '0.6rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateQuestions}
                disabled={isGenerating}
                style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isGenerating ? 'Generating...' : 'Generate Magic ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h2>Basic Info</h2>
          <label>
            Assign to Community
            <select
              value={formData.communityId}
              onChange={e => setFormData({ ...formData, communityId: e.target.value })}
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '1rem',
                marginTop: '0.5rem'
              }}
            >
              <option value="">Global (Public to all)</option>
              {communities.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </label>
          <label>
            Description
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </label>
          <label>
            Duration (minutes)
            <input required type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} />
          </label>
          <div className={styles.row}>
            <label>
              Start Time
              <input
                type="datetime-local"
                onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
            </label>
            <label>
              End Time
              <input
                type="datetime-local"
                onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Test Security 🛡️</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <input
                type="checkbox"
                checked={formData.proctoringSettings.enable_fullscreen}
                onChange={e => setFormData({ ...formData, proctoringSettings: { ...formData.proctoringSettings, enable_fullscreen: e.target.checked } })}
                style={{ width: '20px', height: '20px', accentColor: '#10B981' }} />
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>Force Full Screen</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Kick if user exits</span>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <input
                type="checkbox"
                checked={formData.proctoringSettings.tab_lock}
                onChange={e => setFormData({ ...formData, proctoringSettings: { ...formData.proctoringSettings, tab_lock: e.target.checked } })}
                style={{ width: '20px', height: '20px', accentColor: '#10B981' }} />
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>Tab Focus Lock</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Track tab switches</span>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <input
                type="checkbox"
                checked={formData.proctoringSettings.enable_webcam}
                onChange={e => setFormData({ ...formData, proctoringSettings: { ...formData.proctoringSettings, enable_webcam: e.target.checked } })}
                style={{ width: '20px', height: '20px', accentColor: '#DC2626' }} />
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>Webcam Mon.</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Snapshots every 30s</span>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <input
                type="checkbox"
                checked={formData.proctoringSettings.enable_audio}
                onChange={e => setFormData({ ...formData, proctoringSettings: { ...formData.proctoringSettings, enable_audio: e.target.checked } })}
                style={{ width: '20px', height: '20px', accentColor: '#DC2626' }} />
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>Audio Mon.</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Detect speaking</span>
              </div>
            </label>
          </div>
        </div><div className={styles.section}>
          <h2>Questions</h2>
          {questions.map((q, i) => (
            <div key={i} className={styles.questionCard}>
              <div className={styles.qHeader}>
                <span>Question {i + 1} ({q.type.toUpperCase()})</span>
                <button type="button" onClick={() => removeQuestion(i)} className={styles.deleteBtn}>Remove</button>
              </div>

              <input
                className={styles.promptInput}
                placeholder="Enter Question Prompt..."
                value={q.prompt}
                onChange={e => updateQuestion(i, 'prompt', e.target.value)}
                required />

              {q.type === 'mcq' && (
                <div className={styles.optionsGrid}>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="radio"
                        name={`correct_${i}`}
                        checked={q.correctAnswer === opt && opt !== ''}
                        onChange={() => updateQuestion(i, 'correctAnswer', opt)}
                        title="Mark as correct answer" />
                      <input
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={e => updateOption(i, oIndex, e.target.value)}
                        required />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                  Correct Answer:
                  {q.type === 'mcq' ? (
                    <span style={{ fontWeight: 'normal', marginLeft: '0.5rem', color: q.correctAnswer ? 'green' : 'red' }}>
                      {q.correctAnswer || 'Select an option above'}
                    </span>
                  ) : (
                    <input
                      className={styles.promptInput}
                      style={{ marginTop: '0.5rem' }}
                      placeholder="Enter the expected answer key..."
                      value={q.correctAnswer}
                      onChange={e => updateQuestion(i, 'correctAnswer', e.target.value)} />
                  )}
                </label>
              </div>
            </div>
          ))}

          <div className={styles.actions}>
            <button type="button" onClick={() => addQuestion('text')}>+ Add Text Question</button>
            <button type="button" onClick={() => addQuestion('mcq')}>+ Add MCQ Question</button>
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none' }}
            >
              ✨ AI Generate
            </button>
          </div>
        </div><button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
          {isSubmitting ? 'Creating...' : 'Create Test'}
        </button>
      </form >
    </div >
  );
}
