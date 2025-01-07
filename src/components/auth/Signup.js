import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Flex,
  Heading,
  Divider,
  Image,
  IconButton,
  Alert,
  AlertDescription,
} from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup, signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Flex w="full" maxW="1200px" mx="auto" p={4}>
        {/* Left side - Image */}
        <Box flex="1" display={{ base: 'none', md: 'block' }}>
          <Image
            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80"
            alt="Coding"
            objectFit="cover"
            h="600px"
            w="full"
            rounded="lg"
          />
        </Box>

        {/* Right side - Form */}
        <Box
          flex="1"
          p={8}
          bg="white"
          boxShadow="lg"
          rounded="lg"
          mx={{ base: 4, md: 8 }}
        >
          <Stack spacing={4}>
            <Heading fontSize="2xl" textAlign="center">
              Create Your CodeSnippets Account
            </Heading>
            <Text fontSize="md" color="gray.600" textAlign="center">
              Join our community of developers
            </Text>

            {error && (
              <Alert status="error" rounded="md">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl id="email">
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FormControl>
                <FormControl id="password">
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FormControl>
                <FormControl id="confirm-password">
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  fontSize="md"
                  isLoading={loading}
                >
                  Sign up
                </Button>
              </Stack>
            </form>

            <Divider />

            <Stack direction="row" spacing={4} justify="center">
              <IconButton
                icon={<FaGoogle />}
                onClick={signInWithGoogle}
                colorScheme="red"
                variant="outline"
                aria-label="Sign in with Google"
              />
              <IconButton
                icon={<FaGithub />}
                onClick={signInWithGithub}
                colorScheme="gray"
                variant="outline"
                aria-label="Sign in with GitHub"
              />
            </Stack>

            <Text textAlign="center">
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'blue' }}>
                Sign in
              </Link>
            </Text>
          </Stack>
        </Box>
      </Flex>
    </Flex>
  );
}
