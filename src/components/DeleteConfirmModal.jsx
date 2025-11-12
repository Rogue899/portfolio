import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ itemName, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirm Delete</h3>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>"{itemName}"</strong>?</p>
          <p className="modal-warning">This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="modal-button modal-button-cancel" onClick={onCancel}>
            No
          </button>
          <button className="modal-button modal-button-confirm" onClick={onConfirm}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

