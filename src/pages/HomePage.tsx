import { useState } from "react";
import FileItem, { type FileNode } from "../components/FileItem";

export default function HomePage() {
  const [files, setFiles] = useState<FileNode[]>([
    { id: 1, name: "Курс по React", type: "directory" },
    { id: 2, name: "Основы JS", type: "directory" },
    { id: 3, name: "index.md", type: "file" },
  ]);

  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(["Главная"]);

  const handleCreateFile = (): void => {
    const name = prompt("Введите имя файла:");
    if (name) setFiles([...files, { id: Date.now(), name, type: "file" }]);
  };

  const handleCreateDirectory = (): void => {
    const name = prompt("Введите имя директории:");
    if (name) setFiles([...files, { id: Date.now(), name, type: "directory" }]);
  };

  const handleOpen = (item: FileNode): void => {
    if (item.type === "directory") {
      setBreadcrumbs([...breadcrumbs, item.name]);
      setFiles([]);
    } else {
      alert(`Открытие файла: ${item.name}`);
    }
  };

  const handleRename = (item: FileNode): void => {
    const newName = prompt("Новое имя:", item.name);
    if (newName) {
      setFiles(
        files.map((f) => (f.id === item.id ? { ...f, name: newName } : f)),
      );
    }
  };

  const handleDelete = (item: FileNode): void => {
    if (window.confirm(`Вы уверены, что хотите удалить ${item.name}?`)) {
      setFiles(files.filter((f) => f.id !== item.id));
    }
  };

  const navigateBack = (): void => {
    if (breadcrumbs.length > 1) {
      setBreadcrumbs(breadcrumbs.slice(0, -1));
      setFiles([
        { id: 1, name: "Курс по React", type: "directory" },
        { id: 2, name: "Основы JS", type: "directory" },
        { id: 3, name: "index.md", type: "file" },
      ]);
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto ">
      {/* Hero-секция с заголовком и кнопкой создания курса */}
      <section className="bg-white rounded-xl shadow-sm border border-border p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-heading mb-2">
              Управление курсами
            </h1>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">
              Создавайте учебные материалы, редактируйте контент и генерируйте
              миграции для внедрения курсов в приложение.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
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
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              Создать курс
            </button>
          </div>
        </div>
      </section>

      {/* Секция с информационными карточками */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {/* Иерархия */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-heading">Иерархия</p>
            <p className="text-xs text-text-muted mt-1">
              Курс → Модуль → Подмодуль → Шаг
            </p>
          </div>
        </div>

        {/* Git-хранение */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-green-600"
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
            <p className="text-sm font-semibold text-text-heading">
              Git-хранение
            </p>
            <p className="text-xs text-text-muted mt-1">
              Контент версионируется в GitHub
            </p>
          </div>
        </div>

        {/* Миграции */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m-4-3.122V11m-5.828 3.031l.034.024m4.55-4.004l-.034.024m-4.55 4.004v-.001m4.55-4.004v-.001"
              ></path>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-heading">Миграции</p>
            <p className="text-xs text-text-muted mt-1">
              Автогенерация SQL для основной БД
            </p>
          </div>
        </div>
      </section>

      {/* Секция файловой системы (Drop-zone + Список) */}
      <section className="bg-white rounded-xl shadow-sm border border-border p-6 mb-6">
        {/* Drop zone из оригинала */}
        <div className="border-2 border-dashed border-gray-300 hover:border-primary rounded-lg p-6 text-center text-text-muted text-sm cursor-pointer transition mb-5 hover:bg-blue-50/30">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
          Перетащите изображение сюда или нажмите для выбора файла
          <input accept="image/*" className="hidden" type="file" />
        </div>

        {/* Кнопки создания файлов из оригинала */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={handleCreateFile}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            Создать файл
          </button>
          <button
            onClick={handleCreateDirectory}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              ></path>
            </svg>
            Создать директорию
          </button>
        </div>

        {/* Хлебные крошки */}
        <div className="text-sm text-text-muted mb-3 flex items-center gap-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              <span
                className={`cursor-pointer ${index === breadcrumbs.length - 1 ? "font-medium text-text-heading" : "hover:text-primary"}`}
                onClick={() => index < breadcrumbs.length - 1 && navigateBack()}
              >
                {crumb}
              </span>
            </span>
          ))}
        </div>

        {/* Список файлов (интеграция твоего FileItem) */}
        <div className="text-xs font-semibold text-text-light uppercase tracking-wide mb-2">
          Содержимое
        </div>
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg">
            Папка пуста
          </div>
        ) : (
          <ul className="space-y-1.5">
            {files.map((item) => (
              <FileItem
                key={item.id}
                item={item}
                onOpen={handleOpen}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Кнопка генерации миграции (плавающая) */}
      <button className="fixed bottom-[60px] right-[15px] bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 z-40">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
          ></path>
        </svg>
        Сгенерировать миграцию
      </button>
    </div>
  );
}

// {/* Секция статистики */}
//       <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
//         <div className="bg-white rounded-xl shadow-sm border border-border p-5 flex items-start gap-4">
//           <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
//             <svg
//               className="w-5 h-5 text-primary"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
//               ></path>
//             </svg>
//           </div>
//           <div>
//             <p className="text-sm font-medium text-text-muted mb-1">
//               Всего курсов
//             </p>
//             <p className="text-2xl font-bold text-text-heading">
//               {courses.length}
//             </p>
//           </div>
//         </div>

//         {/* Карточка 2: Объем данных */}
//         <div className="bg-white rounded-xl shadow-sm border border-border p-5 flex items-start gap-4">
//           <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
//             <svg
//               className="w-5 h-5 text-green-600"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m-4-3.122V11m-5.828 3.031l.034.024m4.55-4.004l-.034.024m-4.55 4.004v-.001m4.55-4.004v-.001"
//               ></path>
//             </svg>
//           </div>
//           <div>
//             <p className="text-sm font-medium text-text-muted mb-1">
//               Общий объем
//             </p>
//             <p className="text-2xl font-bold text-text-heading">0.0 МБ</p>
//           </div>
//         </div>

//         {/* Карточка 3: Последнее обновление */}
//         <div className="bg-white rounded-xl shadow-sm border border-border p-5 flex items-start gap-4">
//           <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
//             <svg
//               className="w-5 h-5 text-purple-600"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//               ></path>
//             </svg>
//           </div>
//           <div>
//             <p className="text-sm font-medium text-text-muted mb-1">
//               Обновлено
//             </p>
//             <p className="text-2xl font-bold text-text-heading">Только что</p>
//           </div>
//         </div>
//       </section>
