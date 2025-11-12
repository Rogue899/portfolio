import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ itemName, onConfirm, onCancel, title, message, warning }) => {
  const modalTitle = title || 'Confirm Delete';
  const modalMessage = message || `Are you sure you want to delete "${itemName}"?`;
  const modalWarning = warning !== undefined ? warning : 'This action cannot be undone.';

  return (
    <div className="delete-confirm-modal-overlay" onClick={onCancel}>
      <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span className="modal-title">{modalTitle}</span>
        </div>
        <div className="modal-content">
          <p>{modalMessage}</p>
          {modalWarning && <p className="modal-warning">{modalWarning}</p>}
          <div className="modal-buttons">
            <button className="modal-button" onClick={onCancel}>No</button>
            <button className="modal-button" onClick={onConfirm}>Yes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

