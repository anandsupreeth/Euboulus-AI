import React from 'react'
import { Text } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'

const MotionSpan = motion.span

interface Props {
  text: string
  delay?: number // seconds before the first word
  stagger?: number // seconds between words
}

// Shows a sentence one word after another, each fading and rising slightly into place.
// The full sentence stays in the accessible text; the animated words are decorative.
const WordReveal: React.FC<Props> = ({ text, delay = 0.4, stagger = 0.3 }) => {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  return (
    <Text
      aria-label={text}
      fontFamily="'Newsreader', Georgia, serif"
      fontWeight={500}
      fontSize={{ base: '22px', md: '28px' }}
      lineHeight={1.3}
      letterSpacing="-0.01em"
      color="#0B2F26"
      textAlign="center"
      sx={{ '@media (max-height: 820px)': { fontSize: '20px' } }}
    >
      {words.map((word, index) => (
        <MotionSpan
          key={index}
          aria-hidden
          style={{ display: 'inline-block', marginRight: index < words.length - 1 ? '0.28em' : 0 }}
          initial={reduce ? false : { opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: delay + index * stagger }}
        >
          {word}
        </MotionSpan>
      ))}
    </Text>
  )
}

export default WordReveal
