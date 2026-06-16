import React, { useEffect, useState } from 'react';
import { BiMenu, BiX } from 'react-icons/bi';
import { FaLayerGroup } from 'react-icons/fa6';
import { usePageContext } from 'vike-react/usePageContext';
import { Box, Center, Container, HStack, Stack, styled } from 'styled-system/jsx';
import { AuthButton } from '~/components/layout/AuthButton';
import { ColorModeToggle } from '~/components/layout/ColorModeToggle';
import { AuthProvider } from '~/context/AuthProvider';
import { QueryProvider } from '~/context/QueryProvider';
import { Drawer } from '~/components/ui/drawer';
import { IconButton } from '~/components/ui/styled/icon-button';
import { Link } from '~/components/ui/link';
import { useAuth } from '~/hooks/useAuth';
import { clearProductLocalState } from '~/lib/localProductState';
import { isActiveRoute, toAppUrl } from '~/utils/url';

interface NavItem {
  path: string;
  label: string;
  exact?: boolean;
  admin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'ホーム', exact: true },
  { path: '/collections', label: 'コレクション' },
  { path: '/admin', label: '管理', admin: true }
];

function Brand({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? '7' : '8';
  return (
    <HStack gap="2" alignItems="center">
      <Center
        flexShrink="0"
        borderRadius="lg"
        w={box}
        h={box}
        color="white"
        bgColor="accent.default"
      >
        <FaLayerGroup size={size === 'sm' ? 13 : 15} />
      </Center>
      <styled.span
        textStyle="display"
        hideBelow="sm"
        color="accent.default"
        fontSize={size === 'sm' ? 'sm' : 'md'}
        whiteSpace="nowrap"
      >
        ピュアリーモンスター
      </styled.span>
    </HStack>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
    </QueryProvider>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { urlPathname } = usePageContext();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => !i.admin || isAdmin);
  const currentPath = toAppUrl(urlPathname);

  useEffect(() => {
    clearProductLocalState();
  }, []);

  function NavLink({ item, big }: { item: NavItem; big?: boolean }) {
    const active = isActiveRoute(item.path, currentPath, item.exact);
    return (
      <Link
        href={toAppUrl(item.path)}
        onClick={() => setOpen(false)}
        aria-current={active ? 'page' : undefined}
        display="block"
        borderRadius="lg"
        py={big ? '2.5' : '1.5'}
        px={big ? '3' : '2.5'}
        color={active ? 'accent.default' : 'fg.muted'}
        textDecoration="none"
        fontSize={big ? 'md' : 'sm'}
        fontWeight={active ? 'bold' : 'medium'}
        bgColor={active ? 'accent.subtle' : 'transparent'}
        whiteSpace="nowrap"
        _hover={{
          color: active ? 'accent.default' : 'fg.default',
          bgColor: active ? 'accent.subtle' : 'bg.muted',
          textDecoration: 'none'
        }}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <Stack position="relative" gap="0" w="full" minH="100dvh" bgColor="board.canvas">
      <Box
        as="header"
        zIndex="30"
        position="sticky"
        top="0"
        borderColor="board.border"
        borderBottomWidth="1px"
        bgColor="board.panel"
        backdropFilter="blur(10px)"
      >
        <Container px="4">
          <HStack gap="3" justifyContent="space-between" alignItems="center" h="14">
            <HStack gap="5" alignItems="center" minW="0">
              <Link
                href={toAppUrl('/')}
                aria-label="ピュアリーモンスター ホーム"
                flexShrink="0"
                _hover={{ textDecoration: 'none' }}
              >
                <Brand />
              </Link>
              <HStack hideBelow="md" gap="0.5">
                {items.map((i) => (
                  <NavLink key={i.path} item={i} />
                ))}
              </HStack>
            </HStack>
            <HStack gap="1" flexShrink="0">
              <AuthButton />
              <Box hideBelow="md">
                <ColorModeToggle />
              </Box>
              <Box hideFrom="md">
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="メニュー"
                  onClick={() => setOpen(true)}
                >
                  <BiMenu size={22} />
                </IconButton>
              </Box>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container flex="1" w="full" py="5" px="4">
        {children}
      </Container>

      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <HStack justifyContent="space-between" alignItems="center" w="full">
                <Brand size="sm" />
                <Drawer.CloseTrigger asChild>
                  <IconButton variant="ghost" size="sm" aria-label="メニューを閉じる">
                    <BiX size={22} />
                  </IconButton>
                </Drawer.CloseTrigger>
              </HStack>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="1">
                {items.map((i) => (
                  <NavLink key={i.path} item={i} big />
                ))}
              </Stack>
            </Drawer.Body>
            <Drawer.Footer>
              <HStack justifyContent="space-between" alignItems="center" w="full">
                <styled.span color="fg.muted" fontSize="sm">
                  テーマ
                </styled.span>
                <ColorModeToggle />
              </HStack>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Stack>
  );
}
