import React, { useEffect, useState } from 'react'
import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Alert, AlertIcon, Badge, Box, Button, Flex, Heading,
  HStack, SimpleGrid, Skeleton, Table, Thead, Tbody, Tr, Th, Td, Text,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { MdAutoGraph, MdHistory, MdMic, MdTimer } from 'react-icons/md'
import VoiceSessionReview from '../components/Interview/VoiceSessionReview'
import AnimatedStat from '../components/UI/AnimatedStat'
import EmptyState from '../components/UI/EmptyState'
import PageHeader from '../components/UI/PageHeader'
import ScoreBadge from '../components/UI/ScoreBadge'
import { getInterviews, getVoiceSessions, type InterviewRecord, type VoiceSession } from '../lib/api'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

const History: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([])
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    Promise.all([getInterviews(), getVoiceSessions()])
      .then(([text, voice]) => {
        setInterviews(text)
        setVoiceSessions(voice)
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false))
  }, [])

  const scored = voiceSessions.filter((s) => s.feedback)
  const average = scored.length
    ? Math.round(scored.reduce((sum, s) => sum + (s.feedback?.overall_score ?? 0), 0) / scored.length)
    : null
  const answers = voiceSessions.reduce((sum, s) => sum + s.turns.filter((t) => t.answer_audio).length, 0)

  return (
    <Box p={{ base: 4, md: 6 }} maxW="1100px">
      <PageHeader
        eyebrow="History"
        title="Interview history"
        subtitle="Every session is saved. Open one to replay the audio and re-read your feedback."
      />

      {hasError && <Alert status="error" borderRadius="xl" mb={4}><AlertIcon />Could not load history. Check that the backend is running.</Alert>}

      {isLoading ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
            {[0, 1, 2].map((i) => <Skeleton key={i} h="108px" borderRadius="2xl" />)}
          </SimpleGrid>
          {[0, 1, 2].map((i) => <Skeleton key={i} h="64px" borderRadius="2xl" mb={3} />)}
        </>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
            <AnimatedStat icon={MdHistory} label="Voice sessions" value={String(voiceSessions.length)} hint={`${scored.length} completed`} />
            <AnimatedStat icon={MdAutoGraph} label="Average score" value={average === null ? '–' : `${average}/100`} hint="Completed sessions" />
            <AnimatedStat icon={MdTimer} label="Answers given" value={String(answers)} hint="Across all sessions" />
          </SimpleGrid>

          <Heading size="md" mb={3}>Voice interviews</Heading>
          {voiceSessions.length === 0 ? (
            <Box mb={8}>
              <EmptyState
                icon={MdMic}
                title="No voice interviews yet"
                action={<Button as={RouterLink} to="/dashboard" size="sm" colorScheme="teal">Choose a module</Button>}
              >
                Practise a module and your sessions will show up here with audio, transcripts and scores.
              </EmptyState>
            </Box>
          ) : (
            <Accordion allowMultiple mb={8}>
              {voiceSessions.map((session) => (
                <AccordionItem
                  key={session.id}
                  border="1px solid"
                  borderColor="line"
                  borderRadius="2xl"
                  mb={3}
                  bg="surface"
                  overflow="hidden"
                  boxShadow="0 2px 12px rgba(4,120,87,0.05)"
                  _hover={{ borderColor: 'brand.300' }}
                >
                  <AccordionButton px={5} py={4} _hover={{ bg: 'brand.50' }}>
                    <Flex flex="1" textAlign="left" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={{ base: 2, md: 4 }}>
                      <Box flex="1" minW={0}>
                        <Text fontWeight={600} color="#142D26" noOfLines={1}>{session.topic}: {session.subtopic}</Text>
                        <Text fontSize="xs" color="muted">
                          {formatDate(session.created_at)} · {formatTime(session.created_at)} · {session.turns.filter((t) => t.answer_audio).length} answered
                        </Text>
                      </Box>
                      <HStack spacing={2}>
                        <Badge bg="brand.50" color="brand.700">{session.difficulty}</Badge>
                        {session.feedback
                          ? <ScoreBadge score={session.feedback.overall_score} />
                          : session.status === 'active' && <Badge colorScheme="orange">Unfinished</Badge>}
                      </HStack>
                    </Flex>
                    <AccordionIcon ml={3} color="brand.500" />
                  </AccordionButton>
                  <AccordionPanel px={5} pb={5} pt={2} borderTop="1px solid" borderColor="line">
                    <VoiceSessionReview session={session} />
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {interviews.length > 0 && (
            <>
              <Heading size="md" mb={3}>Text interviews</Heading>
              <Box bg="surface" border="1px solid" borderColor="line" borderRadius="2xl" overflowX="auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th>Score</Th>
                      <Th>Duration</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {interviews.map((interview) => (
                      <Tr key={interview.id}>
                        <Td>{formatDate(interview.created_at)}</Td>
                        <Td>{interview.topic} · {interview.difficulty}</Td>
                        <Td><ScoreBadge score={interview.feedback.technical_score} suffix="%" /></Td>
                        <Td>{Math.ceil(interview.duration_seconds / 60)}m</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  )
}

export default History
