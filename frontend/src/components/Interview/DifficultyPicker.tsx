import React from 'react'
import { Box, HStack, Text } from '@chakra-ui/react'
import type { Difficulty } from '../../lib/api'

const LEVELS: { value: Difficulty; hint: string }[] = [
  { value: 'Easy', hint: 'Warm-up' },
  { value: 'Medium', hint: 'Interview-ready' },
  { value: 'Hard', hint: 'Stretch' },
]

// Segmented control: one tap per level instead of a dropdown.
const DifficultyPicker: React.FC<{ value: Difficulty; onChange: (d: Difficulty) => void }> = ({ value, onChange }) => (
  <HStack spacing={2} role="radiogroup" aria-label="Difficulty">
    {LEVELS.map((level) => {
      const active = level.value === value
      return (
        <Box
          key={level.value}
          as="button"
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(level.value)}
          flex="1"
          textAlign="left"
          px={4}
          py={3}
          borderRadius="xl"
          border="1px solid"
          borderColor={active ? 'brand.500' : 'line'}
          bg={active ? 'brand.50' : 'white'}
          boxShadow={active ? '0 0 0 1px #047857' : 'none'}
          transition="all .15s"
          _hover={{ borderColor: 'brand.400' }}
        >
          <Text fontWeight={600} fontSize="sm" color={active ? 'brand.700' : '#142D26'}>{level.value}</Text>
          <Text fontSize="xs" color="muted">{level.hint}</Text>
        </Box>
      )
    })}
  </HStack>
)

export default DifficultyPicker
