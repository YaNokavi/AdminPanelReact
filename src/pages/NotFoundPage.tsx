import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center w-full">
      <div className="text-center max-w-lg">
        <div className="relative inline-block mb-6">
          <span className="text-[10rem] sm:text-[12rem] font-extrabold text-gray-200 leading-none select-none">
            404
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-heading mb-3">
          Страница не найдена
        </h1>
        <p className="text-text-muted mb-8 leading-relaxed">
          Похоже, этот курс ещё не создан, или страница была перемещена.
          Попробуйте вернуться на главную или свяжитесь с нами.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
            На главную
          </Link>
          <Link
            to="/contacts"
            className="inline-flex items-center gap-2 bg-white border border-border hover:bg-gray-50 text-text-main font-medium px-6 py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            Связаться с нами
          </Link>
        </div>
        <p className="text-sm text-text-light">Или перейдите:</p>
        <nav className="mt-3 flex items-center justify-center gap-6 text-sm">
          <Link
            to="/"
            className="text-primary hover:text-primary-hover transition"
          >
            Главная
          </Link>
          <Link
            to="/faq"
            className="text-primary hover:text-primary-hover transition"
          >
            FAQ
          </Link>
          <Link
            to="/contacts"
            className="text-primary hover:text-primary-hover transition"
          >
            Контакты
          </Link>
        </nav>
      </div>
    </div>
  );
}
