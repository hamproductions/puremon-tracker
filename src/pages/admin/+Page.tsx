import { FaGear } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Heading } from '~/components/ui/heading';
import { Tabs } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import { Metadata } from '~/components/layout/Metadata';
import { AdminGate } from '~/components/admin/AdminGate';
import { CollectionEditor } from '~/components/admin/CollectionEditor';
import { SubmissionReview } from '~/components/admin/SubmissionReview';
import { useAuth } from '~/hooks/useAuth';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';

export default function Page() {
  const catalog = useCatalog();
  const mounted = useMounted();
  const { isAdmin } = useAuth();
  const initialCollectionId =
    mounted && typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('collection')
      : null;

  const header = (
    <Stack gap="1">
      <HStack gap="2" alignItems="center">
        <Box color="accent.default" fontSize="lg">
          <FaGear />
        </Box>
        <Heading textStyle="display" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1">
          管理
        </Heading>
      </HStack>
      <Text color="fg.muted" fontSize="sm">
        コレクションの登録先定義、削除、投稿承認を行います。画像は各コレクションの「画像を管理」から登録・削除できます。
      </Text>
    </Stack>
  );

  if (!mounted) {
    return (
      <Stack gap="6" pt="2">
        <Metadata title="管理" helmet />
        {header}
        <Box
          borderColor="board.border"
          borderRadius="2xl"
          borderWidth="1px"
          h="40"
          bgColor="board.panel"
        />
      </Stack>
    );
  }

  if (!isAdmin) {
    return (
      <Stack gap="6" pt="2">
        <Metadata title="管理" helmet />
        {header}
        <AdminGate />
      </Stack>
    );
  }

  return (
    <Stack gap="6" pt="2">
      <Metadata title="管理" helmet />
      {header}

      <Tabs.Root defaultValue="collections">
        <Tabs.List>
          <Tabs.Trigger value="collections">コレクション</Tabs.Trigger>
          <Tabs.Trigger value="review">投稿承認</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Content value="collections">
          <CollectionEditor catalog={catalog} initialCollectionId={initialCollectionId} />
        </Tabs.Content>

        <Tabs.Content value="review">
          <SubmissionReview catalog={catalog} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
