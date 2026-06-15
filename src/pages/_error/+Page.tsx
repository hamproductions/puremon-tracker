import { FaLayerGroup } from 'react-icons/fa6';
import { usePageContext } from 'vike-react/usePageContext';
import { Box, Center, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { toAppUrl } from '~/utils/url';

export default function Page() {
  const { is404 } = usePageContext();

  const title = is404 ? 'ページが見つかりません' : 'エラーが発生しました';
  const body = is404
    ? 'お探しのページは存在しないか、移動した可能性があります。'
    : '一時的な問題が発生しました。時間をおいて再度お試しください。';

  return (
    <Center py="16">
      <Stack gap="5" alignItems="center" maxW="md" textAlign="center">
        <Box color="accent.default" fontSize="5xl" fontWeight="bold">
          {is404 ? '404' : '500'}
        </Box>
        <Stack gap="1.5">
          <Heading fontSize="xl">{title}</Heading>
          <Text color="fg.muted" fontSize="sm">
            {body}
          </Text>
        </Stack>
        <Link href={toAppUrl('/')} _hover={{ textDecoration: 'none' }}>
          <Button variant="solid">
            <FaLayerGroup />
            ホームへ戻る
          </Button>
        </Link>
      </Stack>
    </Center>
  );
}
