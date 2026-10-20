import React from 'react'
import AuthLayout from '../components/Auth/AuthLayout'
import AuthForm from '../components/Auth/AuthForm'

const Register: React.FC = () => (
  <AuthLayout
    headline="Prepare with clarity. Perform with confidence."
    subtitle="Create your free account to practise interviews, receive actionable AI feedback, and track your progress as you build your skills."
  >
    <AuthForm mode="register" />
  </AuthLayout>
)

export default Register
