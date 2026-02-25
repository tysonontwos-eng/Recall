export default function ConfirmModal({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel, danger = false }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">{title}</div>
        {body && <div className="modal__body">{body}</div>}
        <div className="modal__actions">
          <button
            className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel ?? "Confirm"}
          </button>
          <button className="btn btn--secondary" onClick={onCancel}>
            {cancelLabel ?? "Cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}
