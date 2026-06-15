import { useMemo, useState } from 'react';
import { FaGear } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Heading } from '~/components/ui/heading';
import { Tabs } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import { styled } from 'styled-system/jsx';
import { Metadata } from '~/components/layout/Metadata';
import { AdminGate } from '~/components/admin/AdminGate';
import { CollectionEditor } from '~/components/admin/CollectionEditor';
import { ImageManager } from '~/components/admin/ImageManager';
import { SubmissionReview } from '~/components/admin/SubmissionReview';
import { useAuth } from '~/hooks/useAuth';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';

const Select = styled('select');

export default function Page() {
  const catalog = useCatalog();
  const mounted = useMounted();
  const { isAdmin } = useAuth();
  const [imageCollectionId, setImageCollectionId] = useState<string | null>(null);

  const imageCollection = useMemo(() => {
    const id = imageCollectionId ?? catalog.collections[0]?.id ?? null;
    return catalog.collections.find((c) => c.id === id) ?? catalog.collections[0] ?? null;
  }, [catalog.collections, imageCollectionId]);

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
        コレクション・画像・投稿の管理を行います。
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
          <Tabs.Trigger value="images">画像登録</Tabs.Trigger>
          <Tabs.Trigger value="review">投稿承認</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Content value="collections">
          <CollectionEditor catalog={catalog} />
        </Tabs.Content>

        <Tabs.Content value="images">
          <Stack gap="4">
            <Stack gap="1.5" maxW="sm">
              <Text as="label" color="fg.muted" fontSize="xs" fontWeight="bold">
                コレクション
              </Text>
              <Select
                value={imageCollection?.id ?? ''}
                onChange={(e) => setImageCollectionId(e.target.value)}
                cursor="pointer"
                borderColor="border.default"
                borderRadius="l2"
                borderWidth="1px"
                py="2"
                px="3"
                fontSize="sm"
                bgColor="bg.default"
              >
                {catalog.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </Stack>
            {imageCollection ? (
              <ImageManager catalog={catalog} collection={imageCollection} />
            ) : (
              <Text color="fg.muted" fontSize="sm">
                コレクションがありません。
              </Text>
            )}
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="review">
          <SubmissionReview catalog={catalog} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
