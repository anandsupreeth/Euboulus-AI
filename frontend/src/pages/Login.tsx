import React from 'react'
import { Box } from '@chakra-ui/react'
import AuthLayout from '../components/Auth/AuthLayout'
import AuthForm from '../components/Auth/AuthForm'
import PhotoMarquee from '../components/Auth/PhotoMarquee'
import WordReveal from '../components/Auth/WordReveal'

const Login: React.FC = () => (
  <AuthLayout visual={<PhotoMarquee />}>
    <Box mb={{ base: 6, md: 8 }} px={{ base: 2, md: 4 }} sx={{ '@media (max-height: 820px)': { mb: 4 } }}>
      <WordReveal text="Your personal AI interview coach helps you practise aloud, improve your answers, and track your progress." />
    </Box>
    <AuthForm mode="login" />
  </AuthLayout>
)

export default Login
