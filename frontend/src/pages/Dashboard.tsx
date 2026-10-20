import React, { useEffect, useMemo, useState } from 'react'
import { Alert, AlertIcon, Box, Button, Flex, Heading, Input, InputGroup, InputLeftElement, SimpleGrid, Skeleton, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdArrowForward, MdAutoGraph, MdCheckCircle, MdLibraryBooks, MdSearch } from 'react-icons/md'
import AnimatedStat from '../components/UI/AnimatedStat'
import EmptyState from '../components/UI/EmptyState'
import SubjectCard, { initials } from '../components/UI/SubjectCard'
import { getCatalogOverview, type CatalogOverview, type SubjectSummary } from '../lib/api'
import { useAuth } from '../lib/auth'

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

// Circular gauge for the overall average; falls back to an empty track before the first score.
const ScoreRing: React.FC<{ value: number | null }> = ({ value }) => {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  return (
    <Box position="relative" w="140px" h="140px" flexShrink={0}>
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={value === null ? 'No score yet' : `Average score ${value} percent`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="10" />
        {value !== null && (
          <motion.circle
            cx="70" cy="70" r={radius} fill="none" stroke="#A7F3D0" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - Math.min(100, value) / 100) }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            transform="rotate(-90 70 70)"
          />
        )}
      </svg>
      <Flex position="absolute" inset={0} direction="column" align="center" justify="center">
        <Text fontFamily="heading" fontWeight={700} fontSize="3xl" lineHeight="1">{value === null ? '–' : `${value}%`}</Text>
        <Text fontSize="10px" letterSpacing="0.14em" textTransform="uppercase" opacity={0.75} mt={1}>Avg score</Text>
      </Flex>
    </Box>
  )
}

// Compact row used for "Pick up where you left off".
const RecentCard: React.FC<{ subject: SubjectSummary }> = ({ subject }) => (
  <Flex
    as={RouterLink}
    to={`/subjects/${subject.slug}`}
    align="center"
    gap={3}
    bg="surface"
    border="1px solid"
    borderColor="line"
    borderRadius="xl"
    p={3.5}
    transition="all .18s"
    _hover={{ textDecoration: 'none', borderColor: 'brand.300', boxShadow: '0 10px 24px -14px rgba(4,120,87,0.35)', transform: 'translateY(-2px)' }}
  >
    <Flex align="center" justify="center" w={10} h={10} borderRadius="lg" bg="brand.500" color="white" fontFamily="heading" fontWeight={700} fontSize="sm" flexShrink={0}>
      {initials(subject.name)}
    </Flex>
    <Box flex="1" minW={0}>
      <Text fontWeight={600} fontSize="sm" color="#142D26" noOfLines={1}>{subject.name}</Text>
      <Text fontSize="xs" color="muted">
        {subject.last_practiced ? `Last practised ${new Date(subject.last_practiced).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : `${subject.attempts} answers`}
      </Text>
    </Box>
    <Box color="brand.500"><MdArrowForward /></Box>
  </Flex>
)

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [overview, setOverview] = useState<CatalogOverview | null>(null)
  const [hasError, setHasError] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    getCatalogOverview().then(setOverview).catch(() => setHasError(true))
  }, [])

  const subjects = useMemo(() => overview?.categories.flatMap((c) => c.subjects) ?? [], [overview])
  const practised = subjects.filter((s) => s.attempts > 0).length
  const recent = useMemo(
    () => subjects.filter((s) => s.attempts > 0).sort((a, b) => (b.last_practiced ?? '').localeCompare(a.last_practiced ?? '')).slice(0, 3),
    [subjects],
  )

  const needle = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      (overview?.categories ?? [])
        .filter((c) => category === 'All' || c.category === category)
        .map((c) => ({ ...c, subjects: c.subjects.filter((s) => !needle || `${s.name} ${s.description}`.toLowerCase().includes(needle)) }))
        .filter((c) => c.subjects.length > 0),
    [overview, category, needle],
  )

  const firstName = user ? user.full_name.split(' ')[0] : ''
  const isNewUser = overview !== null && overview.total_attempts === 0

  return (
    <Box p={{ base: 4, md: 6 }} maxW="1180px" mx="auto">
      {/* Hero */}
      <Flex
        position="relative"
        overflow="hidden"
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'start', md: 'center' }}
        gap={6}
        bgGradient="linear(to-br, brand.800, brand.600 55%, brand.500)"
        color="white"
        borderRadius="3xl"
        px={{ base: 6, md: 10 }}
        py={{ base: 7, md: 9 }}
        mb={6}
        boxShadow="0 30px 60px -30px rgba(4,120,87,0.6)"
        sx={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        _before={{ content: '""', position: 'absolute', inset: 0, bgGradient: 'linear(to-br, rgba(5,63,49,0.96), rgba(6,95,70,0.9) 55%, rgba(4,120,87,0.85))' }}
        _after={{ content: '""', position: 'absolute', right: '-80px', top: '-100px', w: '320px', h: '320px', borderRadius: 'full', bg: 'rgba(110,231,183,0.14)', filter: 'blur(40px)' }}
      >
        <Box position="relative" zIndex={1} maxW="520px">
          <Text fontSize="xs" fontWeight={600} letterSpacing="0.14em" textTransform="uppercase" color="brand.200" mb={3}>
            {isNewUser ? 'Let’s get you started' : 'Your practice space'}
          </Text>
          <Heading as="h1" size="xl" color="white" lineHeight="1.15" mb={3}>
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </Heading>
          <Text color="rgba(255,255,255,0.82)">
            {isNewUser
              ? 'Pick a module below, answer out loud and get scored feedback after every question.'
              : `You have answered ${overview?.total_attempts ?? 0} questions so far. A short session today keeps the momentum going.`}
          </Text>
        </Box>
        {overview?.average_score != null && (
          <Box position="relative" zIndex={1} display={{ base: 'none', sm: 'block' }} alignSelf={{ base: 'center', md: 'auto' }}>
            <ScoreRing value={overview.average_score} />
          </Box>
        )}
      </Flex>

      {hasError && <Alert status="error" borderRadius="xl" mb={4}><AlertIcon />Could not load your modules. Check that the backend is running.</Alert>}

      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={9}>
        {overview ? (
          <>
            <AnimatedStat icon={MdCheckCircle} label="Questions answered" value={String(overview.total_attempts)} hint="Across all modules" />
            <AnimatedStat icon={MdAutoGraph} label="Average score" value={overview.average_score === null ? '–' : `${overview.average_score}%`} hint={overview.average_score === null ? 'Answer a question to get scored' : 'Across scored answers'} />
            <AnimatedStat icon={MdLibraryBooks} label="Modules practised" value={`${practised} / ${subjects.length}`} hint={practised === 0 ? 'Pick your first module' : 'Keep widening your range'} />
          </>
        ) : !hasError && [0, 1, 2].map((i) => <Skeleton key={i} h="112px" borderRadius="2xl" />)}
      </SimpleGrid>

      {/* Recent */}
      {recent.length > 0 && (
        <Box mb={10}>
          <Heading size="md" mb={4}>Pick up where you left off</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            {recent.map((subject) => <RecentCard key={subject.slug} subject={subject} />)}
          </SimpleGrid>
        </Box>
      )}

      {/* Catalog */}
      {overview && (
        <Flex id="modules" scrollMarginTop="80px" direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} mb={6}>
          <Box>
            <Heading size="md">Browse modules</Heading>
            <Text fontSize="sm" color="muted">{subjects.length} modules across {overview.categories.length} categories</Text>
          </Box>
          <InputGroup maxW={{ md: '300px' }}>
            <InputLeftElement pointerEvents="none" color="muted"><MdSearch size={18} /></InputLeftElement>
            <Input placeholder="Search modules" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search modules" />
          </InputGroup>
        </Flex>
      )}

      {overview && overview.categories.length > 1 && (
        <Flex gap={2} mb={7} flexWrap="wrap" role="tablist" aria-label="Filter by category">
          {['All', ...overview.categories.map((c) => c.category)].map((name) => {
            const active = name === category
            return (
              <Box
                key={name}
                as="button"
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(name)}
                fontSize="sm"
                fontWeight={active ? 600 : 500}
                px={4}
                py={1.5}
                borderRadius="full"
                border="1px solid"
                borderColor={active ? 'brand.500' : 'line'}
                bg={active ? 'brand.500' : 'white'}
                color={active ? 'white' : 'muted'}
                boxShadow={active ? '0 6px 14px rgba(4,120,87,0.25)' : 'none'}
                transition="all .15s"
                _hover={{ borderColor: 'brand.400', color: active ? 'white' : 'brand.700' }}
              >
                {name}
              </Box>
            )
          })}
        </Flex>
      )}

      {!overview && !hasError && (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
          {[0, 1, 2].map((i) => <Skeleton key={i} h="230px" borderRadius="2xl" />)}
        </SimpleGrid>
      )}

      {overview && visible.length === 0 && (
        <EmptyState icon={MdSearch} title="No modules match your search" action={<Button size="sm" variant="outline" onClick={() => { setQuery(''); setCategory('All') }}>Clear filters</Button>}>
          Try a different word or pick another category.
        </EmptyState>
      )}

      {visible.map((group) => (
        <Box key={group.category} mb={10}>
          <Flex align="center" gap={3} mb={4}>
            <Text fontSize="xs" fontWeight={700} letterSpacing="0.14em" textTransform="uppercase" color="brand.600">{group.category}</Text>
            <Box flex="1" h="1px" bg="line" />
            <Text fontSize="xs" color="muted">{group.subjects.length}</Text>
          </Flex>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
            {group.subjects.map((subject) => <SubjectCard key={subject.slug} subject={subject} />)}
          </SimpleGrid>
        </Box>
      ))}
    </Box>
  )
}

export default Dashboard
