import { FaArrowLeft } from 'react-icons/fa6';
import { usePageContext } from 'vike-react/usePageContext';
import { Grid, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { CollectionCard } from '~/components/collection/CollectionCard';
import { CollectionDetail } from '~/components/collection/CollectionDetail';
import { Metadata } from '~/components/layout/Metadata';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';
import { useOwnership } from '~/hooks/useOwnership';
import { toAppUrl } from '~/utils/url';

export default function Page() {
  const ctx = usePageContext();
  const id = ctx.urlParsed.search['c'];
  const catalog = useCatalog();
  const { ownership, toggle, setCount } = useOwnership();
  const mounted = useMounted();

  if (id) {
    const collection = catalog.collections.find((c) => c.id === id);
    if (!collection) {
      return (
        <>
          <Metadata title="コレクションが見つかりません" helmet />
          <Stack gap="4" alignItems="center" py="16" textAlign="center">
            <Heading textStyle="display" fontSize="2xl">
              コレクションが見つかりません
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              指定されたコレクションは存在しないか、削除された可能性があります。
            </Text>
            <Link href={toAppUrl('/collections')} _hover={{ textDecoration: 'none' }}>
              <Button variant="outline">
                <FaArrowLeft />
                コレクション一覧へ
              </Button>
            </Link>
          </Stack>
        </>
      );
    }
    return (
      <>
        <Metadata title={collection.title} helmet />
        <CollectionDetail
          catalog={catalog}
          collection={collection}
          ownership={ownership}
          mounted={mounted}
          toggle={toggle}
          setCount={setCount}
        />
      </>
    );
  }

  return (
    <>
      <Metadata title="コレクション" helmet />
      <Stack gap="5">
        <Stack gap="1.5">
          <Heading textStyle="display" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1">
            コレクション
          </Heading>
          <Text color="fg.muted" fontSize={{ base: 'sm', md: 'md' }}>
            タップしてブロマイドの所持・未所持を記録しよう。新しいコレクションが上に並びます。
          </Text>
        </Stack>

        <Grid gap="3.5" columns={{ base: 1, sm: 2, lg: 3 }}>
          {catalog.collections.map((c) => (
            <CollectionCard
              key={c.id}
              catalog={catalog}
              collection={c}
              ownership={ownership}
              mounted={mounted}
            />
          ))}
        </Grid>
      </Stack>
    </>
  );
}
