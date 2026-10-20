import React, { useEffect, useRef, useState } from 'react'
import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Alert, AlertDialog, AlertDialogBody,
  AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertIcon, Badge, Box, Breadcrumb,
  BreadcrumbItem, BreadcrumbLink, Button, Flex, Heading, HStack, List, ListItem, Select, Spinner, Text, VStack,
  useDisclosure, useToast,
} from '@chakra-ui/react'
import { MdRestartAlt } from 'react-icons/md'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import AuthAudio from '../components/UI/AuthAudio'
import ScoreBadge from '../components/UI/ScoreBadge'
import {
  getSubject, getTopicAttempts, getTopicSummary, resetSubjectProgress,
  type Attempt, type Difficulty, type SubjectDetail, type TopicProgress, type TopicSummary,
} from '../lib/api'

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text fontSize="xs" color="muted" textTransform="uppercase" letterSpacing="0.08em" mb={1}>{children}</Text>
)

const AttemptCard: React.FC<{ attempt: Attempt }> = ({ attempt }) => (
  <Box bg="white" border="1px solid" borderColor="line" borderRadius="lg" p={4}>
    <HStack justify="space-between" align="start" mb={2} spacing={3}>
      <Text fontWeight="semibold" color="#142D26">{attempt.question_text}</Text>
      <ScoreBadge score={attempt.score} />
    </HStack>
    <Text fontSize="xs" color="muted" mb={3}>{new Date(attempt.created_at).toLocaleString()} · {attempt.difficulty}</Text>
    <Label>Your answer</Label>
    <Text fontSize="sm" mb={2}>{attempt.answer_text || '(nothing transcribed)'}</Text>
    <HStack spacing={2} mb={3} flexWrap="wrap">
      {attempt.question_audio && <AuthAudio sessionId={attempt.session_id} name={attempt.question_audio} label="Play question" />}
      {attempt.answer_audio && <AuthAudio sessionId={attempt.session_id} name={attempt.answer_audio} label="Play your answer" />}
    </HStack>
    <Text fontSize="sm" mb={2}>{attempt.summary}</Text>
    {attempt.improvements.length > 0 && (
      <>
        <Text fontSize="sm" fontWeight="semibold">To improve</Text>
        <List styleType="disc" pl={5} fontSize="sm">
          {attempt.improvements.map((item) => <ListItem key={item}>{item}</ListItem>)}
        </List>
      </>
    )}
  </Box>
)

// Loaded the first time a topic is expanded: the answered questions and the improvement summary.
const TopicHistory: React.FC<{ subject: string; topic: TopicProgress }> = ({ subject, topic }) => {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null)
  const [summary, setSummary] = useState<TopicSummary | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (topic.attempts === 0) {
      setAttempts([])
      return
    }
    getTopicAttempts(subject, topic.slug).then(setAttempts).catch(() => setError(true))
    getTopicSummary(subject, topic.slug).then(setSummary).catch(() => undefined)
  }, [subject, topic.slug, topic.attempts])

  if (error) return <Alert status="error"><AlertIcon />Could not load your answers for this topic.</Alert>
  if (!attempts) return <Spinner size="sm" color="brand.500" />
  if (attempts.length === 0) {
    return <Text color="muted" fontSize="sm">You haven't answered any questions in this topic yet.</Text>
  }

  return (
    <VStack align="stretch" spacing={4}>
      {summary && (summary.summary || summary.top_improvements.length > 0) && (
        <Box bg="brand.50" border="1px solid" borderColor="brand.200" borderRadius="lg" p={4}>
          <Heading size="xs" textTransform="uppercase" letterSpacing="0.08em" mb={2}>Improvement summary</Heading>
          {summary.summary && <Text fontSize="sm" mb={2}>{summary.summary}</Text>}
          <List styleType="disc" pl={5} fontSize="sm">
            {summary.top_improvements.map((item) => <ListItem key={item}>{item}</ListItem>)}
          </List>
        </Box>
      )}
      <Heading size="xs" textTransform="uppercase" letterSpacing="0.08em">Questions you've answered</Heading>
      {attempts.map((attempt) => <AttemptCard key={attempt.id} attempt={attempt} />)}
    </VStack>
  )
}

const TopicStart: React.FC<{ subject: string; topic: string }> = ({ subject, topic }) => {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  return (
    <HStack mb={4} flexWrap="wrap">
      <Select w="140px" size="sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} aria-label="Difficulty">
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </Select>
      <Button size="sm" colorScheme="teal" onClick={() => navigate(`/interview?subject=${subject}&topic=${topic}&difficulty=${difficulty}`)}>
        Start voice interview
      </Button>
    </HStack>
  )
}

// Wipes this module's answers, summaries and voice sessions so the user can begin again.
const RestartModule: React.FC<{ subject: SubjectDetail; onDone: () => void }> = ({ subject, onDone }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const confirm = async () => {
    setBusy(true)
    try {
      await resetSubjectProgress(subject.slug)
      onClose()
      toast({ title: `${subject.name} restarted`, description: 'You are starting this module from scratch.', status: 'success' })
      onDone()
    } catch {
      toast({ title: 'Could not restart the module', description: 'Please try again.', status: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" leftIcon={<MdRestartAlt size={18} />} onClick={onOpen}>Restart module</Button>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontFamily="heading">Restart {subject.name}?</AlertDialogHeader>
            <AlertDialogBody>
              <Text mb={2}>This starts the module from scratch. It permanently deletes:</Text>
              <List styleType="disc" pl={5} fontSize="sm" color="muted">
                <ListItem>your {subject.attempts} {subject.attempts === 1 ? 'answer' : 'answers'} and scores in this module</ListItem>
                <ListItem>its improvement summaries</ListItem>
                <ListItem>its voice sessions and recordings in History</ListItem>
              </List>
              <Text mt={3} fontWeight={600}>This cannot be undone.</Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} variant="ghost" onClick={onClose} isDisabled={busy}>Cancel</Button>
              <Button colorScheme="red" ml={3} onClick={confirm} isLoading={busy}>Delete and restart</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}

const SubjectPage: React.FC = () => {
  const { slug = '' } = useParams()
  const [subject, setSubject] = useState<SubjectDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'missing' | 'ready'>('loading')
  const [opened, setOpened] = useState<Set<string>>(new Set()) // topics expanded at least once

  const load = () => {
    setStatus('loading')
    getSubject(slug)
      .then((data) => { setSubject(data); setOpened(new Set()); setStatus('ready') })
      .catch((error) => setStatus(error?.response?.status === 404 ? 'missing' : 'error'))
  }

  useEffect(load, [slug])

  if (status === 'loading') return <Box p={6}><Spinner color="brand.500" /></Box>
  if (status === 'missing') return <Box p={6}><Alert status="warning"><AlertIcon />That module doesn't exist. <Button as={RouterLink} to="/dashboard" variant="link" ml={2}>Back to dashboard</Button></Alert></Box>
  if (status === 'error' || !subject) return <Box p={6}><Alert status="error"><AlertIcon />Could not load this module. Check that the backend is running.</Alert></Box>

  return (
    <Box p={{ base: 4, md: 6 }} maxW="900px">
      <Breadcrumb fontSize="sm" color="muted" mb={3}>
        <BreadcrumbItem><BreadcrumbLink as={RouterLink} to="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbItem isCurrentPage><BreadcrumbLink>{subject.name}</BreadcrumbLink></BreadcrumbItem>
      </Breadcrumb>
      <Flex justify="space-between" align="start" gap={3} wrap="wrap" mb={1}>
        <HStack align="center" spacing={3} flexWrap="wrap">
          <Heading size="lg">{subject.name}</Heading>
          <Badge>{subject.category}</Badge>
          {subject.attempts > 0 && <ScoreBadge score={subject.average_score} suffix="% avg" />}
        </HStack>
        {subject.attempts > 0 && <RestartModule subject={subject} onDone={load} />}
      </Flex>
      <Text color="muted" mb={6}>{subject.description}</Text>

      <Accordion
        allowMultiple
        onChange={(indexes) =>
          setOpened((prev) => new Set([...prev, ...(indexes as number[]).map((i) => subject.topics[i].slug)]))
        }
      >
        {subject.topics.map((topic) => (
          <AccordionItem key={topic.slug} border="1px solid" borderColor="line" borderRadius="xl" mb={2} bg="surface" overflow="hidden">
            <AccordionButton py={4}>
              <HStack flex="1" textAlign="left" spacing={3} flexWrap="wrap">
                <Text fontWeight="semibold">{topic.name}</Text>
                <Text fontSize="sm" color="muted">{topic.attempts} {topic.attempts === 1 ? 'answer' : 'answers'}</Text>
                {topic.attempts > 0 && <ScoreBadge score={topic.average_score} suffix="% avg" />}
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={5}>
              <TopicStart subject={subject.slug} topic={topic.slug} />
              {opened.has(topic.slug) && <TopicHistory subject={subject.slug} topic={topic} />}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  )
}

export default SubjectPage
