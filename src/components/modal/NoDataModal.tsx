import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './NoDataModal.module.css'

interface NoDataModalProps {
  open: boolean
  onClose: () => void
}

export function NoDataModal({ open, onClose }: NoDataModalProps) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return
    }

    const { body } = document
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <h3>Данных нет</h3>
        <p>Для выбранной зоны в текущем сценарии нет телеметрии.</p>
        <button type="button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>,
    document.body,
  )
}
