# CunaEdu Admin Panel — Project Init Context

> Этот файл — быстрый контекст для нейросети. Прочитай его целиком перед тем как работать с проектом.

---

## Суть проекта

**CunaEdu Admin Panel** — внутренняя административная панель для образовательной платформы CunaEdu. Позволяет управлять учебным контентом: курсами, модулями, подмодулями и шагами. Контент (HTML-теория и JSON-тесты) хранится в GitHub-репозитории, метаданные — в PostgreSQL.

---

## Репозитории

| Репозиторий                                                             | Назначение                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| [YaNokavi/AdminPanelReact](https://github.com/YaNokavi/AdminPanelReact) | **Текущая версия** — React + TypeScript. В активной разработке |
| [YaNokavi/adminCunaedu](https://github.com/YaNokavi/adminCunaedu)       | **Старая версия** — ванильный JS. Эталон функционала           |
| [YaNokavi/CunaEduFile](https://github.com/YaNokavi/CunaEduFile)         | Git-хранилище контента файлов (HTML/JSON шагов, изображения)   |

---

## Архитектура

```
[React SPA] ──HTTP──> [Node.js / Express backend]
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
              [PostgreSQL]        [GitHub API]
             (метаданные)      (YaNokavi/CunaEduFile)
                                  контент шагов
```

- **Фронт** деплоится на GitHub Pages: `https://yanokavi.github.io/AdminPanelReact/`
- **Бэкенд** деплоится на Amvera: `https://admincuna-back-anderm.amvera.io`
- Бэкенд настраивается через `.env` (переменные: `PGUSER`, `PGHOST`, `PGDATABASE`, `PGPASSWORD`, `PGPORT`, `GITHUB_TOKEN`, `USERNAME`, `PASSWORD`)

---

## Иерархия данных

```
Course (курс)
  └── CourseModule (модуль)
        └── Submodule (подмодуль)
              └── SubmoduleStep (шаг)
                    ├── Тип: Теория (HTML-файл)
                    └── Тип: Тест (JSON-файл)
```

### Путь в GitHub (CunaEduFile)

```
courses/{courseId}/{moduleId}/{submoduleId}/{stepId}.txt
courses/{courseId}/{moduleId}/{submoduleId}/images/{filename}
```

`contentUrl` в БД хранит raw URL:
`https://raw.githubusercontent.com/YaNokavi/CunaEduFile/refs/heads/main/courses/{path}`

`submodulePath` на фронте = `"{courseId}/{moduleId}/{submoduleId}"` (строится из breadcrumbs).

---

## БД — таблицы PostgreSQL

> ⚠️ Реальные имена таблиц отличаются от того, что используется внутри `processQuery` в `server.js`. Всегда используй имена ниже в новых запросах.

| Таблица               | Ключевые поля                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `course`              | `id`, `name`, `author`, `description`, `rating`, `iconurl`                                  |
| `course_module`       | `id`, `name`, `courseid`                                                                     |
| `submodule`           | `id`, `name`, `moduleid`                                                                     |
| `submodule_step`      | `id`, `submoduleid`, `courseid`, `contenturl`, `istest`                                     |
| `migration.migration` | `id`, `courseid`, `moduleid`, `submoduleid`, `stepid`, `sql`, `action`, `version`, `islast` |

**FK-ограничение:** `submodule_step.courseid` → `course.id` (с именем `fk_submodule_step_course_id`). При удалении курса нужно сначала удалить записи из `submodule_step`.

---

## Стек фронтенда (AdminPanelReact)

| Технология       | Версия          | Роль                   |
| ---------------- | --------------- | ---------------------- |
| React            | 19              | UI-фреймворк           |
| TypeScript       | ~5.9            | Типизация              |
| Vite             | 8               | Сборщик                |
| Tailwind CSS     | 3.4             | Стилизация             |
| react-router-dom | v7 (HashRouter) | Роутинг                |
| TipTap           | 2.11            | Rich-text редактор     |
| gh-pages         | 6               | Деплой на GitHub Pages |

### Кастомные цвета Tailwind

```js
primary: "#007bff"
primary-hover: "#0056b3"
surface: "#f4f4f9"
card: "#ffffff"
border: "#e5e7eb"
text-heading: "#111827"
text-muted: "#6b7280"
text-light: "#9ca3af"
```

---

## Структура src/

```
src/
├── api/
│   ├── client.ts          # apiFetch() — базовый fetch с credentials, BASE_URL из VITE_API_URL
│   ├── auth.ts            # login()
│   ├── courses.ts         # fetchCourses, fetchModules, fetchSubmodules, fetchSteps,
│   │                      # fetchFolderImages, fetchFileContent
│   │                      # Types: Course, CourseModule, Submodule, Step, FileContent, ImageFile
│   └── mutations.ts       # updateFile, createFile, createImage, deleteFile, deleteImage,
│                          # editStep, createDirectory, createCourse, editCourse, renameItem,
│                          # deleteDirectory, generateMigration
├── components/
│   ├── FileItem.tsx        # Элемент списка (course/module/submodule/step) с кнопками действий
│   ├── TiptapEditor.tsx    # Rich-text редактор (TipTap) с вставкой и редактированием изображений,
│   │                       # сохранением width/height/style из HTML и px-only модалкой
│   ├── TestEditor.tsx      # Редактор тестов — вопросы + варианты + правильный ответ
│   ├── Modal.tsx           # Универсальная модалка с footer
│   ├── ConfirmDialog.tsx   # Диалог подтверждения удаления
│   ├── ToastContainer.tsx  # Toast-уведомления (success/error/info)
│   ├── RequireAuth.tsx     # Route guard, редиректит на /login
│   └── layout/
│       └── Layout.tsx      # Header + Outlet (навигация: Главная, FAQ, Контакты, Выйти)
├── hooks/
│   └── useToast.ts         # { toasts, success(), error(), info() }
├── pages/
│   ├── LoginPage.tsx       # Форма входа → AuthContext.login()
│   ├── HomePage.tsx        # Главная: навигация по иерархии, модалки CRUD, drag&drop изображений,
│   │                       # просмотр и удаление изображений папки (с фильтром .gitkeep)
│   ├── StepEditorPage.tsx  # Редактор шага: TiptapEditor или TestEditor, сохранение, смена типа,
│   │                       # HTML source mode, top bar из трёх логических секций
│   ├── FAQPage.tsx         # Статичный аккордеон FAQ
│   ├── ContactsPage.tsx    # Форма контактов (статика)
│   └── NotFoundPage.tsx    # 404
├── providers/
│   ├── AuthContext.tsx     # isAuthenticated (sessionStorage), login(), logout()
│   └── router.tsx          # HashRouter, маршруты: /login, /, /step-editor, /faq, /contacts
├── App.tsx                 # Пустой (thin wrapper, не используется)
├── main.tsx                # Точка входа: StrictMode > AuthProvider > RouterProvider
└── index.css
```

---

## Роутинг

| Путь           | Компонент      | Защищён          |
| -------------- | -------------- | ---------------- |
| `/login`       | LoginPage      | Нет              |
| `/`            | HomePage       | Да (RequireAuth) |
| `/step-editor` | StepEditorPage | Да               |
| `/faq`         | FAQPage        | Да               |
| `/contacts`    | ContactsPage   | Да               |
| `/*`           | NotFoundPage   | Да               |

Переход на `/step-editor` происходит через `navigate("/step-editor", { state: StepEditorState })` из `HomePage` при клике на шаг.

### StepEditorState (передаётся через router state)

```ts
interface StepEditorState {
  stepId: number;
  stepNumber: number;
  isTest: boolean;
  contentUrl: string; // raw GitHub URL для загрузки контента
  submodulePath: string; // "{courseId}/{moduleId}/{submoduleId}"
}
```

---

## Авторизация

- Форма логина → `POST /api/login` → сервер создаёт Express session
- Фронт хранит флаг `cunaedu_auth = "true"` в `sessionStorage`
- `RequireAuth` проверяет `isAuthenticated` из `AuthContext`
- `apiFetch` всегда передаёт `credentials: "include"` для cookies

---

## API эндпоинты бэкенда

| Метод  | Путь                                             | Описание                                               |
| ------ | ------------------------------------------------ | ------------------------------------------------------ |
| POST   | `/api/login`                                     | Авторизация                                            |
| GET    | `/api/courses?path=&type=`                       | Иерархия (type: Курсы/Модули/Сабмодули/Шаги)           |
| GET    | `/api/folder-images?path=`                       | Список папок с изображениями                           |
| GET    | `/api/file-content?fileUrl=&filePath=&fileType=` | Контент файла с GitHub + SHA                           |
| PUT    | `/api/update-file`                               | Обновить файл на GitHub                                |
| POST   | `/api/create-file`                               | Создать шаг (DB + GitHub)                              |
| POST   | `/api/create-image`                              | Загрузить изображение на GitHub                        |
| DELETE | `/api/delete-file`                               | Удалить шаг (DB + GitHub)                              |
| DELETE | `/api/delete-image`                              | Удалить изображение с GitHub                           |
| DELETE | `/api/delete-directory`                          | Удалить курс/модуль/подмодуль (DB + GitHub рекурсивно) |
| POST   | `/api/edit-step?stepId=&isTest=`                 | Сменить тип шага                                       |
| POST   | `/api/create-directory`                          | Создать модуль или подмодуль (DB + GitHub)             |
| POST   | `/api/create-course`                             | Создать курс (DB + GitHub)                             |
| POST   | `/api/edit-course`                               | Редактировать метаданные курса                         |
| PUT    | `/api/rename`                                    | Переименовать курс/модуль/подмодуль                    |
| GET    | `/api/generate-migration`                        | Скачать `.sql` миграцию (Liquibase-формат)             |

### DELETE /api/delete-directory

Тело запроса: `{ id: number, type: "course" | "module" | "submodule", path: string, message: string }`

- `path` — путь без префикса `courses/`, например `"1"`, `"1/2"`, `"1/2/3"`
- Использует `originalPool` напрямую (минуя обёртку `pool`), чтобы не триггерить `processQuery`
- Порядок удаления: сначала `submodule_step`, затем `submodule`, затем `course_module`/`course`, потом GitHub
- GitHub-папка удаляется рекурсивно через вспомогательную функцию `deleteGithubFolder(path, message)`

---

## Бэкенд (server.js)

**Стек:** Node.js ESM, Express 4, `pg` (PostgreSQL), `axios`, `express-session`, `winston`, `dotenv`

**Порт:** 8080

**CORS разрешён для:**

- `https://cunaedu.online`
- `https://en.cunaedu.online`
- `http://127.0.0.1:5500`, `5501`
- `http://localhost:5173`

### Ключевые механизмы

**`pool`** — обёртка над `pg.Pool`, перехватывает каждый SQL-запрос и вызывает `processQuery()` для записи в таблицу миграций.

**`originalPool`** — чистый `pg.Pool` без обёртки. Используется в `delete-directory` чтобы не триггерить `processQuery` (которая не умеет обрабатывать DELETE для `course_module`/`submodule`/`course`).

**`getFileSha(path)`** — получает SHA файла через `GET https://api.github.com/repos/YaNokavi/CunaEduFile/contents/courses/{path}`.

**`deleteGithubFolder(folderPath, message)`** — рекурсивно удаляет все файлы в папке через GitHub API. Если папка не существует (404) — молча пропускает.

**`processQuery(queryText, queryParams, queryResult)`** — анализирует каждый INSERT/DELETE SQL-запрос и пишет запись в `migration.migration`. Умеет обрабатывать только: INSERT/DELETE для `submodule_step`, INSERT для `submodule`/`course_module`/`course`.

**In-memory кэш `cache`** — кэширует ответы `/api/courses`, инвалидируется при создании/удалении/переименовании.

### Известные проблемы (не исправлены)

- 🚨 `GITHUB_TOKEN`, логин/пароль и session secret хардкожены как fallback (есть и `.env` ветка, и хардкод ветка подряд)
- ⚠️ `authenticateAdmin` middleware объявлен, но **не применяется** ни к одному роуту
- ⚠️ `connectToDb()` вызывает сам себя в catch без задержки (потенциальный stack overflow)
- ⚠️ Внутри `processQuery` имена таблиц написаны как `coursemodule`/`submodulestep` — это артефакт старого кода, реальные имена таблиц `course_module`/`submodule_step`

---

## Формат контента шагов

### Теория

Обычный HTML (`<p>`, `<h1>`, `<ul>`, `<strong>`, `<img>` и т.д.), созданный TipTap. Хранится как `.txt` файл на GitHub.

### Тест

JSON-файл следующей структуры:

```json
{
  "question": "Текст вопроса",
  "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
  "answer": ["Вариант 2"]
}
```

---

## Нюансы редактора теории

### TiptapEditor

- Используется кастомный `CustomImage`, основанный на `@tiptap/extension-image`
- Изображения работают как **inline**-узлы (`inline: true`, `group: "inline"`)
- Редактор сохраняет и повторно читает из HTML атрибуты `width`, `height`, `style`
- Вставка изображения идёт через модалку с полями:
  - URL изображения
  - ширина в px
  - высота в px
  - style (необязательно)
- Поля ширины/высоты в модалке принимают только **пиксели** (`type="number"`, `min=1`)
- Клик по уже вставленному изображению открывает модалку редактирования с предзаполненными атрибутами (`src`, `width`, `height`, `style`)

### StepEditorPage

- Для теории доступен тумблер **Редактор / HTML**
- Режим **HTML** показывает текущий сырой HTML с тегами, а не визуальный preview
- `TiptapEditor` остаётся смонтированным даже при переключении в HTML mode, чтобы не терять состояние
- Top bar разбит на три логические секции:
  - слева: назад + заголовок шага
  - по центру: тип шага + переключатель режима
  - справа: индикатор несохранённых изменений + удалить + сохранить
- Область редактора больше не ограничена `max-w-3xl`, используется почти вся доступная ширина страницы

---

## Нюансы путей для API

### delete-file vs остальные

Бэкенд в `/api/delete-file` **сам дописывает `.txt`** к пути:

```js
let gitUrl = `https://api.github.com/.../courses/${path}.txt`;
```

Поэтому с фронта нужно передавать путь **без `.txt`**:

```ts
// Правильно:
path: `${submodulePath}/${stepId}`; // → "1/2/3/42" → бэкенд делает "1/2/3/42.txt"

// Для fetchFileContent, updateFile, createFile — с .txt:
path: `${submodulePath}/${stepId}.txt`;
```

---

## Переменные окружения

### Фронт (`.env` / `.env.example`)

```
VITE_API_URL=https://admincuna-back-anderm.amvera.io
```

### Бэкенд (`.env`)

```
PGUSER=
PGHOST=
PGDATABASE=
PGPASSWORD=
PGPORT=
GITHUB_TOKEN=ghp_...
USERNAME=adminCuna
PASSWORD=...
```

---

## Текущий статус разработки (на июнь 2026)

### ✅ Реализовано

- Авторизация (login/logout, session)
- Загрузка иерархии курсов с API
- Навигация по иерархии с хлебными крошками
- Создание курса, модуля, подмодуля
- Редактирование метаданных курса
- Переименование курса/модуля/подмодуля
- **Удаление курса/модуля/подмодуля** — рекурсивно (DB + GitHub), с предупреждением о количестве вложенных шагов
- Drag & drop загрузка изображений на **HomePage** только на уровне подмодуля
- **Просмотр изображений папки** — при входе в подмодуль, с фильтрацией `.gitkeep`
- **Удаление изображений через UI** — кнопка с подтверждением на карточке изображения (HomePage)
- Генерация SQL-миграции (скачивание `.sql`)
- **Редактор шагов** (открывается при клике на шаг):
  - Rich-text редактор (TipTap) для теории
  - JSON-редактор тестов (вопросы + варианты + правильный ответ)
  - Переключение типа шага (Теория ↔ Тест) через API
  - Сохранение на GitHub (updateFile / createFile)
  - Удаление шага (DB + GitHub)
  - Индикатор несохранённых изменений
  - Режим просмотра **сырого HTML** с тегами
  - Вставка изображения через модалку
  - Сохранение `width`, `height`, `style` у изображений
  - Редактирование уже вставленного изображения по клику
  - Обновлённая top bar верстка с тремя логическими блоками

### 🔭 В перспективе

- Переупорядочивание шагов (кнопки ↑↓ или drag-n-drop)
- Переход по шагам (вперёд/назад) со страницы самого шага

---

## Как запустить локально

```bash
# Фронт
cd AdminPanelReact
npm install
npm run dev
# → http://localhost:5173

# Бэкенд
node server.js
# → http://localhost:8080
```
