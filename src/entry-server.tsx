import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { App } from './App';
import { matchRoute } from './data/routes';

export interface RenderResult {
  html: string;
  locale: string;
}

/** Renders one route to static HTML for scripts/prerender.ts (MASTER-PLAN 1.9). */
export const render = (url: string): RenderResult => {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>
  );
  return { html, locale: matchRoute(url).locale };
};
