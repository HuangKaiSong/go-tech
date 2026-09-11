import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// oxlint-disable-next-line import/no-unassigned-import
import './index.css';
// oxlint-disable-next-line import/no-unassigned-import
import './i18n';

createRoot(document.getElementById('root')!).render(<App />);
