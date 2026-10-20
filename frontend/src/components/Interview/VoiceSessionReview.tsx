import React from 'react'
import { Box, Heading, HStack, Badge, Text, VStack, List, ListItem } from '@chakra-ui/react'
import type { VoiceSession } from '../../lib/api'
import AuthAudio from '../UI/AuthAudio'
import ScoreBadge from '../UI/ScoreBadge'

interface Props {
  session: VoiceSession
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text fontSize="xs" color="muted" textTransform="uppercase" letterSpacing="0.08em" mb={1}>{children}</Text>
)

// Every question and answer with its audio, transcript and score, plus the final feedback.
const VoiceSessionReview: React.FC<Props> = ({ session }) => (
  <VStack align="stretch" spacing={4}>
    {session.turns.map((turn) => (
      <Box key={turn.index} bg="surface" border="1px solid" borderColor="line" borderRadius="xl" p={4}>
        <Label>Question {turn.index + 1}</Label>
        <Text fontWeight="semibold" color="#142D26" mb={2}>{turn.question_text}</Text>
        {turn.question_audio && <AuthAudio sessionId={session.id} name={turn.question_audio} label="Play question" />}
        {turn.answer_audio && (
          <Box mt={3} pl={3} borderLeft="3px solid" borderLeftColor="brand.500">
            <HStack mb={1} spacing={3}>
              <Label>Your answer{turn.answer_duration_seconds ? ` · ${turn.answer_duration_seconds}s` : ''}</Label>
              {turn.evaluation && <ScoreBadge score={turn.evaluation.score} />}
            </HStack>
            <Text fontSize="sm" mb={2}>{turn.answer_text || '(nothing transcribed)'}</Text>
            <AuthAudio sessionId={session.id} name={turn.answer_audio} label="Play your answer" />
            {turn.evaluation && (
              <Box mt={3}>
                <Text fontSize="sm" mb={2}>{turn.evaluation.summary}</Text>
                {turn.evaluation.improvements.length > 0 && (
                  <>
                    <Text fontSize="sm" fontWeight="semibold">To improve</Text>
                    <List styleType="disc" pl={5} fontSize="sm">
                      {turn.evaluation.improvements.map((item) => <ListItem key={item}>{item}</ListItem>)}
                    </List>
                  </>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    ))}

    {session.feedback && (
      <Box bg="surface" border="1px solid" borderColor="line" borderRadius="xl" p={4}>
        <HStack mb={2}>
          <Heading size="sm">Overall feedback</Heading>
          <Badge colorScheme="green">{session.feedback.overall_score}/100</Badge>
        </HStack>
        <Text mb={3}>{session.feedback.summary}</Text>
        <Text fontWeight="semibold">Strengths</Text>
        <List styleType="disc" pl={5} mb={3}>
          {session.feedback.strengths.map((item) => <ListItem key={item}>{item}</ListItem>)}
        </List>
        <Text fontWeight="semibold">To improve</Text>
        <List styleType="disc" pl={5} mb={3}>
          {session.feedback.improvements.map((item) => <ListItem key={item}>{item}</ListItem>)}
        </List>
        {session.closing_audio && <AuthAudio sessionId={session.id} name={session.closing_audio} label="Play wrap-up" />}
      </Box>
    )}
  </VStack>
)

export default VoiceSessionReview
