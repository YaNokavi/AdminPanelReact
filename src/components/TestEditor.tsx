import { useState, useEffect, useRef } from "react";

// Формат файла теста на GitHub:
// { "question": "...", "options": ["A", "B", "C", "D"], "answer": ["A"] }
export interface TestData {
  question: string;
  options: string[];
  answer: string[];
}

interface Props {
  data: TestData;
  onChange: (data: TestData) => void;
}

const emptyTest = (): TestData => ({
  question: "",
  options: ["", "", "", ""],
  answer: [],
});

export default function TestEditor({ data, onChange }: Props) {
  const [test, setTest] = useState<TestData>(
    data.question !== undefined ? data : emptyTest()
  );

  // Флаг: пропускаем первый вызов onChange при маунте,
  // чтобы не ставить dirty до реального редактирования
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    onChange(test);
  }, [test]); // eslint-disable-line

  const setQuestion = (value: string) =>
    setTest((prev) => ({ ...prev, question: value }));

  const setOption = (index: number, value: string) =>
    setTest((prev) => {
      const options = prev.options.map((o, i) => (i === index ? value : o));
      // Если этот вариант был правильным — обновить answer
      const answer = prev.answer.map((a) =>
        a === prev.options[index] ? value : a
      );
      return { ...prev, options, answer };
    });

  const setCorrect = (optionValue: string) =>
    setTest((prev) => ({ ...prev, answer: [optionValue] }));

  const addOption = () =>
    setTest((prev) => ({ ...prev, options: [...prev.options, ""] }));

  const removeOption = (index: number) =>
    setTest((prev) => {
      const removed = prev.options[index];
      const options = prev.options.filter((_, i) => i !== index);
      const answer = prev.answer.filter((a) => a !== removed);
      return { ...prev, options, answer };
    });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Question */}
      <div>
        <label className="block text-sm font-semibold text-text-heading mb-2">
          Вопрос
        </label>
        <textarea
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
          placeholder="Текст вопроса..."
          value={test.question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-semibold text-text-heading mb-2">
          Варианты ответа
          <span className="ml-2 text-xs text-text-muted font-normal">(выберите правильный)</span>
        </label>
        <div className="space-y-2">
          {test.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-answer"
                checked={test.answer[0] === opt && opt !== ""}
                onChange={() => opt && setCorrect(opt)}
                className="accent-primary flex-shrink-0"
                title="Правильный ответ"
              />
              <input
                type="text"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={`Вариант ${i + 1}`}
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
              />
              {test.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
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
          onClick={addOption}
          className="mt-3 text-xs text-primary hover:text-primary-hover transition"
        >
          + Добавить вариант
        </button>
      </div>

      {/* Correct answer preview */}
      {test.answer[0] && (
        <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          ✓ Правильный ответ: <span className="font-medium">{test.answer[0]}</span>
        </div>
      )}
    </div>
  );
}
