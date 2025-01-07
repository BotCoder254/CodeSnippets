import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Flex,
  Heading,
  Image,
  IconButton,
  Alert,
  AlertDescription,
  Divider,
} from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { login, googleSignIn, githubSignIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in: ' + error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await googleSignIn();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in with Google: ' + error.message);
    }
    setLoading(false);
  };

  const handleGithubSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await githubSignIn();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in with GitHub: ' + error.message);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setResetEmailSent(true);
      setError('');
    } catch (error) {
      setError('Failed to reset password: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Flex w="full" maxW="1200px" mx="auto" p={4}>
        {/* Left side - Image */}
        <Box flex="1" display={{ base: 'none', md: 'block' }}>
          <Image
            src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80"
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
              Welcome Back to CodeSnippets
            </Heading>
            <Text fontSize="md" color="gray.600" textAlign="center">
              Sign in to access your snippets
            </Text>

            {error && (
              <Alert status="error" rounded="md">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {resetEmailSent && (
              <Alert status="success" rounded="md">
                <AlertDescription>
                  Password reset email has been sent. Check your inbox.
                </AlertDescription>
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

                <Stack spacing={4}>
                  <Stack
                    direction={{ base: 'column', sm: 'row' }}
                    align="start"
                    justify="space-between"
                    fontSize="sm"
                  >
                    <Text
                      color="blue.500"
                      cursor="pointer"
                      onClick={handleForgotPassword}
                      _hover={{ textDecoration: 'underline' }}
                    >
                      Forgot password?
                    </Text>
                    <Link to="/signup">
                      <Text color="blue.500" _hover={{ textDecoration: 'underline' }}>
                        Don't have an account? Sign up
                      </Text>
                    </Link>
                  </Stack>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    fontSize="md"
                    isLoading={loading}
                    w="full"
                  >
                    Sign in
                  </Button>
                </Stack>
              </Stack>
            </form>

            <Divider />

            <Stack direction="row" spacing={4} justify="center">
              <IconButton
                aria-label="Sign in with Google"
                icon={<FaGoogle />}
                onClick={handleGoogleSignIn}
                colorScheme="red"
                variant="outline"
                isLoading={loading}
                size="lg"
                w="full"
              />
              <IconButton
                aria-label="Sign in with GitHub"
                icon={<FaGithub />}
                onClick={handleGithubSignIn}
                colorScheme="gray"
                variant="outline"
                isLoading={loading}
                size="lg"
                w="full"
              />
            </Stack>
          </Stack>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Login;
