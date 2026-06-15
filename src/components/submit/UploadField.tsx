import { useRef } from 'react';
import { FaCloudArrowUp, FaImage } from 'react-icons/fa6';
import { Box, Center, Stack, styled } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';

const Img = styled('img');

interface UploadFieldProps {
  preview: string | null;
  onPick: (file: File) => void;
}

export function UploadField({ preview, onPick }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box>
      <styled.input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = '';
        }}
        display="none"
      />
      <Box
        as="button"
        onClick={() => inputRef.current?.click()}
        cursor="pointer"
        borderColor="board.border"
        borderRadius="xl"
        borderWidth="2px"
        w="full"
        bgColor="board.panel"
        overflow="hidden"
        transition="border-color 0.12s"
        borderStyle="dashed"
        _hover={{ borderColor: 'accent.default' }}
      >
        {preview ? (
          <Box position="relative" aspectRatio="3 / 4" maxH="64" mx="auto">
            <Img src={preview} alt="プレビュー" objectFit="contain" w="full" h="full" />
            <Center
              position="absolute"
              right="2"
              bottom="2"
              gap="1.5"
              borderRadius="md"
              py="1"
              px="2"
              color="fg.muted"
              fontSize="xs"
              bgColor="bg.default"
              boxShadow="sm"
            >
              <FaImage size={11} />
              変更
            </Center>
          </Box>
        ) : (
          <Stack gap="1.5" alignItems="center" py="10" color="fg.muted">
            <Box color="accent.default" fontSize="2xl">
              <FaCloudArrowUp />
            </Box>
            <Text color="fg.default" fontSize="sm" fontWeight="bold">
              画像を選ぶ
            </Text>
            <Text fontSize="xs">タップしてブロマイドの写真を選択</Text>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
