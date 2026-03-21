export interface FileNode {
  id: number | string;
  name: string;
  type: "file" | "directory";
}

interface FileItemProps {
  item: FileNode;
  onOpen: (item: FileNode) => void;
  onRename: (item: FileNode) => void;
  onDelete: (item: FileNode) => void;
}

export default function FileItem({
  item,
  onOpen,
  onRename,
  onDelete,
}: FileItemProps) {
  // Определяем иконку в зависимости от типа
  const isDirectory = item.type === "directory";

  return (
    <li className="flex items-center justify-between p-3 bg-white border border-border rounded-lg hover:border-primary/50 transition group">
      <div
        className="flex items-center gap-3 cursor-pointer flex-1"
        onClick={() => onOpen(item)}
      >
        {isDirectory ? (
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            ></path>
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            ></path>
          </svg>
        )}
        <span className="text-sm font-medium text-text-heading group-hover:text-primary transition">
          {item.name}
        </span>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onRename(item)}
          className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded transition"
          title="Переименовать"
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
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            ></path>
          </svg>
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded transition"
          title="Удалить"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            ></path>
          </svg>
        </button>
      </div>
    </li>
  );
}
