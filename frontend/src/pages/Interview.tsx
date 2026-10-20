import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Box, Button, Flex, FormControl, FormLabel, Heading, HStack, SimpleGrid, Text, VStack, useToast } from '@chakra-ui/react'
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdGraphicEq, MdMic, MdReplay, MdStop, MdTipsAndUpdates } from 'react-icons/md'
import DifficultyPicker from '../components/Interview/DifficultyPicker'
import QuestionCard from '../components/Interview/QuestionCard'
import VoiceSessionReview from '../components/Interview/VoiceSessionReview'
import PageHeader from '../components/UI/PageHeader'
import {
  fetchAudioObjectUrl,
  finishVoiceSession,
  getSubject,
  startVoiceSession,
  submitVoiceAnswer,
  type Difficulty,
  type SubjectDetail,
  type VoiceSession,
} from '../lib/api'
import { WavRecorder } from '../lib/wavRecorder'

type Phase = 'idle' | 'recording' | 'thinking'

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) return error.response?.data?.detail ?? error.message
  return error instanceof Error ? error.message : 'Something went wrong'
}

const isDifficulty = (value: string | null): value is Difficulty =>
  value === 'Easy' || value === 'Medium' || value === 'Hard'

const STEPS = [
  ['Listen', 'The interviewer asks a question out loud.'],
  ['Answer', 'Tap record, speak naturally, then tap stop.'],
  ['Learn', 'Get a score and tips, then the next question.'],
]

const Interview: React.FC = () => {
  const [params] = useSearchParams()
  // Arriving from a subject page fixes the topic; otherwise the user types their own.
  const subjectSlug = params.get('subject')
  const topicSlug = params.get('topic')
  const fromCatalog = Boolean(subjectSlug && topicSlug)

  const [difficulty, setDifficulty] = useState<Difficulty>(isDifficulty(params.get('difficulty')) ? (params.get('difficulty') as Difficulty) : 'Medium')
  const [catalogSubject, setCatalogSubject] = useState<SubjectDetail | null>(null)
  const [session, setSession] = useState<VoiceSession | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const recorder = useRef(new WavRecorder())
  const player = useRef<HTMLAudioElement | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (fromCatalog && subjectSlug) getSubject(subjectSlug).then(setCatalogSubject).catch(() => undefined)
  }, [fromCatalog, subjectSlug])

  const catalogTopic = catalogSubject?.topics.find((t) => t.slug === topicSlug)

  const play = async (sessionId: string, name: string | null) => {
    if (!name) return
    player.current?.pause()
    try {
      player.current = new Audio(await fetchAudioObjectUrl(sessionId, name))
      await player.current.play()
    } catch {
      // Blocked autoplay or a failed download: the Replay button still works.
    }
  }

  const latestQuestionAudio = (s: VoiceSession) => s.turns[s.turns.length - 1]?.question_audio ?? null

  const run = async (work: () => Promise<VoiceSession>, speak: (s: VoiceSession) => string | null) => {
    setPhase('thinking')
    try {
      const next = await work()
      setSession(next)
      void play(next.id, speak(next))
    } catch (error) {
      toast({ title: 'Request failed', description: errorMessage(error), status: 'error' })
    } finally {
      setPhase('idle')
    }
  }

  const begin = () => {
    if (fromCatalog && subjectSlug && topicSlug) {
      void run(() => startVoiceSession({ subject_slug: subjectSlug, topic_slug: topicSlug, difficulty }), latestQuestionAudio)
    }
  }

  const toggleRecording = async () => {
    if (!session) return
    if (phase === 'idle') {
      player.current?.pause()
      try {
        await recorder.current.start()
        setPhase('recording')
      } catch {
        toast({ title: 'Microphone unavailable', description: 'Allow microphone access and try again.', status: 'warning' })
      }
      return
    }
    const { blob, durationSeconds } = await recorder.current.stop()
    if (durationSeconds < 1) {
      setPhase('idle')
      toast({ title: 'Recording too short', status: 'info' })
      return
    }
    void run(() => submitVoiceAnswer(session.id, blob, durationSeconds), latestQuestionAudio)
  }

  const finish = () => {
    if (!session) return
    void run(() => finishVoiceSession(session.id), (s) => s.closing_audio)
  }

  if (!session && !fromCatalog) return <Navigate to="/dashboard" replace />

  if (!session) {
    return (
      <Box p={{ base: 4, md: 6 }} maxW="980px">
        <PageHeader
          eyebrow="AI Interview"
          title="Voice interview"
          subtitle="Answer out loud, like in the real thing. Each answer is transcribed, scored and saved."
        />
        <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={5} alignItems="start">
          <Box gridColumn={{ lg: 'span 3' }} bg="surface" border="1px solid" borderColor="line" borderRadius="2xl" p={{ base: 5, md: 7 }} boxShadow="0 2px 12px rgba(4,120,87,0.07)">
            <VStack align="stretch" spacing={5}>
              <Box bg="brand.50" border="1px solid" borderColor="brand.100" borderRadius="xl" p={4}>
                <Text fontSize="xs" color="brand.600" fontWeight={600} textTransform="uppercase" letterSpacing="0.1em">Topic</Text>
                <Text fontFamily="heading" fontWeight={600} fontSize="lg" color="#142D26">
                  {catalogSubject && catalogTopic ? `${catalogSubject.name} · ${catalogTopic.name}` : 'Loading topic…'}
                </Text>
                <Text fontSize="sm" color="muted">Your answers are scored and saved to this topic.</Text>
              </Box>
              <FormControl as="fieldset">
                <FormLabel as="legend">Difficulty</FormLabel>
                <DifficultyPicker value={difficulty} onChange={setDifficulty} />
              </FormControl>
              <Button
                size="lg"
                colorScheme="teal"
                leftIcon={<MdMic />}
                onClick={begin}
                isLoading={phase === 'thinking'}
                loadingText="Preparing your first question"
              >
                Start interview
              </Button>
            </VStack>
          </Box>

          <Box gridColumn={{ lg: 'span 2' }} bg="brand.50" border="1px solid" borderColor="brand.100" borderRadius="2xl" p={{ base: 5, md: 6 }}>
            <HStack mb={4} color="brand.700"><MdTipsAndUpdates size={20} /><Heading size="sm">How it works</Heading></HStack>
            <VStack align="stretch" spacing={4}>
              {STEPS.map(([title, body], i) => (
                <HStack key={title} align="start" spacing={3}>
                  <Flex flexShrink={0} align="center" justify="center" w={7} h={7} borderRadius="full" bg="brand.500" color="white" fontSize="sm" fontWeight={700}>{i + 1}</Flex>
                  <Box>
                    <Text fontWeight={600} fontSize="sm" color="#142D26">{title}</Text>
                    <Text fontSize="sm" color="muted">{body}</Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
            <Text fontSize="xs" color="muted" mt={5}>Tip: use a quiet room and allow microphone access when asked.</Text>
          </Box>
        </SimpleGrid>
      </Box>
    )
  }

  const current = session.turns[session.turns.length - 1]
  const done = session.status === 'completed'
  const backTo = session.subject_slug ? `/subjects/${session.subject_slug}` : '/history'
  const recording = phase === 'recording'
  const thinking = phase === 'thinking'
  const answered = session.turns.filter((t) => t.answer_audio).length
  const statusText = recording
    ? 'Listening… speak your answer, then tap stop.'
    : thinking
      ? 'Scoring your answer and preparing the next question…'
      : 'Your turn. Tap the mic when you are ready.'

  return (
    <Box p={{ base: 4, md: 6 }} maxW="900px">
      <PageHeader
        eyebrow={`${session.difficulty} · ${done ? 'Completed' : `${answered} answered`}`}
        title={`${session.topic}: ${session.subtopic}`}
        subtitle={`Saved automatically. Review it any time in ${session.subject_slug ? 'this module' : 'History'}.`}
      />

      {done ? (
        <>
          <VoiceSessionReview session={session} />
          <HStack mt={5} spacing={3}>
            <Button as={RouterLink} to={backTo} colorScheme="teal">{session.subject_slug ? 'Back to module' : 'View history'}</Button>
            <Button variant="ghost" onClick={() => setSession(null)}>New interview</Button>
          </HStack>
        </>
      ) : (
        <>
          <QuestionCard question={current.question_text} number={current.index + 1} />

          <Flex direction="column" align="center" bg="surface" border="1px solid" borderColor="line" borderRadius="2xl" mt={5} px={6} py={8} boxShadow="0 2px 12px rgba(4,120,87,0.07)">
            <Box position="relative" w="96px" h="96px">
              {recording && (
                <motion.div
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(220,38,38,0.25)' }}
                  animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <Button
                position="relative"
                w="96px"
                h="96px"
                borderRadius="full"
                colorScheme={recording ? 'red' : 'teal'}
                onClick={toggleRecording}
                isDisabled={thinking}
                isLoading={thinking}
                aria-label={recording ? 'Stop and send answer' : 'Record answer'}
                boxShadow={recording ? '0 10px 28px rgba(220,38,38,0.4)' : '0 10px 28px rgba(4,120,87,0.4)'}
              >
                {recording ? <MdStop size={38} /> : <MdMic size={38} />}
              </Button>
            </Box>
            <Text mt={4} fontWeight={600} color="#142D26">{recording ? 'Recording' : thinking ? 'Working on it' : 'Record answer'}</Text>
            <Text mt={1} fontSize="sm" color="muted" textAlign="center" aria-live="polite">{statusText}</Text>

            <HStack mt={6} spacing={3} flexWrap="wrap" justify="center">
              <Button size="sm" variant="outline" leftIcon={<MdReplay />} onClick={() => void play(session.id, current.question_audio)} isDisabled={phase !== 'idle'}>
                Replay question
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<MdGraphicEq />} onClick={finish} isDisabled={phase !== 'idle'}>
                End interview
              </Button>
            </HStack>
          </Flex>

          {session.turns.length > 1 && (
            <Box mt={8}>
              <Heading size="sm" mb={3}>So far</Heading>
              <VoiceSessionReview session={{ ...session, turns: session.turns.slice(0, -1) }} />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default Interview
