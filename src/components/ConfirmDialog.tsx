import Modal from "./Modal";

interface Props {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ open, message, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal open={open} title="Подтверждение" onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition disabled:opacity-50">
            Отмена
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50">
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </>
      }
    >
      <p className="text-sm text-text-main">{message}</p>
    </Modal>
  );
}
