import { useState } from "react";
import { Link } from "react-router-dom";

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Явно типизируем индекс как число
  const toggleFaq = (index: number): void => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      q: "Что такое CunaEdu?",
      a: "CunaEdu — это учебная платформа. Данная админ-панель предназначена для управления образовательным контентом: создания курсов, модулей, уроков и тестов.",
    },
    {
      q: "Для кого предназначена эта панель?",
      a: "Панель разработана специально для администраторов платформы, преподавателей и авторов курсов, которые наполняют образовательную среду.",
    },
    {
      q: "Где хранится содержимое курсов?",
      a: "В текущей версии все данные (структура курсов, список модулей и уроков) хранятся локально в браузере (Local Storage). При очистке кэша браузера или использовании режима инкогнито данные не сохранятся.",
    },
    {
      q: "Как создать новый курс?",
      a: "На Главной странице нажмите кнопку «Добавить курс». В появившемся окне заполните базовую информацию о курсе: название, описание, загрузите обложку и выберите категорию.",
    },
    {
      q: "Можно ли редактировать уже созданные курсы?",
      a: "Да, на карточке каждого курса есть кнопка «Редактировать» (иконка карандаша). Вы можете изменить любую информацию, а также добавить новые модули и уроки.",
    },
    {
      q: "Какие типы уроков поддерживаются?",
      // JSX отлично подходит под тип ReactNode
      a: (
        <>
          В данный момент поддерживаются два типа уроков:
          <ol className="list-decimal list-inside mt-2 ml-2 space-y-1">
            <li>
              Теория — текстовые материалы с возможностью прикрепления
              изображений.
            </li>
            <li>
              Тест — проверочные задания с выбором одного или нескольких
              правиных вариантов ответа.
            </li>
          </ol>
        </>
      ),
    },
    {
      q: "Как опубликовать курс?",
      a: "На данный момент функционал публикации находится в разработке. Все созданные курсы сохраняются локально как черновики.",
    },
  ];

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto ">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-heading text-center mb-2">
        Часто задаваемые вопросы
      </h1>
      <p className="text-text-muted text-center mb-10">
        Ответы на популярные вопросы об админ-панели CunaEdu
      </p>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className="bg-white border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset transition"
              >
                <span className="font-medium text-text-heading">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div className={`px-6 pb-5 ${isOpen ? "block" : "hidden"}`}>
                <div className="text-text-muted text-sm leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-blue-50 border border-blue-100 rounded-xl text-center">
        <h3 className="text-lg font-bold text-text-heading mb-2">
          Не нашли ответ на свой вопрос?
        </h3>
        <p className="text-text-muted text-sm mb-4">
          Свяжитесь с нами, и мы с радостью поможем вам разобраться с
          функционалом панели.
        </p>
        <Link
          to="/contacts"
          className="inline-block bg-primary hover:bg-primary-hover text-white font-medium px-6 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Написать в поддержку
        </Link>
      </div>
    </div>
  );
}
