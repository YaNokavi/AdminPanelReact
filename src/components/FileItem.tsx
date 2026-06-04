import type { BreadcrumbItem } from "../pages/HomePage";

export type ItemKind = "course" | "module" | "submodule" | "step";

export interface NavItem {
  id: number;
  name: string;
  kind: ItemKind;
  isTest?: boolean;
  number?: number;
  contentUrl?: string;
  icon?: string;
  author?: string;
  description?: string;
  rating?: number;
  modules?: NavItem[];
  submodules?: NavItem[];
  steps?: NavItem[];
}

interface Props {
  item: NavItem;
  onOpen: (item: NavItem) => void;
  onRename?: (item: NavItem) => void;
  onDelete?: (item: NavItem) => void;
  onEdit?: (item: NavItem) => void;
  breadcrumb: BreadcrumbItem[];
}

const kindLabel: Record<ItemKind, string> = {
  course: "Курс",
  module: "Модуль",
  submodule: "Подмодуль",
  step: "Шаг",
};

export default function FileItem({ item, onOpen, onRename, onDelete, onEdit }: Props) {
  const isLeaf = item.kind === "step";

  return (
    <li className="flex items-center justify-between p-3 bg-white border border-border rounded-lg hover:border-primary/50 transition group">
      <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => onOpen(item)}>
        {/* Icon */}
        <div className="flex-shrink-0">
          {item.kind === "course" && item.icon ? (
            <img src={item.icon} alt="" className="w-8 h-8 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className={`w-8 h-8 rounded flex items-center justify-center ${
              item.kind === "course" ? "bg-blue-50" :
              item.kind === "module" ? "bg-green-50" :
              item.kind === "submodule" ? "bg-yellow-50" :
              item.isTest ? "bg-purple-50" : "bg-gray-50"
            }`}>
              {isLeaf ? (
                item.isTest ? (
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )
              ) : (
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Label */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-heading group-hover:text-primary transition truncate">
            {isLeaf ? `Шаг ${item.number ?? item.id}` : item.name}
          </p>
          <p className="text-xs text-text-muted">
            {kindLabel[item.kind]}
            {item.isTest && " · Тест"}
            {item.kind === "course" && item.author && ` · ${item.author}`}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2">
        {item.kind === "course" && onEdit && (
          <button onClick={() => onEdit(item)}
            className="p-1.5 text-text-muted hover:text-primary hover:bg-blue-50 rounded transition" title="Редактировать курс">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {item.kind !== "step" && onRename && (
          <button onClick={() => onRename(item)}
            className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Переименовать">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(item)}
            className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded transition" title="Удалить">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}
