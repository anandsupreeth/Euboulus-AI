import React, { useState, type FormEvent } from 'react'
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { loginAccount, registerAccount } from '../../lib/api'

interface Props { mode: 'login' | 'register' }

// Media queries for short browser windows (laptops at 125-150% zoom).
const SHORT = '@media (max-height: 820px)'

const RequiredLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <FormLabel htmlFor={htmlFor} color="#0B2F26" fontWeight={500} mb={1.5}>
    {children}
  </FormLabel>
)


const AuthForm: React.FC<Props> = ({ mode }) => {
  const isRegister = mode === 'register'
  // Create account has an extra field, so tighten spacing to keep both cards the same size.
  const fieldH = 'var(--field-h)'
  const fieldStyle = { h: fieldH, bg: 'white', fontSize: 'md' }
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (isRegister) {
        await registerAccount({ full_name: fullName, email, password })
      } else {
        await loginAccount({ email, password })
      }
      navigate('/dashboard', { replace: true })
    } catch (requestError: unknown) {
      const response = axios.isAxiosError(requestError) ? requestError.response : null
      const detail = response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (!response || response.status >= 500) {
        setError('The authentication service is unavailable. Please try again later.')
      } else {
        setError('We could not complete this request. Check your details and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg="rgba(255,255,255,0.92)"
      border="1px solid"
      borderColor="rgba(11,59,48,0.08)"
      px={{ base: 6, md: 12 }}
      py={{ base: 8, md: isRegister ? 7 : 10 }}
      borderRadius="3xl"
      boxShadow="0 1px 2px rgba(20,45,38,0.04), 0 30px 60px -20px rgba(4,120,87,0.2)"
      sx={{
        '--field-h': isRegister ? '46px' : '52px',
        '--btn-h': isRegister ? '50px' : '56px',
        '--gap-y': isRegister ? '14px' : '20px',
        // Shorter browser windows: tighten everything so the submit button stays on screen.
        [SHORT]: { '--field-h': '42px', '--btn-h': '46px', '--gap-y': '12px', py: 5 },
      }}
    >
      <Heading fontFamily="'Newsreader', Georgia, serif" fontWeight={500} fontSize={isRegister ? '3xl' : '4xl'} letterSpacing="-0.02em" mb={isRegister ? 1 : 2}
        sx={{ [SHORT]: { fontSize: '28px', mb: 1 } }}>
        {isRegister ? 'Create your account' : 'Welcome back'}
      </Heading>
      <Text color="muted" fontSize={isRegister ? 'md' : 'lg'} mb={isRegister ? 5 : 7}
        sx={{ [SHORT]: { fontSize: 'md', mb: 4 } }}>
        {isRegister ? 'Start practicing in a minute.' : 'Sign in to continue to your account.'}
      </Text>

      <VStack spacing={0} gap="var(--gap-y)" align="stretch">
        {error && <Alert status="error" borderRadius="md"><AlertIcon />{error}</Alert>}
        {isRegister && (
          <FormControl isRequired>
            <RequiredLabel htmlFor="full-name">Full name</RequiredLabel>
            <InputGroup>
              <InputLeftElement h={fieldH} pl={2} color="brand.500" pointerEvents="none"><FiUser size={18} /></InputLeftElement>
              <Input {...fieldStyle} id="full-name" pl={12} autoComplete="name" maxLength={80} value={fullName}
                onChange={(event) => setFullName(event.target.value)} placeholder="Jane Doe" />
            </InputGroup>
          </FormControl>
        )}
        <FormControl isRequired>
          <RequiredLabel htmlFor="email">Email address</RequiredLabel>
          <InputGroup>
            <InputLeftElement h={fieldH} pl={2} color="brand.500" pointerEvents="none"><FiMail size={18} /></InputLeftElement>
            <Input {...fieldStyle} id="email" type="email" pl={12} autoComplete="email" maxLength={254} value={email}
              onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </InputGroup>
        </FormControl>
        <FormControl isRequired>
          <RequiredLabel htmlFor="password">Password</RequiredLabel>
          <InputGroup>
            <InputLeftElement h={fieldH} pl={2} color="brand.500" pointerEvents="none"><FiLock size={18} /></InputLeftElement>
            <Input {...fieldStyle} id="password" type={showPassword ? 'text' : 'password'} pl={12} pr={12}
              autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 12 : 1} maxLength={128}
              value={password} onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? 'At least 12 characters' : 'Enter your password'} />
            <InputRightElement h={fieldH} pr={2}>
              <IconButton variant="ghost" size="sm" aria-label={showPassword ? 'Hide password' : 'Show password'}
                icon={showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />} onClick={() => setShowPassword((v) => !v)} color="muted" />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Button type="submit" colorScheme="teal" h="var(--btn-h)" fontSize="lg" mt={isRegister ? 1 : 2} rightIcon={<FiArrowRight />}
          isLoading={isSubmitting} loadingText="Please wait">
          {isRegister ? 'Create account' : 'Sign in'}
        </Button>

        <Divider borderColor="line" />
        <Text fontSize="sm" color="muted" textAlign="center">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link as={RouterLink} to={isRegister ? '/login' : '/register'} color="brand.500" fontWeight={500}>
            {isRegister ? 'Sign in' : 'Create account'}
          </Link>
        </Text>
      </VStack>
    </Box>
  )
}

export default AuthForm
