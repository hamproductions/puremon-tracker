import React, { useState } from 'react';
import { BiMenu, BiX } from 'react-icons/bi';
import { usePageContext } from 'vike-react/usePageContext';
import { Box, Container, HStack, Stack, styled } from 'styled-system/jsx';
import { AuthButton } from '~/components/layout/AuthButton';
import { ColorModeToggle } from '~/components/layout/ColorModeToggle';
import { Drawer } from '~/components/ui/drawer';
import { IconButton } from '~/components/ui/styled/icon-button';
import { Link } from '~/components/ui/link';
import { useAuth } from '~/hooks/useAuth';
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
  { path: '/mypick', label: 'マイコレ' },
  { path: '/trade', label: '譲渡' },
  { path: '/admin', label: '管理', admin: true }
];

const Logo = styled('img');

export function Layout({ children }: { children: React.ReactNode }) {
  const { urlPathname } = usePageContext();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => !i.admin || isAdmin);
  const currentPath = toAppUrl(urlPathname);

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
          <HStack gap="4" justifyContent="space-between" alignItems="center" h="14">
            <HStack gap="5" alignItems="center" minW="0">
              <Link
                href={toAppUrl('/')}
                display="flex"
                gap="2"
                flexShrink="0"
                alignItems="center"
                _hover={{ textDecoration: 'none' }}
              >
                <Logo
                  src={toAppUrl('/purelymonster-logo.png')}
                  alt="ピュアリーモンスター"
                  w="auto"
                  h="9"
                />
                <styled.span hideBelow="sm" color="fg.subtle" fontSize="xs" fontWeight="bold">
                  ブロマイド管理
                </styled.span>
              </Link>
              <HStack hideBelow="md" gap="0.5">
                {items.map((i) => (
                  <NavLink key={i.path} item={i} />
                ))}
              </HStack>
            </HStack>
            <HStack gap="1.5" flexShrink="0">
              <AuthButton />
              <ColorModeToggle />
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
                <Logo
                  src={toAppUrl('/purelymonster-logo.png')}
                  alt="ピュアリーモンスター"
                  w="auto"
                  h="8"
                />
                <Drawer.CloseTrigger asChild>
                  <IconButton variant="ghost" size="sm">
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
              <HStack justifyContent="space-between" w="full">
                <AuthButton />
                <ColorModeToggle />
              </HStack>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Stack>
  );
}
