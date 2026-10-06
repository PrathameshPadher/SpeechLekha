import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Mic,
  Sparkles,
  Award,
  Layers
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';

export const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  const quizQuestions = [
    {
      id: 1,
      question: 'What is the primary enzyme responsible for initial CO2 capture in C4 mesophyll cells?',
      options: [
        'Rubisco (Ribulose-1,5-bisphosphate carboxylase)',
        'PEP Carboxylase (Phosphoenolpyruvate carboxylase)',
        'ATP Synthase',
        'Cytochrome b6f complex'
      ],
      correctIndex: 1,
      explanation: 'PEP carboxylase has zero affinity for oxygen (O2) and rapidly fixes bicarbonate into 4-carbon oxaloacetate without photorespiration.'
    },
    {
      id: 2,
      question: 'Where do the light-dependent reactions of photosynthesis take place inside the chloroplast?',
      options: [
        'Chloroplast Stroma',
        'Thylakoid Membrane & Lumen',
        'Outer Chloroplast Membrane',
        'Mitochondrial Matrix'
      ],
      correctIndex: 1,
      explanation: 'Chlorophyll pigments and electron transport carrier complexes (PSII, Cyt b6f, PSI) are embedded within the thylakoid lipid bilayer.'
    },
    {
      id: 3,
      question: 'Why does photorespiration lead to energetic inefficiency in C3 plants under high heat?',
      options: [
        'It disables water photolysis permanently',
        'Rubisco binds O2 instead of CO2, consuming ATP to recycle toxic 2-phosphoglycolate',
        'It destroys chlorophyll a pigments',
        'It stops ATP Synthase rotary motion'
      ],
      correctIndex: 1,
      explanation: 'When stomata close during heat/drought, O2 concentrations rise, causing Rubisco’s oxygenase reaction to consume 25–40% of captured solar energy.'
    },
    {
      id: 4,
      question: 'What special leaf anatomy allows C4 plants to physically insulate Rubisco in bundle-sheath cells?',
      options: [
        'Crassulacean Acid Stomata',
        'Kranz Anatomy',
        'Xylem Parenchyma',
        'Palisade Guard Shell'
      ],
      correctIndex: 1,
      explanation: 'Kranz anatomy (from the German word for "wreath") arranges radial bundle sheath cells tightly around vascular bundles to isolate Rubisco.'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredState, setAnsweredState] = useState<boolean>(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = quizQuestions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (answeredState) return;
    setSelectedOption(idx);
    setAnsweredState(true);
    if (idx === currentQ.correctIndex) {
      setScore((s) => s + 1);
      addToast('Correct Answer!', 'Great scientific mastery.', 'success');
    } else {
      addToast('Incorrect', 'Review the explanation below.', 'warning');
    }
  };

  const handleNext = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setAnsweredState(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnsweredState(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="workspace">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <main className="main quiz-page-main">
        <TopHeader
          breadcrumbs={['KNOWLEDGE VAULT', 'KNOWLEDGE QUIZ', 'BIOLOGY']}
          title="Active Recall Quiz"
        />

        <div className="quiz-page-container">
          {isFinished ? (
            /* QUIZ FINISHED RESULTS SCREEN */
            <div className="quiz-finished-card">
              <div className="award-icon-wrap">
                <Award size={48} className="award-icon" />
              </div>

              <span className="eyebrow-tag">KNOWLEDGE RECALL COMPLETE</span>
              <h2>Quiz Completed!</h2>

              <div className="score-display-box">
                <span className="score-num">{score} / {quizQuestions.length}</span>
                <span className="score-percent">{Math.round((score / quizQuestions.length) * 100)}% Accuracy</span>
              </div>

              <p className="score-summary-text">
                {score === quizQuestions.length
                  ? 'Flawless recall! You have mastered Photosynthesis, C3 vs C4 pathways, and bioenergetics.'
                  : 'Well done! Review the key concepts in your document to reinforce carbon fixation pathways.'}
              </p>

              <div className="quiz-finished-actions">
                <button className="primary-action-btn" onClick={() => navigate('/document/01-photosynthesis')}>
                  <BookOpen size={16} />
                  <span>Back to Knowledge Note</span>
                </button>

                <button className="secondary-action-btn" onClick={handleRestart}>
                  <RotateCcw size={15} />
                  <span>Retake Quiz</span>
                </button>

                <button className="ghost-action-btn" onClick={() => navigate('/speak')}>
                  <Mic size={15} />
                  <span>Record Next Topic</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUESTION CARD */
            <div className="quiz-question-card">
              {/* PROGRESS BAR */}
              <div className="quiz-progress-row">
                <span className="progress-label">
                  Question <strong>{currentIndex + 1}</strong> of {quizQuestions.length}
                </span>
                <span className="topic-badge">Bioenergetics & Photosynthesis</span>
              </div>

              <div className="quiz-progress-bar-wrap">
                <div
                  className="quiz-progress-bar-fill"
                  style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>

              {/* QUESTION TEXT */}
              <h2 className="quiz-question-text">{currentQ.question}</h2>

              {/* 4 ANSWER OPTIONS */}
              <div className="quiz-options-list">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionClass = 'quiz-option-btn';
                  if (answeredState) {
                    if (isCorrect) optionClass += ' correct';
                    else if (isSelected && !isCorrect) optionClass += ' incorrect';
                  } else if (isSelected) {
                    optionClass += ' selected';
                  }

                  return (
                    <button
                      key={idx}
                      className={optionClass}
                      onClick={() => handleSelectOption(idx)}
                      disabled={answeredState}
                    >
                      <span className="option-letter">{['A', 'B', 'C', 'D'][idx]}</span>
                      <span className="option-text">{option}</span>
                      {answeredState && isCorrect && <CheckCircle2 size={18} className="res-icon correct" />}
                      {answeredState && isSelected && !isCorrect && <XCircle size={18} className="res-icon incorrect" />}
                    </button>
                  );
                })}
              </div>

              {/* EXPLANATION AFTER ANSWERING */}
              {answeredState && (
                <div className="quiz-explanation-box">
                  <div className="explanation-header">
                    <Sparkles size={14} />
                    <span>Scientific Context</span>
                  </div>
                  <p>{currentQ.explanation}</p>

                  <button className="next-question-btn" onClick={handleNext}>
                    <span>{currentIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Results'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
