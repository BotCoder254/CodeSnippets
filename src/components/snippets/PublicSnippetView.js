import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  useColorModeValue,
  Heading,
  Code,
  Container,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { FiCopy } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const PublicSnippetView = () => {
  const { snippetId } = useParams();
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const snippetRef = doc(db, 'snippets', snippetId);
        const snippetDoc = await getDoc(snippetRef);

        if (!snippetDoc.exists()) {
          setError('Snippet not found');
          return;
        }

        const snippetData = snippetDoc.data();
        if (!snippetData.isPublic) {
          setError('This snippet is private');
          return;
        }

        setSnippet({ id: snippetDoc.id, ...snippetData });
      } catch (error) {
        setError('Error loading snippet');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnippet();
  }, [snippetId]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copied!',
      status: 'success',
      duration: 2000,
    });
  };

  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <Box
          p={6}
          bg={bgColor}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Heading size="md" color="red.500" mb={4}>
            Error
          </Heading>
          <Text>{error}</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Box
        p={6}
        bg={bgColor}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack align="stretch" spacing={6}>
          <Heading size="lg">{snippet.title}</Heading>
          
          <Text color="gray.600">
            {snippet.description}
          </Text>

          <HStack spacing={4}>
            <Badge colorScheme="blue">{snippet.language}</Badge>
            {snippet.tags && snippet.tags.map((tag, index) => (
              <Badge key={index} colorScheme="gray">
                {tag}
              </Badge>
            ))}
          </HStack>

          <Box>
            <HStack justify="flex-end" mb={2}>
              <Button
                size="sm"
                leftIcon={<Icon as={FiCopy} />}
                onClick={() => handleCopy(snippet.code)}
              >
                Copy Code
              </Button>
            </HStack>
            <Box
              p={4}
              bg="gray.50"
              borderRadius="md"
              maxH="600px"
              overflowY="auto"
            >
              <Code whiteSpace="pre" display="block">
                {snippet.code}
              </Code>
            </Box>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default PublicSnippetView; 