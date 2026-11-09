import { useTranslation } from 'react-i18next';
import type { RentalItem } from '../../data/types';
import { IMAGE_META } from '../../data/generated/imageMeta';
import { formatHuf } from '../../data/contact';
import { Picture } from '../Common/Picture';
import styles from './rental.module.css';

const QUANTITY_KEY: Record<RentalItem['unit'], string> = {
  occasion: 'rental.labels.pieces',
  piece: 'rental.labels.pieces',
  set: 'rental.labels.sets',
  wall: 'rental.labels.walls',
};

/** Data-driven catalog card (PRD D-8, MASTER-PLAN 2.6). */
export const RentalCard = ({ item }: { item: RentalItem }) => {
  const { t } = useTranslation();
  const images = IMAGE_META.rental[item.id] ?? [];
  const img = images[0];
  const name = t(item.nameKey);
  return (
    <li className={`card ${styles.card}`} id={item.id} data-testid="rental-item">
      {img && (
        <Picture asset={img} alt={name} className={styles.img} sizes="(min-width: 48rem) 45vw, 100vw" />
      )}
      <div className={styles.body}>
        <h2 className={styles.title}>{name}</h2>
        <p className={styles.desc}>{t(item.descriptionKey)}</p>
        <dl className={styles.specs}>
          {item.size && (
            <div className={styles.spec}>
              <dt>{t('rental.labels.size')}</dt>
              <dd>{item.size}</dd>
            </div>
          )}
          <div className={styles.spec}>
            <dt>{t('rental.labels.quantity')}</dt>
            <dd>{t(QUANTITY_KEY[item.unit], { count: item.quantity })}</dd>
          </div>
          <div className={styles.spec}>
            <dt>{t('rental.labels.price')}</dt>
            <dd className={styles.price}>
              {formatHuf(item.priceHuf)}
              <span className={styles.unit}> / {t(`rental.units.${item.unit}`)}</span>
            </dd>
          </div>
          {item.depositHuf && (
            <div className={styles.spec}>
              <dt>{t('rental.labels.deposit')}</dt>
              <dd>{formatHuf(item.depositHuf)}</dd>
            </div>
          )}
          <div className={styles.spec}>
            <dt>{t('rental.labels.pickup')}</dt>
            <dd>{item.pickupTown ? t('rental.labels.pickupZalakaros') : t('rental.labels.pickupOnly')}</dd>
          </div>
        </dl>
        {item.notesKey && <p className={`muted ${styles.notes}`}>{t(item.notesKey)}</p>}
      </div>
    </li>
  );
};
