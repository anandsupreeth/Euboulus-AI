import React from 'react'
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { FiBarChart2, FiBookOpen, FiFileText } from 'react-icons/fi'

const SERIF = "'Newsreader', 'Georgia', serif"

export const BrandMark: React.FC<{ size?: string }> = ({ size = '2xl' }) => (
  <Text fontFamily="heading" fontWeight={700} fontSize={size} letterSpacing="-0.02em" color="#0B3B30" lineHeight={1}>
    Euboulos <Box as="span" color="#1E9A6E">AI</Box>
  </Text>
)

const features = [
  { icon: FiBarChart2, title: 'Personalized practice', text: 'Role-specific, adaptive questions.' },
  { icon: FiFileText, title: 'Actionable feedback', text: 'Detailed insights to improve.' },
  { icon: FiBookOpen, title: 'Structured learning', text: 'Build skills with a clear path.' },
]

interface Props {
  headline?: string
  subtitle?: string
  // When given, replaces the headline/features hero on large screens.
  visual?: React.ReactNode
  children: React.ReactNode
}

// Split-screen shell shared by Sign in and Create account: marketing copy on the
// left (hidden on small screens), the form card on the right.
const AuthLayout: React.FC<Props> = ({ headline, subtitle, visual, children }) => (
  <Box minH="100vh" position="relative" overflow="hidden" bg="#F6FBF8">
    {/* decorative shapes */}
    <Box position="absolute" top="150px" right="0" w="160px" h="480px" opacity={0.5} pointerEvents="none" display={{ base: 'none', lg: 'block' }}
      backgroundImage="radial-gradient(rgba(11,59,48,0.3) 1px, transparent 1px)" backgroundSize="26px 26px" />

    <Flex position="relative" direction="column" minH="100vh" px={{ base: 5, md: 10, lg: '140px' }} py={{ base: 6, md: 8 }} sx={{ '@media (max-height: 820px)': { py: 4 } }}>
      <Flex flex="1" align="center" justify="space-between" gap={{ base: 0, lg: 12 }} py={{ base: 4, lg: 6 }} sx={{ '@media (max-height: 820px)': { py: 2 } }}>
        {visual ? (
          <Box flex="1" maxW="560px" alignSelf="stretch" position="relative" display={{ base: 'none', lg: 'block' }}>
            <Box position="absolute" inset={0}>{visual}</Box>
          </Box>
        ) : (
        <VStack align="flex-start" spacing={6} flex="1" maxW="560px" display={{ base: 'none', lg: 'flex' }}>
          <Text fontFamily={SERIF} fontWeight={500} fontSize="62px" lineHeight={1.02} letterSpacing="-0.03em" color="#0B2F26">
            {headline}
          </Text>
          <Text fontSize="xl" color="muted" lineHeight={1.5} maxW="480px">{subtitle}</Text>
          <VStack align="stretch" spacing={4} pt={2}>
            {features.map(({ icon: Icon, title, text }) => (
              <HStack key={title} spacing={5}>
                <Flex w="68px" h="60px" borderRadius="xl" bg="rgba(167,226,200,0.35)" align="center" justify="center" color="brand.500">
                  <Icon size={24} />
                </Flex>
                <Box>
                  <Text fontWeight={600} color="#0B2F26">{title}</Text>
                  <Text fontSize="sm" color="muted">{text}</Text>
                </Box>
              </HStack>
            ))}
          </VStack>
        </VStack>
        )}

        <Box w="full" maxW={{ base: '480px', lg: '570px' }} mx={{ base: 'auto', lg: 0 }} flexShrink={0}>
          <VStack spacing={1} mb={{ base: 5, lg: 6 }} sx={{ '@media (max-height: 820px)': { mb: 4 } }}>
            <BrandMark />
            <Text color="muted" fontSize="sm">Prepare. Perform. Progress.</Text>
          </VStack>
          {children}
        </Box>
      </Flex>

    </Flex>
  </Box>
)

export default AuthLayout
