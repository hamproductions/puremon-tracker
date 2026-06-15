import { FaCheck } from 'react-icons/fa6';
import { Box, HStack, Wrap } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Member } from '~/types';

interface MemberFilterProps {
  members: Member[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onAll: () => void;
}

export function MemberFilter({ members, selected, onToggle, onAll }: MemberFilterProps) {
  const allActive = selected.size === 0 || selected.size === members.length;

  return (
    <Wrap gap="1.5" alignItems="center">
      <Box
        as="button"
        onClick={onAll}
        borderColor={allActive ? 'accent.default' : 'board.border'}
        borderRadius="full"
        borderWidth="1px"
        py="1"
        px="3"
        color={allActive ? 'accent.fg' : 'fg.muted'}
        fontSize="xs"
        fontWeight="bold"
        bgColor={allActive ? 'accent.default' : 'board.panel'}
        transition="all 0.12s"
        _hover={{ borderColor: 'accent.default' }}
      >
        すべて
      </Box>
      {members.map((m) => {
        const active = selected.has(m.id);
        return (
          <HStack
            as="button"
            key={m.id}
            onClick={() => onToggle(m.id)}
            style={
              active
                ? { backgroundColor: m.color, borderColor: m.color, color: '#ffffff' }
                : undefined
            }
            cursor="pointer"
            gap="1.5"
            borderColor={active ? undefined : 'board.border'}
            borderRadius="full"
            borderWidth="1px"
            py="1"
            px="2.5"
            bgColor={active ? undefined : 'board.panel'}
            opacity={active ? 1 : 0.7}
            transition="all 0.12s"
            _hover={{ opacity: 1 }}
          >
            {active ? (
              <FaCheck size={9} />
            ) : (
              <Box style={{ backgroundColor: m.color }} borderRadius="full" w="2.5" h="2.5" />
            )}
            <Text fontSize="xs" fontWeight="medium">
              {m.nickname}
            </Text>
          </HStack>
        );
      })}
    </Wrap>
  );
}
