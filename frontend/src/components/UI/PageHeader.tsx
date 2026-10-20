import React from 'react'
import { Box, Flex, Heading, Text } from '@chakra-ui/react'

interface Props {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

// Consistent page title block: small eyebrow, heading, supporting line and an optional action on the right.
const PageHeader: React.FC<Props> = ({ eyebrow, title, subtitle, action }) => (
  <Flex align={{ base: 'start', md: 'end' }} justify="space-between" direction={{ base: 'column', md: 'row' }} gap={4} mb={6}>
    <Box>
      {eyebrow && (
        <Text fontSize="xs" fontWeight={600} color="brand.500" textTransform="uppercase" letterSpacing="0.12em" mb={1}>
          {eyebrow}
        </Text>
      )}
      <Heading size="lg">{title}</Heading>
      {subtitle && <Text color="muted" mt={1} maxW="60ch">{subtitle}</Text>}
    </Box>
    {action}
  </Flex>
)

export default PageHeader
