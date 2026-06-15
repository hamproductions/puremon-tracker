import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from '~/components/utils/ErrorBoundary';
import { ColorModeProvider } from '~/context/ColorModeContext';
import { ToasterProvider } from '~/context/ToasterContext';

import '../index.css';

export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ColorModeProvider>
          <ToasterProvider>{children}</ToasterProvider>
        </ColorModeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
