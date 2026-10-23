import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(<Home/>);

// Older Pages versions installed an offline atlas. Retire its cache without
// navigating away from the current GitHub URL or caching live timetables.
if ('serviceWorker' in navigator) {
  const scope = new URL(import.meta.env.BASE_URL, location.origin).href;
  navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(
    registrations.filter(r => r.scope === scope).map(r => r.unregister()),
  )).catch(() => {});
}
