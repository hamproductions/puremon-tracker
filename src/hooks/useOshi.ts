import { oshiStore, useStore } from '~/data/store';

export function useOshi() {
  const oshi = useStore(oshiStore);

  const isOshi = (memberId: string | null) => (memberId ? oshi.includes(memberId) : false);

  const toggleOshi = (memberId: string) => {
    oshiStore.update((list) =>
      list.includes(memberId) ? list.filter((id) => id !== memberId) : [...list, memberId]
    );
  };

  return { oshi, isOshi, toggleOshi };
}
