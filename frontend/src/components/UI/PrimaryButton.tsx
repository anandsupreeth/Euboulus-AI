import React from 'react'
import { Button } from '@chakra-ui/react'

interface Props {
  children: React.ReactNode
  onClick?: () => void
}

const PrimaryButton: React.FC<Props> = ({ children, onClick }) => (
  <Button colorScheme="teal" onClick={onClick}>{children}</Button>
)

export default PrimaryButton
