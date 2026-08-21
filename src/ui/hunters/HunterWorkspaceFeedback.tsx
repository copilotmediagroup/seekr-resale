interface HunterWorkspaceFeedbackProps {
  toast: {
    message: string
    tone: 'success' | 'error'
  } | null
  showUnsavedChanges: boolean
  onKeepEditing: () => void
  onDiscardChanges: () => void | Promise<void>
}

export function HunterWorkspaceFeedback({
  toast,
  showUnsavedChanges,
  onKeepEditing,
  onDiscardChanges,
}: HunterWorkspaceFeedbackProps) {
  return (
    <>
      {toast && (
        <div
          aria-live="polite"
          className={`seekrToast ${
            toast.tone === 'error' ? 'seekrToastError' : 'seekrToastSuccess'
          }`}
          role="status"
        >
          <span className="seekrToastIcon">
            {toast.tone === 'error' ? '!' : '✓'}
          </span>

          <span>{toast.message}</span>
        </div>
      )}

      {showUnsavedChanges && (
        <div
          aria-labelledby="unsaved-changes-title"
          aria-modal="true"
          className="seekrModalBackdrop"
          role="dialog"
        >
          <div className="seekrModal">
            <div className="seekrModalIcon">!</div>

            <div className="seekrModalContent">
              <span className="seekrModalEyebrow">UNSAVED CHANGES</span>

              <h3 id="unsaved-changes-title">
                Leave this Hunter without saving?
              </h3>

              <p>
                Your latest edits have not been saved. You can keep editing or
                discard those changes and open the other Hunter.
              </p>
            </div>

            <div className="seekrModalActions">
              <button
                className="seekrModalSecondary"
                onClick={onKeepEditing}
                type="button"
              >
                Keep Editing
              </button>

              <button
                className="seekrModalDanger"
                onClick={() => void onDiscardChanges()}
                type="button"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
