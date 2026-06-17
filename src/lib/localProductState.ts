const PRODUCT_KEYS = [
  'puremon:admin',
  'puremon:collections',
  'puremon:deleted-collections',
  'puremon:e2e-profile',
  'puremon:images',
  'puremon:members',
  'puremon:remote-catalog',
  'puremon:submissions'
];

export function clearProductLocalState() {
  if (typeof window === 'undefined') return;
  for (const key of PRODUCT_KEYS) window.localStorage.removeItem(key);
}

export function clearAnonymousOwnershipState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('puremon:ownership');
}
