import { FaLock, FaXTwitter } from 'react-icons/fa6';
import { Box, Center, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Heading } from '~/components/ui/heading';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/hooks/useAuth';

export function AdminGate() {
  const { isConfigured, profile, signInWithTwitter } = useAuth();

  let message = 'このページは管理者専用です。';
  if (isConfigured && profile && !profile.isAdmin) message = '管理者権限がありません';
  else if (isConfigured && !profile) message = 'ログインしてください';
  else if (!isConfigured) message = 'Supabase設定が必要です';

  return (
    <Center py="10">
      <Card.Root w="full" maxW="md">
        <Card.Header>
          <Stack gap="2" alignItems="center" textAlign="center">
            <Box color="accent.default" fontSize="2xl">
              <FaLock />
            </Box>
            <Card.Title asChild>
              <Heading as="h2" fontSize="xl">
                {message}
              </Heading>
            </Card.Title>
          </Stack>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            {isConfigured && profile && !profile.isAdmin ? (
              <Text color="fg.muted" fontSize="sm" textAlign="center">
                許可リスト
                <Box as="code" borderRadius="sm" mx="1" px="1" bgColor="bg.muted">
                  PUBLIC_ENV__ADMIN_HANDLES
                </Box>
                に @handle を追加してください。
              </Text>
            ) : null}

            {isConfigured && !profile ? (
              <Button onClick={() => void signInWithTwitter()} variant="solid">
                <FaXTwitter />
                Xでログイン
              </Button>
            ) : null}

            {!isConfigured ? (
              <Text color="fg.muted" fontSize="sm" textAlign="center">
                管理機能と画像投稿には Supabase の設定とログインが必要です。
              </Text>
            ) : null}
          </Stack>
        </Card.Body>
      </Card.Root>
    </Center>
  );
}
