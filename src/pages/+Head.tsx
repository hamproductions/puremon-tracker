import { Metadata } from '~/components/layout/Metadata';
import { toAppUrl } from '~/utils/url';

export function Head() {
  return (
    <>
      <Metadata />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <link rel="manifest" href={toAppUrl('/manifest.webmanifest')} />
      <link rel="icon" href={toAppUrl('/favicon.svg')} type="image/svg+xml" />
      <meta name="theme-color" content="#FF5FA2" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Outfit:wght@400;600;800&display=swap"
        rel="stylesheet"
      />
    </>
  );
}
