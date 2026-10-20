import React from 'react'
import { Badge } from '@chakra-ui/react'

export function scoreColor(score: number): string {
  if (score >= 75) return 'green'
  if (score >= 50) return 'orange'
  return 'red'
}

const ScoreBadge: React.FC<{ score: number | null; suffix?: string }> = ({ score, suffix = '/100' }) =>
  score === null ? (
    <Badge colorScheme="gray">Not attempted</Badge>
  ) : (
    <Badge colorScheme={scoreColor(score)}>{score}{suffix}</Badge>
  )

export default ScoreBadge
