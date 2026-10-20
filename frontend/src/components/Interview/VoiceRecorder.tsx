import React, { useState, useEffect, useRef } from 'react'
import { Box, Button, Text, VStack, HStack, Progress, useToast } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

interface Props {
  onTranscript: (t: string) => void
}

const VoiceRecorder: React.FC<Props> = ({ onTranscript }) => {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const recognitionRef = useRef<any>(null)
  const toast = useToast()

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const r = new SpeechRecognition()
    r.interimResults = true
    r.lang = 'en-US'
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((res: any) => res[0].transcript).join('')
      setTranscript(text)
      setConfidence( Math.min(0.95, 0.5 + (text.length / 200)) )
    }
    recognitionRef.current = r
  }, [])

  const start = () => {
    if (!recognitionRef.current) { toast({ title: 'Voice not supported in this browser', status: 'warning' }); return }
    setRecording(true)
    setTranscript('')
    setConfidence(0)
    recognitionRef.current.start()
  }

  const stop = () => {
    if (recognitionRef.current) recognitionRef.current.stop()
    setRecording(false)
    onTranscript(transcript)
  }

  return (
    <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <VStack align="start" spacing={3}>
        <HStack>
          <Button size="lg" colorScheme={recording ? 'red' : 'teal'} onClick={recording ? stop : start}>{recording ? 'Stop' : 'Start Recording'}</Button>
          <Text color={recording ? 'accent' : 'muted'} fontSize="sm">{recording ? 'Listening...' : 'Ready'}</Text>
        </HStack>
        <Progress value={Math.round(confidence * 100)} size="sm" w="240px" />
        <Box bg="white" border="1px solid" borderColor="line" p={4} borderRadius="xl" w="full" minH="90px">
          <Text color="#142D26" fontSize="sm" fontFamily="mono">{transcript || 'Transcript will appear here...'}</Text>
        </Box>
      </VStack>
    </MotionBox>
  )
}

export default VoiceRecorder
