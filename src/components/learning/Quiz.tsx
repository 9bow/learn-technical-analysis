import { useState } from 'react';

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface QuizProps {
  section: string;
  title?: string;
}

export default function Quiz({ section, title }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const loadQuiz = async () => {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}data/quiz/${section}.json`);
      if (!res.ok) throw new Error('Failed to load');
      const data: Question[] = await res.json();
      setQuestions(data);
      setLoaded(true);
    } catch {
      setError(true);
    }
  };

  if (error) {
    return <p style={{ color: 'var(--sl-color-text-accent)', padding: '1rem' }}>퀴즈를 불러올 수 없습니다.</p>;
  }

  if (!loaded) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid var(--sl-color-gray-5)', borderRadius: '8px', margin: '1.5rem 0' }}>
        <p style={{ marginBottom: '1rem', fontWeight: 600 }}>{title || '섹션 퀴즈'}</p>
        <button
          onClick={loadQuiz}
          style={{
            padding: '0.6rem 1.5rem',
            backgroundColor: 'var(--sl-color-accent)',
            color: 'var(--sl-color-accent-contrast, #fff)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          퀴즈 시작하기
        </button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const q = questions[current];
  const isFinished = current >= questions.length;

  if (isFinished) {
    return (
      <div style={{ padding: '2rem', border: '1px solid var(--sl-color-gray-5)', borderRadius: '8px', margin: '1.5rem 0', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>퀴즈 완료!</h3>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          {score} / {questions.length} 정답
        </p>
        <p style={{ marginBottom: '1rem', color: 'var(--sl-color-gray-3)' }}>
          {score === questions.length ? '완벽합니다!' : score >= questions.length * 0.6 ? '잘 하셨습니다!' : '복습이 필요합니다.'}
        </p>
        <button
          onClick={() => { setCurrent(0); setScore(0); setSelected(null); setShowResult(false); }}
          style={{
            padding: '0.5rem 1.2rem',
            backgroundColor: 'var(--sl-color-gray-6)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          다시 풀기
        </button>
      </div>
    );
  }

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    if (selected === q.answer) {
      setScore((s) => s + 1);
    }
    setShowResult(true);
  };

  const handleNext = () => {
    setCurrent((c) => c + 1);
    setSelected(null);
    setShowResult(false);
  };

  return (
    <div style={{ padding: '1.5rem', border: '1px solid var(--sl-color-gray-5)', borderRadius: '8px', margin: '1.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--sl-color-gray-3)', fontSize: '0.875rem' }}>
        <span>{title || '퀴즈'}</span>
        <span>{current + 1} / {questions.length}</span>
      </div>
      <p style={{ fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>{q.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {q.options.map((opt, idx) => {
          let bg = 'var(--sl-color-gray-6)';
          let border = '1px solid var(--sl-color-gray-5)';
          if (showResult && idx === q.answer) {
            bg = 'rgba(34, 197, 94, 0.15)';
            border = '2px solid rgb(34, 197, 94)';
          } else if (showResult && idx === selected && idx !== q.answer) {
            bg = 'rgba(239, 68, 68, 0.15)';
            border = '2px solid rgb(239, 68, 68)';
          } else if (!showResult && idx === selected) {
            bg = 'rgba(59, 130, 246, 0.15)';
            border = '2px solid var(--sl-color-accent)';
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              style={{
                padding: '0.7rem 1rem',
                backgroundColor: bg,
                border,
                borderRadius: '6px',
                cursor: showResult ? 'default' : 'pointer',
                textAlign: 'left',
                fontSize: '0.95rem',
                lineHeight: 1.4,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {showResult && (
        <p style={{ padding: '0.75rem', backgroundColor: 'var(--sl-color-gray-6)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {q.explanation}
        </p>
      )}
      <div style={{ textAlign: 'right' }}>
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            style={{
              padding: '0.5rem 1.2rem',
              backgroundColor: selected !== null ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-5)',
              color: selected !== null ? 'var(--sl-color-accent-contrast, #fff)' : 'var(--sl-color-gray-3)',
              border: 'none',
              borderRadius: '6px',
              cursor: selected !== null ? 'pointer' : 'not-allowed',
            }}
          >
            확인
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              padding: '0.5rem 1.2rem',
              backgroundColor: 'var(--sl-color-accent)',
              color: 'var(--sl-color-accent-contrast, #fff)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {current + 1 < questions.length ? '다음' : '결과 보기'}
          </button>
        )}
      </div>
    </div>
  );
}
