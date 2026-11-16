import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { pathFor, type PageId } from '../../data/routes';
import { useLocale } from '../../i18n/localeContext';

interface Props extends Omit<ComponentProps<typeof Link>, 'to'> {
  page: PageId;
  hash?: string;
}

/** Link to a page in the current locale (never cross-locale — legacy bug #1). */
export const LocalizedLink = ({ page, hash, children, ...rest }: Props) => {
  const { locale } = useLocale();
  const to = hash ? `${pathFor(page, locale)}#${hash}` : pathFor(page, locale);
  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
};
