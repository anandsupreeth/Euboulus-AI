import React from 'react'
import { Box, Flex, Heading, Progress, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdArrowForward } from 'react-icons/md'
import ScoreBadge from './ScoreBadge'
import type { SubjectSummary } from '../../lib/api'

const MotionBox = motion(Box)

export const initials = (name: string) =>
  name.split(/[\s/&-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

const SubjectCard: React.FC<{ subject: SubjectSummary }> = ({ subject }) => {
  const started = subject.attempts > 0
  const progress = Math.min(100, subject.attempts * 10)
  return (
    <MotionBox
      as={RouterLink}
      to={`/subjects/${subject.slug}`}
      display="flex"
      flexDirection="column"
      h="full"
      bg="surface"
      border="1px solid"
      borderColor="line"
      borderRadius="2xl"
      p={5}
      boxShadow="0 1px 2px rgba(20,45,38,0.04), 0 4px 14px rgba(4,120,87,0.05)"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      role="group"
      _hover={{ borderColor: 'brand.300', textDecoration: 'none', boxShadow: '0 18px 36px -18px rgba(4,120,87,0.35)' }}
    >
      <Flex justify="space-between" align="start" mb={4}>
        <Flex align="center" justify="center" w={11} h={11} borderRadius="xl" bgGradient="linear(to-br, brand.50, brand.100)" color="brand.700" fontFamily="heading" fontWeight={700} fontSize="md" border="1px solid" borderColor="brand.100">
          {initials(subject.name)}
        </Flex>
        {started
          ? <ScoreBadge score={subject.average_score} suffix="%" />
          : <Text fontSize="xs" fontWeight={600} color="brand.600" bg="brand.50" border="1px solid" borderColor="brand.100" px={2.5} py={0.5} borderRadius="full">New</Text>}
      </Flex>
      <Heading size="sm" color="#142D26" mb={1}>{subject.name}</Heading>
      <Text fontSize="sm" color="muted" noOfLines={2} mb={5} flex="1">{subject.description}</Text>
      <Flex justify="space-between" fontSize="xs" color="muted" mb={1.5}>
        <Text>{subject.topic_count} topics</Text>
        <Text>{subject.attempts} {subject.attempts === 1 ? 'answer' : 'answers'}</Text>
      </Flex>
      <Progress value={progress} size="xs" borderRadius="full" mb={4} aria-label={`${subject.name} practice progress`} />
      <Flex align="center" gap={1} fontSize="sm" fontWeight={600} color="brand.600" transition="transform .2s" _groupHover={{ transform: 'translateX(3px)' }}>
        {started ? 'Continue practising' : 'Start practising'} <MdArrowForward />
      </Flex>
    </MotionBox>
  )
}

export default SubjectCard
