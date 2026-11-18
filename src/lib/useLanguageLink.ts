import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Locale } from '../data/routes';
import { rememberLanguageChoice } from './languagePreference';

/**
 * Click handler for links to the same page in another language: remembers the choice and keeps the
 * `#anchor` of the current URL (album and service anchors are identical in every locale), so a
 * visitor looking at one album lands on the same album. The hash is read at click time — it is not
 * part of the prerendered HTML, so it must not end up in the rendered `href` (PRD D-18).
 */
export const useLanguageLink = () => {
  const navigate = useNavigate();
  return (code: Locale, to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    rememberLanguageChoice(code);
    const { hash } = window.location;
    // Modified clicks (new tab, download…) keep the browser's own behaviour.
    if (!hash || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(`${to}${hash}`);
  };
};
