import React, { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { Avatar, Box, Button, Divider, Flex, FormControl, FormErrorMessage, FormLabel, Heading, HStack, Input, SimpleGrid, Text, VStack, useToast } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { MdAutoGraph, MdCheckCircle, MdLibraryBooks, MdEdit, MdLogout, MdMailOutline, MdPersonOutline } from 'react-icons/md'
import AnimatedStat from '../components/UI/AnimatedStat'
import PageHeader from '../components/UI/PageHeader'
import { getCatalogOverview, logoutAccount, updateProfile, type CatalogOverview } from '../lib/api'
import { useAuth } from '../lib/auth'

const Field: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: IconComp, label, value }) => (
  <Flex align="center" gap={4}>
    <Flex align="center" justify="center" w={10} h={10} borderRadius="xl" bg="brand.50" color="brand.500" flexShrink={0}>
      <IconComp size={20} />
    </Flex>
    <Box minW={0}>
      <Text fontSize="xs" color="muted" textTransform="uppercase" letterSpacing="0.08em">{label}</Text>
      <Text fontWeight={500} color="#142D26" noOfLines={1}>{value}</Text>
    </Box>
  </Flex>
)

const Profile: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [overview, setOverview] = useState<CatalogOverview | null>(null)

  useEffect(() => {
    getCatalogOverview().then(setOverview).catch(() => undefined)
  }, [])

  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const startEditing = () => {
    setDraft(user?.full_name ?? '')
    setError('')
    setEditing(true)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const next = draft.trim().replace(/\s+/g, ' ')
    if (next.length < 2) {
      setError('Enter your full name (at least 2 characters).')
      return
    }
    if (next === user?.full_name) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateProfile({ full_name: next })
      setEditing(false)
      toast({ title: 'Profile updated', status: 'success' })
    } catch (requestError: unknown) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    try { await logoutAccount() } finally { navigate('/login', { replace: true }) }
  }

  const subjects = overview?.categories.flatMap((c) => c.subjects) ?? []
  const practised = subjects.filter((s) => s.attempts > 0).length
  const name = user?.full_name ?? ''

  return (
    <Box p={{ base: 4, md: 6 }} maxW="820px">
      <PageHeader eyebrow="Account" title="Profile" subtitle="Your account details and a snapshot of your progress." />

      <Box bg="surface" border="1px solid" borderColor="line" borderRadius="3xl" overflow="hidden" boxShadow="0 2px 12px rgba(4,120,87,0.07)" mb={6}>
        <Box h="96px" bgGradient="linear(to-br, brand.700, brand.500)" />
        <Box px={{ base: 5, md: 8 }} pb={7}>
          <Flex justify="space-between" align="end" mt="-44px" mb={5} wrap="wrap" gap={3}>
            <Avatar name={name} size="xl" bg="brand.500" color="white" border="4px solid white" boxShadow="0 8px 20px rgba(4,120,87,0.25)" />
            <HStack spacing={2}>
              {!editing && <Button colorScheme="teal" leftIcon={<MdEdit />} onClick={startEditing}>Edit profile</Button>}
              <Button variant="outline" leftIcon={<MdLogout />} onClick={signOut}>Sign out</Button>
            </HStack>
          </Flex>
          <Heading size="md" mb={1}>{name || 'Your account'}</Heading>
          <Text color="muted" fontSize="sm" mb={5}>Member of Euboulos AI</Text>
          <Divider borderColor="line" mb={5} />
          {editing ? (
            <Box as="form" onSubmit={save} noValidate>
              <VStack align="stretch" spacing={4}>
                <FormControl isInvalid={Boolean(error)}>
                  <FormLabel htmlFor="full-name">Full name</FormLabel>
                  <Input id="full-name" size="lg" value={draft} maxLength={80} autoFocus autoComplete="name" onChange={(e) => { setDraft(e.target.value); setError('') }} />
                  <FormErrorMessage>{error}</FormErrorMessage>
                </FormControl>
                <Field icon={MdMailOutline} label="Email (cannot be changed)" value={user?.email ?? '–'} />
                <HStack spacing={3}>
                  <Button type="submit" colorScheme="teal" isLoading={saving} loadingText="Saving">Save changes</Button>
                  <Button variant="ghost" onClick={() => setEditing(false)} isDisabled={saving}>Cancel</Button>
                </HStack>
              </VStack>
            </Box>
          ) : (
            <VStack align="stretch" spacing={4}>
              <Field icon={MdPersonOutline} label="Full name" value={name || '–'} />
              <Field icon={MdMailOutline} label="Email" value={user?.email ?? '–'} />
            </VStack>
          )}
        </Box>
      </Box>

      <Heading size="sm" mb={3}>Your progress</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <AnimatedStat icon={MdCheckCircle} label="Answers" value={overview ? String(overview.total_attempts) : '–'} />
        <AnimatedStat icon={MdAutoGraph} label="Average score" value={overview?.average_score == null ? '–' : `${overview.average_score}%`} />
        <AnimatedStat icon={MdLibraryBooks} label="Modules" value={overview ? `${practised} / ${subjects.length}` : '–'} />
      </SimpleGrid>
    </Box>
  )
}

export default Profile
