import Modal from "./Modal";

interface Props {
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
  saving?: boolean;
}

/**
 * Модалка, которая появляется при попытке выйти с несохранёнными изменениями.
 * Три варианта:
 *   - Остаться (продолжить работу)
 *   - Отменить изменения (выйти без сохранения)
 *   - Сохранить и выйти
 */
export default function UnsavedChangesDialog({
  open,
  onStay,
  onDiscard,
  onSave,
  saving,
}: Props) {
  return (
    <Modal
      open={open}
      title="Несохранённые изменения"
      onClose={onStay}
      footer={
        <>
          <button
            onClick={onStay}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition disabled:opacity-50"
          >
            Остаться
          </button>
          <button
            onClick={onDiscard}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            Отменить изменения
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить и выйти"}
          </button>
        </>
      }
    >
      <p className="text-sm text-text-main">
        Вы внесли изменения, которые ещё не сохранены. Что хотите сделать?
      </p>
    </Modal>
  );
}
