import { useState, type FormEvent } from 'react';
import { getInterviewQuestions, type InterviewQuestion } from './api/interviews.js';

interface InterviewSession {
  track: string;
  level: string;
  questions: InterviewQuestion[];
  answers: string[];
  currentIndex: number;
}

interface WelcomeScreenProps {
  track: string;
  level: string;
  onTrackChange: (track: string) => void;
  onLevelChange: (level: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isStarting: boolean;
  startError: string;
}

interface InterviewScreenProps {
  session: InterviewSession;
  onAnswerChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPrevious: () => void;
  onHome: () => void;
}

interface ResultsScreenProps {
  session: InterviewSession;
  onHome: () => void;
}

const tracks = [
  {
    value: 'Frontend',
    icon: '◈',
    description: 'JavaScript, React, DOM и браузерные API.',
    meta: '30 вопросов · Junior → Middle',
  },
  {
    value: 'Backend',
    icon: '⌘',
    description: 'API, базы данных, архитектура и безопасность.',
    meta: '60 вопросов · Junior → Middle',
  },
  {
    value: 'Fullstack',
    icon: '▣',
    description: 'Системное мышление от интерфейса до базы данных.',
    meta: '60 вопросов · Junior → Middle',
  },
];

const levels = ['Junior', 'Junior+', 'Middle'];

export default function App() {
  const [track, setTrack] = useState('Frontend');
  const [level, setLevel] = useState('Junior');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');

  async function startInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsStarting(true);
    setStartError('');

    try {
      const questionSet = await getInterviewQuestions(track, level);
      setSession({
        track: questionSet.track,
        level: questionSet.level,
        questions: questionSet.questions,
        answers: questionSet.questions.map(() => ''),
        currentIndex: 0,
      });
    } catch {
      setStartError('Не удалось загрузить вопросы. Проверьте подключение и попробуйте ещё раз.');
    } finally {
      setIsStarting(false);
    }
  }

  function saveCurrentAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const answerValue = new FormData(event.currentTarget).get('answer');
    if (typeof answerValue !== 'string') return;
    const answer = answerValue.trim();
    if (!answer) return;

    setSession((currentSession) => {
      if (!currentSession) return currentSession;
      const answers = [...currentSession.answers];
      answers[currentSession.currentIndex] = answer;

      return {
        ...currentSession,
        answers,
        currentIndex: currentSession.currentIndex + 1,
      };
    });
  }

  function updateCurrentAnswer(value: string) {
    setSession((currentSession) => {
      if (!currentSession) return currentSession;
      const answers = [...currentSession.answers];
      answers[currentSession.currentIndex] = value;
      return { ...currentSession, answers };
    });
  }

  function goToPreviousQuestion() {
    setSession((currentSession) => currentSession
      ? { ...currentSession, currentIndex: Math.max(0, currentSession.currentIndex - 1) }
      : currentSession);
  }

  function returnToWelcome() {
    setSession(null);
  }

  return (
    <div className="page__container">
      <header className="site-header">
        <a className="site-header__brand" href="./index.html" aria-label="SkillForge — главная">
          <span className="site-header__logo" aria-hidden="true">S</span>
          <span>SkillForge</span>
        </a>
        <button className="site-header__progress" type="button" disabled>
          Мой прогресс <span aria-hidden="true">→</span>
        </button>
      </header>

      <main className="welcome">
        {!session && (
          <WelcomeScreen
            track={track}
            level={level}
            onTrackChange={setTrack}
            onLevelChange={setLevel}
            onSubmit={startInterview}
            isStarting={isStarting}
            startError={startError}
          />
        )}
        {session && session.currentIndex < session.questions.length && (
          <InterviewScreen
            session={session}
            onAnswerChange={updateCurrentAnswer}
            onSubmit={saveCurrentAnswer}
            onPrevious={goToPreviousQuestion}
            onHome={returnToWelcome}
          />
        )}
        {session && session.currentIndex === session.questions.length && (
          <ResultsScreen session={session} onHome={returnToWelcome} />
        )}
      </main>
    </div>
  );
}

function WelcomeScreen({
  track,
  level,
  onTrackChange,
  onLevelChange,
  onSubmit,
  isStarting,
  startError,
}: WelcomeScreenProps) {
  return (
    <>
      <section className="welcome__intro" aria-labelledby="welcome-title">
        <p className="welcome__eyebrow">Адаптивные технические интервью</p>
        <h1 className="welcome__title" id="welcome-title">Проверь знания. Пойми свой уровень.</h1>
        <p className="welcome__lead">
          Тренируйся проходить технические собеседования, отвечай на вопросы и получай понятный план развития.
        </p>
      </section>

      <form className="interview-setup" onSubmit={onSubmit}>
        <fieldset className="interview-setup__tracks">
          <legend className="interview-setup__legend">Выбери направление</legend>
          <div className="interview-setup__grid">
            {tracks.map((item) => (
              <label className="track-card" key={item.value}>
                <input
                  className="track-card__input"
                  type="radio"
                  name="track"
                  value={item.value}
                  checked={track === item.value}
                  onChange={() => onTrackChange(item.value)}
                />
                <span className="track-card__content">
                  <span className="track-card__icon" aria-hidden="true">{item.icon}</span>
                  <span className="track-card__title">{item.value}</span>
                  <span className="track-card__description">{item.description}</span>
                  <span className="track-card__meta">{item.meta}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="interview-setup__options">
          <label className="interview-setup__label" htmlFor="level">Уровень сложности</label>
          <select
            className="interview-setup__select"
            id="level"
            value={level}
            onChange={(event) => onLevelChange(event.target.value)}
          >
            {levels.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="interview-setup__submit" type="submit" disabled={isStarting}>
            {isStarting ? 'Загружаем вопросы…' : 'Начать интервью'}
            {!isStarting && <span aria-hidden="true">→</span>}
          </button>
        </div>
        {startError && <p className="interview-setup__status" role="alert">{startError}</p>}
      </form>
    </>
  );
}

function InterviewScreen({ session, onAnswerChange, onSubmit, onPrevious, onHome }: InterviewScreenProps) {
  const { currentIndex, questions, answers, track, level } = session;
  const question = questions[currentIndex];
  const questionNumber = currentIndex + 1;

  return (
    <section className="interview" aria-labelledby="interview-title">
      <button className="interview__back" type="button" onClick={onHome}>← К направлениям</button>
      <div className="interview__header">
        <p className="interview__eyebrow">{track} · {level}</p>
        <p className="interview__counter">Вопрос {questionNumber} из {questions.length}</p>
      </div>
      <progress
        className="interview__progress"
        value={questionNumber}
        max={questions.length}
        aria-label="Прогресс интервью"
      />
      <form className="interview__form" onSubmit={onSubmit}>
        <p className="interview__topic">{question.topic}</p>
        <h1 className="interview__title" id="interview-title">{question.prompt}</h1>
        <label className="interview__label" htmlFor="answer">Твой ответ</label>
        <textarea
          className="interview__answer"
          id="answer"
          name="answer"
          rows={7}
          placeholder="Напиши ответ своими словами…"
          value={answers[currentIndex]}
          onChange={(event) => onAnswerChange(event.target.value)}
          required
        />
        <div className="interview__actions">
          <button
            className="interview__previous"
            type="button"
            onClick={onPrevious}
            disabled={currentIndex === 0}
          >
            Назад
          </button>
          <button className="interview__next" type="submit">
            {questionNumber === questions.length ? 'Завершить интервью' : 'Следующий вопрос'}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </section>
  );
}

function ResultsScreen({ session, onHome }: ResultsScreenProps) {
  return (
    <section className="interview-result" aria-labelledby="result-title">
      <p className="interview-result__eyebrow">{session.track} · {session.level}</p>
      <h1 className="interview-result__title" id="result-title">Интервью завершено</h1>
      <p className="interview-result__lead">
        Ты ответил на {session.questions.length} вопроса. Посмотри на ответы и отметь темы, которые стоит повторить.
      </p>
      <div className="interview-result__answers" role="region" aria-label="Твои ответы">
        {session.questions.map((question, index) => (
          <article className="answer-card" key={question.topic}>
            <p className="answer-card__topic">{question.topic}</p>
            <h2 className="answer-card__question">{question.prompt}</h2>
            <p className="answer-card__text">{session.answers[index]}</p>
          </article>
        ))}
      </div>
      <button className="interview-result__home" type="button" onClick={onHome}>
        Вернуться к направлениям
      </button>
    </section>
  );
}
