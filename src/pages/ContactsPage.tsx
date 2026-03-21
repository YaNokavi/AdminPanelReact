import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";

// Типизация состояния данных формы
interface FormData {
  name: string;
  email: string;
  topic: string;
  message: string;
  consent: boolean;
}

// Типизация состояния ошибок формы (все поля могут быть строкой с текстом ошибки или undefined)
// Используем Partial, чтобы сделать все поля необязательными
type FormErrors = Partial<Record<keyof FormData, string | null>>;

export default function ContactsPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    topic: "",
    message: "",
    consent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Типизируем событие изменения (поддерживает input, select и textarea)
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void => {
    // Явно приводим type и checked, так как они есть только у HTMLInputElement
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Очищаем ошибку при вводе
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Типизируем событие отправки формы
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    let isValid = true;

    // Валидация имени
    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed) {
      newErrors.name = "Введите ваше имя";
      isValid = false;
    } else if (nameTrimmed.split(" ").filter((w) => w.length > 0).length < 2) {
      newErrors.name = "Введите имя и фамилию (минимум 2 слова)";
      isValid = false;
    }

    // Валидация email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Введите email";
      isValid = false;
    } else if (!emailPattern.test(formData.email.trim())) {
      newErrors.email = "Введите корректный email (например, example@mail.ru)";
      isValid = false;
    }

    // Валидация темы
    if (!formData.topic) {
      newErrors.topic = "Выберите тему обращения";
      isValid = false;
    }

    // Валидация сообщения
    if (!formData.message.trim()) {
      newErrors.message = "Введите текст сообщения";
      isValid = false;
    }

    // Валидация чекбокса
    if (!formData.consent) {
      newErrors.consent =
        "Необходимо согласие на обработку персональных данных";
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      console.log("Форма отправлена:", formData);
      setIsSuccess(true);
    }
  };

  // Типизируем параметр fieldName как ключ интерфейса FormData
  const inputClass = (fieldName: keyof FormData): string =>
    `w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
      errors[fieldName]
        ? "border-red-500 focus:border-red-500"
        : "border-gray-300 focus:border-transparent"
    }`;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-heading text-center mb-2">
        Свяжитесь с нами
      </h1>
      <p className="text-text-muted text-center mb-10">
        Есть вопрос или предложение? Напишите нам
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Блок формы */}
        <div className="bg-white border border-border rounded-xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-text-heading mb-5">
            Форма обратной связи
          </h2>

          {isSuccess ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
              ✓ Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее
              время.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-text-heading mb-1"
                  htmlFor="name"
                >
                  Имя
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass("name")}
                  placeholder="Ваше имя"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-text-heading mb-1"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass("email")}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-text-heading mb-1"
                  htmlFor="topic"
                >
                  Тема
                </label>
                <select
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className={`${inputClass("topic")} bg-white`}
                >
                  <option value="" disabled>
                    Выберите тему
                  </option>
                  <option value="Вопрос по функционалу">
                    Вопрос по функционалу
                  </option>
                  <option value="Предложение по улучшению">
                    Предложение по улучшению
                  </option>
                  <option value="Сообщение об ошибке">
                    Сообщение об ошибке
                  </option>
                  <option value="Сотрудничество">Сотрудничество</option>
                  <option value="Другое">Другое</option>
                </select>
                {errors.topic && (
                  <p className="text-red-500 text-xs mt-1">{errors.topic}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-text-heading mb-1"
                  htmlFor="message"
                >
                  Сообщение
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className={`${inputClass("message")} resize-y`}
                  placeholder="Ваше сообщение..."
                />
                {errors.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="consent"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    className={`mt-1 w-4 h-4 text-primary rounded focus:ring-primary ${errors.consent ? "border-red-500" : "border-gray-300"}`}
                  />
                  <label
                    className="text-sm text-text-muted leading-snug"
                    htmlFor="consent"
                  >
                    Соглашаюсь на обработку персональных данных
                  </label>
                </div>
                {errors.consent && (
                  <p className="text-red-500 text-xs mt-1">{errors.consent}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Отправить сообщение
              </button>
            </form>
          )}
        </div>

        {/* Информационный блок */}
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-text-heading mb-5">
              Контактная информация
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-heading">Email</p>
                  <a
                    className="text-sm text-primary hover:text-primary-hover transition"
                    href="mailto:cunaedu_support@mail.ru"
                  >
                    cunaedu_support@mail.ru
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-heading">
                    GitHub
                  </p>
                  <a
                    className="text-sm text-primary hover:text-primary-hover transition"
                    href="https://github.com/YaNokavi/AdminPanelReact"
                    target="_blank"
                    rel="noreferrer"
                  >
                    AdminPanelReact
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-text-heading mb-4">
              Быстрые ссылки
            </h2>
            <div className="space-y-2 flex flex-col">
              <Link
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition py-1"
                to="/faq"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Часто задаваемые вопросы (FAQ)
              </Link>
              <Link
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition py-1"
                to="/"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"
                  ></path>
                </svg>
                Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
