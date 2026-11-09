import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Prerendered HTML (production) → hydrate; empty shell with only the <!--app-html--> marker (dev) → render.
if (root.firstElementChild) hydrateRoot(root, tree);
else createRoot(root).render(tree);
