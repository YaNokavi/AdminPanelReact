import { useState, useEffect } from "react";

export interface TestQuestion {
  question: string;
  answers: string[];
  correctAnswer: number;
}

export interface TestData {
  questions: TestQuestion[];
}

interface Props {
  data: TestData;
  onChange: (data: TestData) => void;
}

const emptyQuestion = (): TestQuestion => ({
  question: "",
  answers: ["", "", "", ""],
  correctAnswer: 0,
});

export default function TestEditor({ data, onChange }: Props) {
  const [questions, setQuestions] = useState<TestQuestion[]>(
    data.questions?.length ? data.questions : [emptyQuestion()]
  );

  useEffect(() => {
    onChange({ questions });
  }, [questions]); // eslint-disable-line

  const updateQuestion = (qi: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, question: value } : q))
    );
  };

  const updateAnswer = (qi: number, ai: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? { ...q, answers: q.answers.map((a, j) => (j === ai ? value : a)) }
          : q
      )
    );
  };

  const setCorrect = (qi: number, ai: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, correctAnswer: ai } : q))
    );
  };

  const addAnswer = (qi: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, answers: [...q.answers, ""] } : q
      )
    );
  };

  const removeAnswer = (qi: number, ai: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const answers = q.answers.filter((_, j) => j !== ai);
        const correctAnswer =
          q.correctAnswer >= ai && q.correctAnswer > 0
            ? q.correctAnswer - 1
            : q.correctAnswer;
        return { ...q, answers, correctAnswer };
      })
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (qi: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== qi));

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <div key={qi} className="border border-border rounded-xl p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text-heading">Вопрос {qi + 1}</span>
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                className="text-xs text-red-500 hover:text-red-700 transition"
              >
                Удалить вопрос
              </button>
            )}
          </div>

          {/* Question text */}
          <textarea
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4 resize-none"
            rows={2}
            placeholder="Текст вопроса..."
            value={q.question}
            onChange={(e) => updateQuestion(qi, e.target.value)}
          />

          {/* Answers */}
          <div className="space-y-2">
            {q.answers.map((ans, ai) => (
              <div key={ai} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correctAnswer === ai}
                  onChange={() => setCorrect(qi, ai)}
                  className="accent-primary flex-shrink-0"
                  title="Правильный ответ"
                />
                <input
                  type="text"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={`Вариант ${ai + 1}`}
                  value={ans}
                  onChange={(e) => updateAnswer(qi, ai, e.target.value)}
                />
                {q.answers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeAnswer(qi, ai)}
                    className="text-red-400 hover:text-red-600 transition flex-shrink-0"
                    title="Удалить вариант"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addAnswer(qi)}
            className="mt-3 text-xs text-primary hover:text-primary-hover transition"
          >
            + Добавить вариант
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Добавить вопрос
      </button>
    </div>
  );
}
