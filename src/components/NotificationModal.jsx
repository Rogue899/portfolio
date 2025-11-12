import './NotificationModal.css';

const NotificationModal = ({ title, message, type = 'info', onClose }) => {
  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-titlebar ${type}`}>
          <span className="modal-title">{title}</span>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <div className={`modal-icon ${type}`}>
            {type === 'error' && '⚠️'}
            {type === 'success' && '✓'}
            {type === 'info' && 'ℹ️'}
          </div>
          <p>{message}</p>
          <div className="modal-buttons">
            <button className="modal-button" onClick={onClose}>OK</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

