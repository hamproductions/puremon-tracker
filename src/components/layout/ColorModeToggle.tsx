import { FaMoon, FaSun } from 'react-icons/fa6';
import { IconButton } from '~/components/ui/icon-button';
import { useColorModeContext } from '~/context/ColorModeContext';
import { useMounted } from '~/hooks/useMounted';

export function ColorModeToggle() {
  const { colorMode, setColorMode } = useColorModeContext();
  const mounted = useMounted();
  const isDark = colorMode === 'dark';
  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label="表示モードを切り替え"
      onClick={() => setColorMode?.(isDark ? 'light' : 'dark')}
    >
      {mounted && isDark ? <FaSun /> : <FaMoon />}
    </IconButton>
  );
}
