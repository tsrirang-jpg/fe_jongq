import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  busy?: boolean
  title: string
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
  children: ReactNode
}
export default function ConfirmDialog({ open, busy = false, title, confirmLabel, onClose, onConfirm, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog?.open) dialog?.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return (
    <dialog ref={ref} onCancel={event => { if (busy) event.preventDefault(); else onClose() }} onClick={event => {
      if (!busy && event.target === event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
      }
    }} aria-labelledby={titleId}>
      <div className="dialog-content">
        <h2 id={titleId}>{title}</h2>
        {children}
        <div className="dialog-actions">
          <button type="button" className="secondary" disabled={busy} onClick={onClose}>ย้อนกลับ</button>
          <button type="button" className="primary" disabled={busy} onClick={onConfirm}>{busy ? 'กำลังบันทึก…' : confirmLabel}</button>
        </div>
      </div>
    </dialog>
  )
}
