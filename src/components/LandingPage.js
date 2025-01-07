import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  Image,
} from '@chakra-ui/react';
import { FaCode, FaLock, FaShare } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Feature = ({ title, text, icon }) => {
  return (
    <Stack align="center" textAlign="center">
      <Flex
        w={16}
        h={16}
        align="center"
        justify="center"
        color="white"
        rounded="full"
        bg="blue.500"
        mb={1}
      >
        <Icon as={icon} w={8} h={8} />
      </Flex>
      <Text fontWeight={600}>{title}</Text>
      <Text color="gray.600">{text}</Text>
    </Stack>
  );
};

export default function LandingPage() {
  return (
    <Box>
      {/* Hero Section */}
      <Container maxW="7xl" py={16}>
        <Stack
          align="center"
          spacing={{ base: 8, md: 10 }}
          direction={{ base: 'column', md: 'row' }}
        >
          <Stack flex={1} spacing={{ base: 5, md: 10 }}>
            <Heading
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: '3xl', sm: '4xl', lg: '6xl' }}
            >
              <Text as="span" color="blue.400">
                CodeSnippets
              </Text>
              <br />
              <Text as="span" fontSize={{ base: '2xl', sm: '3xl', lg: '4xl' }}>
                Your Personal Code Library
              </Text>
            </Heading>
            <Text color="gray.500">
              Store, organize, and share your code snippets with ease. Access your
              code from anywhere, collaborate with others, and boost your
              productivity.
            </Text>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: 'column', sm: 'row' }}
            >
              <Button
                as={Link}
                to="/signup"
                rounded="full"
                size="lg"
                fontWeight="normal"
                px={6}
                colorScheme="blue"
              >
                Get Started
              </Button>
              <Button
                as={Link}
                to="/login"
                rounded="full"
                size="lg"
                fontWeight="normal"
                px={6}
                variant="outline"
              >
                Sign In
              </Button>
            </Stack>
          </Stack>
          <Flex
            flex={1}
            justify="center"
            align="center"
            position="relative"
            w="full"
          >
            <Image
              alt="Hero Image"
              fit="cover"
              align="center"
              w="100%"
              h="100%"
              src="https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80"
              rounded="lg"
            />
          </Flex>
        </Stack>
      </Container>

      {/* Features Section */}
      <Box bg="gray.100">
        <Container maxW="7xl" py={16}>
          <Stack spacing={4} as={Container} maxW="3xl" textAlign="center">
            <Heading fontSize="3xl">Features</Heading>
            <Text color="gray.600" fontSize="xl">
              Everything you need to manage your code snippets efficiently
            </Text>
          </Stack>

          <Container maxW="7xl" mt={10}>
            <Stack
              spacing={{ base: 10, md: 4 }}
              direction={{ base: 'column', md: 'row' }}
            >
              <Feature
                icon={FaCode}
                title="Code Organization"
                text="Organize your snippets with tags, categories, and search functionality"
              />
              <Feature
                icon={FaLock}
                title="Secure Storage"
                text="Your code is stored securely with Firebase authentication"
              />
              <Feature
                icon={FaShare}
                title="Easy Sharing"
                text="Share your snippets with others or keep them private"
              />
            </Stack>
          </Container>
        </Container>
      </Box>
    </Box>
  );
}
