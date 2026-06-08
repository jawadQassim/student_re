function ModalFrame({
  children,
  eyebrow = 'Workspace action',
  onClose,
  size = 'wide',
  subtitle,
  title,
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-modal="true"
        className={size === 'small' ? 'modal-card small' : 'modal-card'}
        role="dialog"
      >
        <div className="modal-header">
          <div className="section-heading">
            <span className="eyebrow">{eyebrow}</span>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button className="text-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmationModal({
  confirmLabel,
  eyebrow = 'Workspace action',
  message,
  onClose,
  onConfirm,
  subtitle = 'Please confirm before removing this record from the live system.',
  title,
}) {
  return (
    <ModalFrame
      eyebrow={eyebrow}
      onClose={onClose}
      size="small"
      subtitle={subtitle}
      title={title}
    >
      <div className="confirmation-body">
        <p className="confirmation-copy">{message}</p>

        <div className="modal-actions">
          <button className="ghost-button compact" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

export { ConfirmationModal, ModalFrame };
