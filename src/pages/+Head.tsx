import { Metadata } from '~/components/layout/Metadata';
import { toAppUrl } from '~/utils/url';

export function Head() {
  return (
    <>
      <Metadata />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <link rel="manifest" href={toAppUrl('/manifest.webmanifest')} />
      <link rel="icon" href={toAppUrl('/favicon.svg')} type="image/svg+xml" />
      <meta name="theme-color" content="#36c5f0" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+P+One&family=Noto+Sans+JP:wght@400;500;700;900&display=swap"
        rel="stylesheet"
      />
    </>
  );
}
