import { FaRightFromBracket, FaXTwitter } from 'react-icons/fa6';
import { HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Menu } from '~/components/ui/menu';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/hooks/useAuth';
import { useMounted } from '~/hooks/useMounted';

export function AuthButton() {
  const { profile, isConfigured, signInWithTwitter, signOut } = useAuth();
  const mounted = useMounted();

  if (!isConfigured) return null;
  if (!mounted) return null;

  if (!profile) {
    return (
      <Button size="sm" variant="solid" onClick={() => void signInWithTwitter()}>
        <FaXTwitter />
        ログイン
      </Button>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button size="sm" variant="outline">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              width={20}
              height={20}
              style={{ borderRadius: '999px' }}
            />
          ) : null}
          <Text as="span" maxW="24" truncate>
            {profile.handle ? `@${profile.handle}` : profile.displayName}
          </Text>
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="logout" onClick={() => void signOut()}>
            <HStack gap="2">
              <FaRightFromBracket />
              ログアウト
            </HStack>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
