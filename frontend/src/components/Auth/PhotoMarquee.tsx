import React, { useState } from 'react'
import { Box, Flex, IconButton } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { FiPause, FiPlay } from 'react-icons/fi'

interface Photo {
  src: string
  alt: string
  position: string // object-position, so each crop frames the face inside a tall tile
}

const PHOTOS: Photo[] = [
  { src: '/auth/cafe.jpg', alt: 'A woman practicing an interview at a cafe table', position: '45% 30%' },
  { src: '/auth/window.jpg', alt: 'A professional practicing an interview by a city-view window', position: '49% 30%' },
  { src: '/auth/study.jpg', alt: 'A woman in headphones practicing an interview at her desk', position: '36% 30%' },
  { src: '/auth/apartment.jpg', alt: 'A woman practicing an interview at a table in a bright apartment', position: '60% 30%' },
  { src: '/auth/park.jpg', alt: 'A woman practicing an interview at a table in a city park', position: '38% 40%' },
]

const COUNT = PHOTOS.length // the geometry below is worked out for exactly 5 photos
// Column B shows the same cycle rotated by 2 (see the note on PhotoMarquee).
const COLUMN_A = PHOTOS
const COLUMN_B = [...PHOTOS.slice(2), ...PHOTOS.slice(0, 2)]
const SECONDS_PER_TILE = 14 // slow, steady drift

const scroll = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(calc(-1 * var(--cycle))); }
`

const Column: React.FC<{ photos: Photo[]; paused: boolean; shifted?: boolean }> = ({ photos, paused, shifted }) => (
  <Box flex="1" minW={0} mt={shifted ? 'calc(var(--pitch) / -2)' : 0}>
    <Flex
      direction="column"
      willChange="transform"
      animation={`${scroll} ${COUNT * SECONDS_PER_TILE}s linear infinite`}
      style={{ animationPlayState: paused ? 'paused' : 'running' }}
      sx={{ '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}
    >
      {[...photos, ...photos].map((photo, index) => {
        const isCopy = index >= COUNT
        return (
          <Box
            key={index}
            h="var(--tile)"
            mb="var(--gap)"
            flexShrink={0}
            borderRadius="16px"
            overflow="hidden"
            boxShadow="0 14px 30px -14px rgba(40,30,20,0.4), 0 2px 5px rgba(40,30,20,0.08)"
            aria-hidden={isCopy}
          >
            <img
              src={photo.src}
              alt={isCopy ? '' : photo.alt}
              decoding="sync"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photo.position, display: 'block' }}
            />
          </Box>
        )
      })}
    </Flex>
  </Box>
)

// Two staggered columns of tall photo tiles drifting upward, with a pause control.
//
// Why the numbers work: every tile has the same height, and --pitch (tile + gap) is chosen as
// (viewport - gap) / 1.5, so viewport + tile = 2.5 pitches. A column therefore shows 3 tiles half
// of the time and 2 tiles the other half. Column B is shifted by half a pitch, so it shows 2 when
// column A shows 3, and 3 when A shows 2: never more than 5 tiles in view in total. Column B also
// runs the 5-photo cycle rotated by 2, so its visible photos are always exactly the ones column A is
// not showing. Result: every photo on screen is different, and each column's own loop point (the
// list is rendered twice and moved by exactly one list length) is seamless.
const PhotoMarquee: React.FC = () => {
  const [paused, setPaused] = useState(false)
  return (
    <Box position="relative" h="100%" w="100%" maxW="540px" mx="auto" style={{ containerType: 'size' }}>
      <Flex
        h="100%"
        gap="var(--gap)"
        overflow="hidden"
        sx={{
          '--gap': '14px',
          '--pitch': 'calc((100cqh - var(--gap)) / 1.5)',
          '--tile': 'calc(var(--pitch) - var(--gap))',
          '--cycle': `calc(${COUNT} * var(--pitch))`,
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 7%, #000 93%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 7%, #000 93%, transparent 100%)',
        }}
      >
        <Column photos={COLUMN_A} paused={paused} />
        <Column photos={COLUMN_B} paused={paused} shifted />
      </Flex>
      <IconButton
        aria-label={paused ? 'Play photo animation' : 'Pause photo animation'}
        icon={paused ? <FiPlay /> : <FiPause />}
        onClick={() => setPaused((value) => !value)}
        position="absolute"
        right="10px"
        bottom="14px"
        isRound
        size="sm"
        bg="rgba(11,47,38,0.55)"
        color="white"
        backdropFilter="blur(6px)"
        _hover={{ bg: 'rgba(11,47,38,0.75)' }}
      />
    </Box>
  )
}

export default PhotoMarquee
