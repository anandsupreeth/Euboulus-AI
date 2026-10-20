import React from 'react'
import {
  Avatar, Box, Button, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, HStack, IconButton, Menu, MenuButton,
  MenuDivider, MenuItem, MenuList, Text, useDisclosure,
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { MdKeyboardArrowDown, MdLogout, MdMenu, MdPerson } from 'react-icons/md'
import { logoutAccount } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Logo, SidebarContent, SIDEBAR_WIDTH } from './Sidebar'

const TITLES: [string, string][] = [
  ['/dashboard', 'Dashboard'],
  ['/subjects', 'Dashboard'],
  ['/interview', 'Voice interview'],
  ['/history', 'History'],
  ['/profile', 'Profile'],
]

const today = () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

const Header: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const drawer = useDisclosure()
  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? ''

  const signOut = async () => {
    try { await logoutAccount() } finally { navigate('/login', { replace: true }) }
  }

  return (
    <>
      <Flex
        as="header"
        align="center"
        justify="space-between"
        h="64px"
        px={{ base: 4, md: 8 }}
        bg="rgba(255,255,255,0.82)"
        backdropFilter="saturate(180%) blur(14px)"
        borderBottom="1px solid"
        borderColor="line"
        position="sticky"
        top={0}
        zIndex={20}
      >
        <HStack spacing={3}>
          <IconButton display={{ base: 'inline-flex', md: 'none' }} aria-label="Open menu" icon={<MdMenu size={22} />} variant="ghost" onClick={drawer.onOpen} />
          <Box display={{ base: 'block', md: 'none' }}><Logo /></Box>
          <Box display={{ base: 'none', md: 'block' }} lineHeight="1.25">
            <Text fontFamily="heading" fontWeight={700} fontSize="lg" color="#142D26">{title}</Text>
            <Text fontSize="xs" color="muted">{today()}</Text>
          </Box>
        </HStack>

        {user ? (
          <HStack spacing={3}>
            <Menu placement="bottom-end">
              <MenuButton as={Button} variant="unstyled" display="inline-flex" alignItems="center" h="auto" p={1} pr={{ md: 2 }} borderRadius="full" border="1px solid" borderColor="line" bg="white" _hover={{ borderColor: 'brand.300' }} aria-label="Account menu">
                <HStack spacing={2}>
                  <Avatar name={user.full_name} size="sm" bg="brand.500" color="white" />
                  <Text display={{ base: 'none', md: 'block' }} fontSize="sm" fontWeight={500} color="#142D26">{user.full_name.split(' ')[0]}</Text>
                  <Box display={{ base: 'none', md: 'block' }} color="muted"><MdKeyboardArrowDown /></Box>
                </HStack>
              </MenuButton>
              <MenuList borderColor="line" borderRadius="xl" boxShadow="0 16px 40px -12px rgba(20,45,38,0.25)" py={2}>
                <Box px={3} pb={2}>
                  <Text fontSize="sm" fontWeight={600} color="#142D26" noOfLines={1}>{user.full_name}</Text>
                  <Text fontSize="xs" color="muted" noOfLines={1}>{user.email}</Text>
                </Box>
                <MenuDivider borderColor="line" />
                <MenuItem icon={<MdPerson size={18} />} onClick={() => navigate('/profile')}>Profile</MenuItem>
                <MenuItem icon={<MdLogout size={18} />} onClick={signOut}>Sign out</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        ) : (
          <HStack spacing={3}>
            <Button as={RouterLink} to="/login" size="sm" variant="ghost">Login</Button>
            <Button as={RouterLink} to="/register" colorScheme="teal" size="sm">Sign Up</Button>
          </HStack>
        )}
      </Flex>

      <Drawer isOpen={drawer.isOpen} onClose={drawer.onClose} placement="left">
        <DrawerOverlay bg="rgba(20,45,38,0.45)" backdropFilter="blur(4px)" />
        <DrawerContent maxW={`${SIDEBAR_WIDTH}px`}>
          <DrawerBody p={0}><SidebarContent groupId="drawer" onNavigate={drawer.onClose} /></DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Header
