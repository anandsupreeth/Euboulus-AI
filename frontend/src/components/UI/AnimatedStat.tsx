import React from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

interface Props { label: string; value: string; hint?: string; icon?: React.ElementType }

const AnimatedStat: React.FC<Props> = ({ label, value, hint, icon: IconComp }) => (
  <MotionBox
    bg="surface"
    border="1px solid"
    borderColor="line"
    p={5}
    borderRadius="2xl"
    boxShadow="0 2px 12px rgba(4,120,87,0.07)"
    whileHover={{ y: -3, boxShadow: '0 12px 28px -12px rgba(4,120,87,0.25)' }}
    initial={{ y: 8, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.4 }}
  >
    <Flex justify="space-between" align="start">
      <Box>
        <Text color="muted" fontSize="xs" fontWeight={500} textTransform="uppercase" letterSpacing="0.08em">{label}</Text>
        <Text fontFamily="heading" fontWeight={700} fontSize="3xl" lineHeight="1.2" mt={1} color="#142D26">{value}</Text>
        {hint && <Text color="muted" fontSize="xs" mt={1}>{hint}</Text>}
      </Box>
      {IconComp && (
        <Flex align="center" justify="center" w={10} h={10} borderRadius="xl" bg="brand.50" color="brand.500" flexShrink={0}>
          <IconComp size={20} />
        </Flex>
      )}
    </Flex>
  </MotionBox>
)

export default AnimatedStat
