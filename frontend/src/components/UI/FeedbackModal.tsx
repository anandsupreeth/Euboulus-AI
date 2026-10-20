import React from 'react'
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Text, VStack, Stat, StatLabel, StatNumber, HStack, Badge } from '@chakra-ui/react'
import type { InterviewFeedback } from '../../lib/api'

interface Props { isOpen: boolean; onClose: () => void; transcript: string; feedback: InterviewFeedback | null }

const FeedbackModal: React.FC<Props> = ({ isOpen, onClose, transcript, feedback }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontFamily="heading">AI Feedback</ModalHeader>
        <ModalBody>
          <VStack align="start" spacing={4}>
            <Badge colorScheme="purple" bg="brand.100" color="brand.600">Demo feedback — not an AI assessment</Badge>
            <Text fontSize="xs" color="muted" textTransform="uppercase" letterSpacing="0.08em">Transcript</Text>
            <Text bg="#F7FAF8" fontFamily="mono" fontSize="sm" border="1px solid" borderColor="line" p={3} borderRadius="lg" w="full">{transcript || '—'}</Text>
            <HStack spacing={3} w="full" align="stretch">
              <Stat bg="surface" border="1px solid" borderColor="line" p={3} borderRadius="lg">
                <StatLabel color="muted">Technical</StatLabel>
                <StatNumber color="accent" fontFamily="heading">{feedback?.technical_score ?? 0}%</StatNumber>
              </Stat>
              <Stat bg="surface" border="1px solid" borderColor="line" p={3} borderRadius="lg">
                <StatLabel color="muted">Communication</StatLabel>
                <StatNumber color="accent" fontFamily="heading">{feedback?.communication_score ?? 0}%</StatNumber>
              </Stat>
              <Stat bg="surface" border="1px solid" borderColor="line" p={3} borderRadius="lg">
                <StatLabel color="muted">Confidence</StatLabel>
                <StatNumber color="accent" fontFamily="heading">{feedback?.confidence_score ?? 0}%</StatNumber>
              </Stat>
            </HStack>
            <VStack align="start">
              <Text fontWeight="semibold" color="green.600">Strengths</Text>
              {feedback?.strengths.map(strength => <Text key={strength}>- {strength}</Text>)}
              <Text fontWeight="semibold" color="orange.600">Improvements</Text>
              {feedback?.improvements.map(improvement => <Text key={improvement}>- {improvement}</Text>)}
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Close</Button>
          <Text fontSize="sm" color="muted">Interview saved to history</Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default FeedbackModal
