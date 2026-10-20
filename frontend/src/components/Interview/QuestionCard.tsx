import React from 'react'
import { Box, Text } from '@chakra-ui/react'

interface Props { question: string; number?: number }

const QuestionCard: React.FC<Props> = ({ question, number }) => (
  <Box position="relative" bg="surface" border="1px solid" borderColor="line" p={{ base: 5, md: 7 }} borderRadius="2xl" boxShadow="0 2px 12px rgba(4,120,87,0.07)" overflow="hidden" _before={{ content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, w: '4px', bgGradient: 'linear(to-b, brand.500, brand.300)' }}>
    {number !== undefined && (
      <Text fontSize="xs" fontWeight={600} color="brand.500" textTransform="uppercase" letterSpacing="0.12em" mb={2}>Question {number}</Text>
    )}
    <Text fontFamily="heading" fontWeight={600} fontSize={{ base: 'lg', md: 'xl' }} lineHeight="1.5" color="#142D26">{question}</Text>
  </Box>
)

export default QuestionCard
