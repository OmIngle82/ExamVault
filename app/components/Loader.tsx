import styles from './Loader.module.css';

export default function Loader({ fullScreen = false }: { fullScreen?: boolean }) {
  if (fullScreen) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh', 
        width: '100%'
      }}>
        <div className={styles.loader}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loader}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
}
