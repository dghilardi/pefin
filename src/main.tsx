import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LoginPage } from './page/LoginPage.tsx';
import { useAtomValue } from 'jotai';
import { googleSessionAtom } from './atom/googlesession.ts';

const Authorization = () => {
  const googleSession = useAtomValue(googleSessionAtom);
  if (googleSession) {
    return <App />;
  } else {
    return <LoginPage />;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Authorization />
    </GoogleOAuthProvider>
  </StrictMode>,
)
