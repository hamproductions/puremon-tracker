import React, { useState } from 'react';
import { BiX } from 'react-icons/bi';
import {
  FaArrowRightArrowLeft,
  FaCloudArrowUp,
  FaEllipsis,
  FaGear,
  FaHouse,
  FaLayerGroup,
  FaStar
} from 'react-icons/fa6';
import { usePageContext } from 'vike-react/usePageContext';
import { Box, Container, HStack, Stack } from 'styled-system/jsx';
import { AuthButton } from '~/components/layout/AuthButton';
import { ColorModeToggle } from '~/components/layout/ColorModeToggle';
import { Button } from '~/components/ui/styled/button';
import { Drawer } from '~/components/ui/drawer';
import { IconButton } from '~/components/ui/styled/icon-button';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/hooks/useAuth';
import { isActiveRoute, toAppUrl } from '~/utils/url';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  exact?: boolean;
  admin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'ホーム', exact: true, icon: FaHouse },
  { path: '/collections', label: 'コレクション', icon: FaLayerGroup },
  { path: '/mypick', label: 'マイコレ', icon: FaStar },
  { path: '/trade', label: '譲渡', icon: FaArrowRightArrowLeft },
  { path: '/submit', label: '画像投稿', icon: FaCloudArrowUp },
  { path: '/admin', label: '管理', icon: FaGear, admin: true }
];

const MOBILE_PRIMARY_PATHS = ['/', '/collections', '/mypick', '/trade'];

export function Layout({ children }: { children: React.ReactNode }) {
  const { urlPathname } = usePageContext();
  const { isAdmin } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => !item.admin || isAdmin);
  const mobilePrimary = items.filter((item) => MOBILE_PRIMARY_PATHS.includes(item.path));
  const currentPath = toAppUrl(urlPathname);

  function NavLink({ item, dense }: { item: NavItem; dense?: boolean }) {
    const { path, label, exact, icon: Icon } = item;
    const isActive = isActiveRoute(path, currentPath, exact);
    return (
      <Link
        href={toAppUrl(path)}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => setIsDrawerOpen(false)}
        display="flex"
        gap={dense ? '1.5' : '3'}
        alignItems="center"
        borderRadius="md"
        w={dense ? undefined : 'full'}
        py={dense ? '1.5' : '2.5'}
        px={dense ? '2.5' : '3'}
        color={isActive ? 'accent.text' : dense ? 'fg.muted' : 'fg.default'}
        textDecoration="none"
        fontSize={dense ? 'sm' : 'md'}
        fontWeight={isActive ? 'semibold' : 'medium'}
        bgColor={isActive ? 'accent.subtle' : 'transparent'}
        whiteSpace="nowrap"
        _hover={{ bgColor: isActive ? 'accent.subtle' : 'bg.subtle', textDecoration: 'none' }}
      >
        <Icon size={dense ? 15 : 18} />
        {label}
      </Link>
    );
  }

  return (
    <Stack position="relative" gap="0" w="full" minH="100dvh" bgColor="board.canvas">
      <Box
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% -5%, rgba(54,197,240,0.22) 0%, rgba(255,95,162,0.12) 42%, transparent 78%)'
        }}
        zIndex="0"
        position="fixed"
        top="0"
        left="0"
        w="100vw"
        h="60vh"
        pointerEvents="none"
      />
      <Container
        zIndex="1"
        position="relative"
        flex={1}
        w="full"
        px="4"
        pt="4"
        pb={{ base: '24', md: '6' }}
      >
        <Stack gap="5">
          <HStack justifyContent="space-between" alignItems="center" w="full">
            <HStack gap="5" alignItems="center">
              <Link href={toAppUrl('/')} _hover={{ textDecoration: 'none' }}>
                <Text
                  textStyle="display"
                  color="accent.default"
                  fontSize={{ base: 'md', md: 'lg' }}
                  lineHeight="1"
                  whiteSpace="nowrap"
                >
                  ピュアリーモンスター
                  <Text as="span" ml="1.5" color="fg.muted" fontSize="2xs" fontWeight="bold">
                    ブロマイド
                  </Text>
                </Text>
              </Link>
              <HStack hideBelow="md" gap="0.5">
                {items.map((item) => (
                  <NavLink key={item.path} item={item} dense />
                ))}
              </HStack>
            </HStack>
            <HStack gap="1.5" justifySelf="flex-end">
              <AuthButton />
              <ColorModeToggle />
            </HStack>
          </HStack>
          {children}
        </Stack>
      </Container>

      <Box
        hideFrom="md"
        zIndex="40"
        position="fixed"
        left="3"
        right="3"
        bottom="3"
        pb="env(safe-area-inset-bottom)"
        pointerEvents="none"
      >
        <HStack
          gap="1"
          justifyContent="space-between"
          borderColor="border.subtle"
          borderRadius="full"
          borderWidth="1px"
          py="1.5"
          px="2"
          bgColor="bg.default/95"
          boxShadow="lg"
          backdropFilter="blur(18px)"
          pointerEvents="auto"
        >
          {mobilePrimary.map((item) => {
            const isActive = isActiveRoute(item.path, currentPath, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={toAppUrl(item.path)}
                aria-current={isActive ? 'page' : undefined}
                display="flex"
                flex="1"
                gap="0.5"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                borderRadius="full"
                minW="0"
                minH="12"
                color={isActive ? 'accent.text' : 'fg.muted'}
                textDecoration="none"
                fontSize="2xs"
                fontWeight={isActive ? 'semibold' : 'medium'}
                bgColor={isActive ? 'accent.subtle' : 'transparent'}
              >
                <Icon size={17} />
                <Text as="span" maxW="full" truncate>
                  {item.label}
                </Text>
              </Link>
            );
          })}
          <Button
            aria-label="メニューを開く"
            variant="ghost"
            onClick={() => setIsDrawerOpen(true)}
            display="flex"
            flex="1"
            gap="0.5"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            borderRadius="full"
            minW="0"
            minH="12"
            color="fg.muted"
            fontSize="2xs"
            fontWeight="medium"
          >
            <FaEllipsis size={17} />
            <Text as="span">メニュー</Text>
          </Button>
        </HStack>
      </Box>

      <Drawer.Root open={isDrawerOpen} onOpenChange={(e) => setIsDrawerOpen(e.open)}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <HStack justifyContent="space-between" alignItems="center" w="full">
                <Drawer.Title>メニュー</Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <IconButton variant="ghost" size="sm">
                    <BiX size={24} />
                  </IconButton>
                </Drawer.CloseTrigger>
              </HStack>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="1">
                {items.map((item) => (
                  <NavLink key={item.path} item={item} />
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
