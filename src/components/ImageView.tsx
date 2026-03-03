import styles from './ImageView.module.css'

const imageModules = import.meta.glob('../assets/images/main-image.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const imageSrc = imageModules['../assets/images/main-image.png']

function ImageView() {
  if (!imageSrc) {
    return (
      <div className={styles.placeholder}>
        Добавьте файл <code>src/assets/images/main-image.png</code>
      </div>
    )
  }

  return (
    <div className={styles.frame}>
      <img src={imageSrc} alt="Основное изображение" className={styles.image} />
    </div>
  )
}

export default ImageView
