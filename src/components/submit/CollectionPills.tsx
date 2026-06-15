import { Wrap } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Collection } from '~/types';

interface CollectionPillsProps {
  collections: Collection[];
  value: string | null;
  onSelect: (id: string) => void;
}

export function CollectionPills({ collections, value, onSelect }: CollectionPillsProps) {
  return (
    <Wrap gap="2">
      {collections.map((c) => {
        const active = c.id === value;
        return (
          <Text
            as="button"
            key={c.id}
            onClick={() => onSelect(c.id)}
            cursor="pointer"
            borderColor={active ? 'accent.default' : 'board.border'}
            borderRadius="full"
            borderWidth="1px"
            py="1.5"
            px="3.5"
            color={active ? 'accent.fg' : 'fg.muted'}
            fontSize="sm"
            fontWeight="bold"
            bgColor={active ? 'accent.default' : 'board.panel'}
            transition="all 0.12s"
            _hover={{ borderColor: 'accent.default' }}
          >
            {c.title}
          </Text>
        );
      })}
    </Wrap>
  );
}
