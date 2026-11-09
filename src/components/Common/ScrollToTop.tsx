import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronUp } from 'react-icons/fa';
import styles from './scroll-to-top.module.css';

export const ScrollToTop = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      type="button"
      className={`${styles.btn} ${visible ? styles.visible : ''}`}
      aria-label={t('common.backToTop')}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <FaChevronUp aria-hidden="true" />
    </button>
  );
};
