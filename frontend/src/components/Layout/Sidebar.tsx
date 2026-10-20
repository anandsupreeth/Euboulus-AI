import React from 'react'
import { Avatar, Box, Flex, IconButton, Text, Tooltip, VStack } from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdDashboard, MdHistory, MdLogout, MdPerson } from 'react-icons/md'
import { logoutAccount } from '../../lib/api'
import { useAuth } from '../../lib/auth'

export const SIDEBAR_WIDTH = 272

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { to: '/history', label: 'History', icon: MdHistory },
  { to: '/profile', label: 'Profile', icon: MdPerson },
]

export const Logo: React.FC = () => (
  <Flex as={RouterLink} to="/dashboard" align="center" gap={3} _hover={{ textDecoration: 'none' }}>
    <Flex align="center" justify="center" w={10} h={10} borderRadius="xl" bgGradient="linear(to-br, brand.500, brand.700)" color="white" fontFamily="mono" fontSize="sm" fontWeight={700} boxShadow="0 8px 18px rgba(4,120,87,0.32), inset 0 1px 0 rgba(255,255,255,0.25)">
      &lt;/&gt;
    </Flex>
    <Box lineHeight="1.15">
      <Text fontFamily="heading" fontWeight={700} fontSize="lg" letterSpacing="-0.02em" color="#142D26">Euboulos AI</Text>
      <Text fontSize="10px" fontWeight={600} letterSpacing="0.16em" textTransform="uppercase" color="muted">Interview prep</Text>
    </Box>
  </Flex>
)

const MotionDiv = motion.div

interface ContentProps {
  onNavigate?: () => void
  // Distinguishes the sliding highlight when the desktop and drawer copies could coexist.
  groupId?: string
}

// Everything inside the sidebar, shared by the fixed desktop rail and the mobile drawer.
export const SidebarContent: React.FC<ContentProps> = ({ onNavigate, groupId = 'desktop' }) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  // Module pages belong to the Dashboard section.
  const isActive = (to: string) => pathname === to || (to === '/dashboard' && pathname.startsWith('/subjects/'))

  const signOut = async () => {
    try { await logoutAccount() } finally { navigate('/login', { replace: true }) }
  }

  return (
    <Flex direction="column" h="full" px={4} py={5}>
      <Box px={2} mb={7}><Logo /></Box>

      <Text px={3} mb={2} fontSize="10px" fontWeight={600} letterSpacing="0.16em" textTransform="uppercase" color="muted">Menu</Text>
      <VStack as="nav" aria-label="Main" align="stretch" spacing={1}>
        {NAV.map((item) => {
          const active = isActive(item.to)
          return (
            <Box
              key={item.to}
              as={RouterLink}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              position="relative"
              display="flex"
              alignItems="center"
              gap={3}
              px={3}
              py={2.5}
              borderRadius="xl"
              color={active ? 'brand.700' : 'muted'}
              fontWeight={active ? 600 : 500}
              transition="color .15s"
              _hover={{ textDecoration: 'none', color: 'brand.700', '& .nav-icon': { bg: active ? 'brand.500' : 'brand.100' } }}
            >
              {active && (
                <MotionDiv
                  layoutId={`nav-pill-${groupId}`}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'linear-gradient(90deg, #ECFDF5, #F6FDF9)', border: '1px solid #D1FAE5' }}
                />
              )}
              <Flex
                className="nav-icon"
                position="relative"
                zIndex={1}
                align="center"
                justify="center"
                w={8}
                h={8}
                borderRadius="lg"
                bg={active ? 'brand.500' : 'transparent'}
                color={active ? 'white' : 'inherit'}
                boxShadow={active ? '0 6px 12px rgba(4,120,87,0.28)' : 'none'}
                transition="all .15s"
              >
                <item.icon size={19} />
              </Flex>
              <Text position="relative" zIndex={1} fontSize="sm">{item.label}</Text>
            </Box>
          )
        })}
      </VStack>

      <Box flex="1" />

      {user && (
        <Flex align="center" gap={3} p={2.5} borderRadius="xl" border="1px solid" borderColor="line" bg="#FBFDFC">
          <Avatar name={user.full_name} size="sm" bg="brand.500" color="white" />
          <Box flex="1" minW={0} lineHeight="1.3">
            <Text fontSize="sm" fontWeight={600} color="#142D26" noOfLines={1}>{user.full_name}</Text>
            <Text fontSize="xs" color="muted" noOfLines={1}>{user.email}</Text>
          </Box>
          <Tooltip label="Sign out" placement="top" hasArrow>
            <IconButton aria-label="Sign out" icon={<MdLogout size={18} />} size="sm" variant="ghost" onClick={signOut} />
          </Tooltip>
        </Flex>
      )}
    </Flex>
  )
}

// Fixed rail on desktop; phones get the same content in a drawer opened from the header.
const Sidebar: React.FC = () => (
  <Box
    as="aside"
    display={{ base: 'none', md: 'block' }}
    position="fixed"
    top={0}
    left={0}
    bottom={0}
    w={`${SIDEBAR_WIDTH}px`}
    bg="white"
    borderRight="1px solid"
    borderColor="line"
    zIndex={30}
  >
    <SidebarContent />
  </Box>
)

export default Sidebar
