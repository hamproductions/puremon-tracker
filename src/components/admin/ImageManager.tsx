import { useEffect, useRef, useState } from 'react';
import { FaImage, FaTrash } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, styled } from 'styled-system/jsx';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Spinner } from '~/components/ui/spinner';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import { catalogActions } from '~/hooks/useCatalog';
import { uploadBromideImage } from '~/lib/storage';
import type { Bromide, Catalog, Collection, Member } from '~/types';
import { buildGrid } from '~/utils/stats';

const Img = styled('img');

export function ImageManager({
  catalog,
  collection
}: {
  catalog: Catalog;
  collection: Collection;
}) {
  const [size, setSize] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSize(collection.sizes?.[0]);
  }, [collection.id, collection.sizes]);

  const grid = buildGrid(catalog, collection, size);

  const sizeSelector = grid.hasSizes ? (
    <HStack gap="2.5" alignItems="center" flexWrap="wrap">
      <Text color="fg.muted" fontSize="xs" fontWeight="bold">
        サイズ
      </Text>
      <SegmentGroup.Root
        value={grid.size ?? ''}
        onValueChange={(e) => setSize(e.value)}
        size="sm"
        orientation="horizontal"
      >
        <SegmentGroup.Indicator />
        {grid.sizes.map((s) => (
          <SegmentGroup.Item key={s} value={s}>
            <SegmentGroup.ItemText>{s}</SegmentGroup.ItemText>
            <SegmentGroup.ItemControl />
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>
    </HStack>
  ) : null;

  if (grid.kind === 'flat') {
    return (
      <Stack gap="4">
        {sizeSelector}
        <Grid gap="3" columns={{ base: 2, sm: 3, md: 5 }}>
          {grid.bromides.map((b) => (
            <ImageCell key={b.id} bromide={b} />
          ))}
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack gap="4">
      {sizeSelector}
      {grid.members.map((m) => (
        <Stack key={m.id} gap="1.5">
          <HStack gap="2" alignItems="center">
            <Box style={{ backgroundColor: m.color }} borderRadius="full" w="2.5" h="2.5" />
            <Text fontSize="sm" fontWeight="bold">
              {m.name}
            </Text>
          </HStack>
          <Grid gap="3" columns={{ base: 2, sm: 4, md: 6 }}>
            {grid.numbers.map((no) => {
              const b = grid.cell(m.id, no);
              if (!b) return null;
              return <ImageCell key={b.id} bromide={b} member={m} />;
            })}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}

function ImageCell({ bromide, member }: { bromide: Bromide; member?: Member }) {
  const { toast } = useToaster();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const color = member?.color ?? '#FF5FA2';

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const { url, mode } = await uploadBromideImage(file, bromide.id);
      catalogActions.setBromideImage(bromide.id, url);
      toast({
        title: '画像を登録しました',
        description: mode === 'cloud' ? 'クラウドに保存しました' : 'この端末に保存しました',
        type: 'success'
      });
    } catch {
      toast({ title: '登録に失敗しました', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap="1.5">
      <Box
        position="relative"
        aspectRatio="3 / 4"
        borderColor="board.border"
        borderRadius="lg"
        borderWidth="1px"
        w="full"
        bgColor="board.tile"
        overflow="hidden"
      >
        {bromide.imageUrl ? (
          <Img
            src={bromide.imageUrl}
            alt=""
            inset="0"
            position="absolute"
            objectFit="cover"
            w="full"
            h="full"
          />
        ) : (
          <Stack
            style={{
              background: `linear-gradient(150deg, ${color}24 0%, ${color}0d 60%, transparent 100%)`
            }}
            inset="0"
            position="absolute"
            justifyContent="center"
            alignItems="center"
          >
            <Text textStyle="display" style={{ color }} fontSize="2xl" lineHeight="1">
              {bromide.no}
            </Text>
          </Stack>
        )}
        {busy ? (
          <Box
            display="flex"
            inset="0"
            position="absolute"
            justifyContent="center"
            alignItems="center"
            bgColor="board.canvas"
            opacity={0.8}
          >
            <Spinner />
          </Box>
        ) : null}
      </Box>

      <styled.input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = '';
        }}
        display="none"
      />
      <HStack gap="1" justifyContent="center">
        <Box
          as="button"
          onClick={() => inputRef.current?.click()}
          cursor="pointer"
          display="flex"
          gap="1"
          alignItems="center"
          borderColor="board.border"
          borderRadius="md"
          borderWidth="1px"
          py="1"
          px="2"
          color="fg.muted"
          fontSize="2xs"
          fontWeight="bold"
          bgColor="board.panel"
          _hover={{ borderColor: 'accent.default', color: 'accent.text' }}
        >
          <FaImage size={10} />
          画像
        </Box>
        {bromide.imageUrl ? (
          <Box
            as="button"
            aria-label="画像を削除"
            onClick={() => catalogActions.setBromideImage(bromide.id, null)}
            cursor="pointer"
            display="flex"
            alignItems="center"
            borderColor="board.border"
            borderRadius="md"
            borderWidth="1px"
            py="1"
            px="2"
            color="fg.muted"
            bgColor="board.panel"
            _hover={{ color: 'red.10', borderColor: 'red.7' }}
          >
            <FaTrash size={10} />
          </Box>
        ) : null}
      </HStack>
    </Stack>
  );
}
