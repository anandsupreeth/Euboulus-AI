import React from 'react'
import { Box, Text } from '@chakra-ui/react'

interface Props {
  icon: React.ElementType
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
}

const EmptyState: React.FC<Props> = ({ icon: IconComp, title, children, action }) => (
  <Box textAlign="center" bg="surface" border="1px dashed" borderColor="brand.200" borderRadius="2xl" px={6} py={10}>
    <Box display="inline-flex" alignItems="center" justifyContent="center" w={12} h={12} borderRadius="full" bg="brand.50" color="brand.500" mb={3}>
      <IconComp size={22} />
    </Box>
    <Text fontWeight={600} color="#142D26">{title}</Text>
    {children && <Text color="muted" fontSize="sm" mt={1} mb={action ? 4 : 0}>{children}</Text>}
    {action}
  </Box>
)

export default EmptyState
