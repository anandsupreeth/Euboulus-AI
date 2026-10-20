import React, { useState } from 'react'
import { Button, Text } from '@chakra-ui/react'
import { MdPlayArrow } from 'react-icons/md'
import { fetchAudioObjectUrl } from '../../lib/api'

interface Props {
  sessionId: string
  name: string
  label?: string
}

// Recordings sit behind authentication, so they're fetched on demand (first click) rather than
// pointed at directly from an <audio src>.
const AuthAudio: React.FC<Props> = ({ sessionId, name, label = 'Play recording' }) => {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = async () => {
    setLoading(true)
    setFailed(false)
    try {
      setUrl(await fetchAudioObjectUrl(sessionId, name))
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  if (url) return <audio controls autoPlay src={url} style={{ height: 36, maxWidth: '100%' }} />
  return (
    <>
      <Button size="sm" variant="outline" leftIcon={<MdPlayArrow />} onClick={load} isLoading={loading}>
        {label}
      </Button>
      {failed && <Text as="span" ml={2} fontSize="xs" color="red.500">Could not load audio</Text>}
    </>
  )
}

export default AuthAudio
