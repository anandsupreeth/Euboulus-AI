import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import Header from './components/Layout/Header'
import Sidebar, { SIDEBAR_WIDTH } from './components/Layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import History from './pages/History'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import SubjectPage from './pages/SubjectPage'
import { refreshAuthSession } from './lib/api'
import { RequireAuth } from './lib/auth'

const App: React.FC = () => {
  const location = useLocation()
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'

  useEffect(() => {
    void refreshAuthSession().catch(() => undefined)
  }, [])

  return (
    <Box minH="100vh">
      {!isAuthRoute && <Sidebar />}
      <Box ml={isAuthRoute ? 0 : { base: 0, md: `${SIDEBAR_WIDTH}px` }}>
        {!isAuthRoute && <Header />}
        <Box px={isAuthRoute ? 0 : { base: 0, md: 4 }} pb={isAuthRoute ? 0 : 10}>
          <AnimatedRoutes />
        </Box>
      </Box>
    </Box>
  )
}

export default App

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} initial="initial" animate="animate" exit="exit" variants={pageTransition} transition={{ duration: 0.32 }}>
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/interview" element={<RequireAuth><Interview /></RequireAuth>} />
          <Route path="/subjects/:slug" element={<RequireAuth><SubjectPage /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
