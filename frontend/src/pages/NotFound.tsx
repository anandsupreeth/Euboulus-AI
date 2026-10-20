import React from 'react'
import { Box, Heading, Text, Button } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

const NotFound: React.FC = () => (
  <Box p={16} textAlign="center">
    <Heading fontSize="7xl" color="brand.500">404</Heading>
    <Text mb={4} color="muted">Page not found</Text>
    <Button as={RouterLink} to="/dashboard" colorScheme="teal">Go Home</Button>
  </Box>
)

export default NotFound
