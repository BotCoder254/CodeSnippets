import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  useToast,
  Heading,
  Divider,
  Code,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCopy,
  FiFilter,
} from 'react-icons/fi';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import SnippetForm from './SnippetForm';

const SnippetList = () => {
  const { currentUser } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [viewMode, setViewMode] = useState('view'); // 'view' or 'edit'
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (!currentUser) return;

    const snippetsRef = collection(db, 'snippets');
    const q = query(snippetsRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const snippetList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSnippets(snippetList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (snippetId) => {
    try {
      await deleteDoc(doc(db, 'snippets', snippetId));
      toast({
        title: 'Snippet deleted',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error deleting snippet',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copied!',
      status: 'success',
      duration: 2000,
    });
  };

  const filteredSnippets = snippets
    .filter(snippet => 
      (snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
       snippet.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!filterLanguage || snippet.language === filterLanguage)
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const languages = [...new Set(snippets.map(snippet => snippet.language))];

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <HStack spacing={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search snippets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg={bgColor}
            />
          </InputGroup>
          <Select
            placeholder="All Languages"
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            bg={bgColor}
            w="200px"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </Select>
        </HStack>

        {filteredSnippets.map((snippet) => (
          <Box
            key={snippet.id}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            borderColor={borderColor}
            bg={bgColor}
            _hover={{ bg: hoverBg }}
            transition="all 0.2s"
          >
            <VStack align="stretch" spacing={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">{snippet.title}</Heading>
                <HStack spacing={2}>
                  <IconButton
                    icon={<FiEye />}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSnippet(snippet);
                      setViewMode('view');
                      onOpen();
                    }}
                    aria-label="View"
                  />
                  <IconButton
                    icon={<FiEdit2 />}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSnippet(snippet);
                      setViewMode('edit');
                      onOpen();
                    }}
                    aria-label="Edit"
                  />
                  <IconButton
                    icon={<FiTrash2 />}
                    variant="ghost"
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(snippet.id)}
                    aria-label="Delete"
                  />
                </HStack>
              </Flex>
              
              <Text color="gray.600" noOfLines={2}>
                {snippet.description}
              </Text>
              
              <HStack spacing={4}>
                <Badge colorScheme="blue">{snippet.language}</Badge>
                {snippet.tags && snippet.tags.split(',').map((tag, index) => (
                  <Badge key={index} colorScheme="gray">
                    {tag.trim()}
                  </Badge>
                ))}
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {viewMode === 'view' ? 'View Snippet' : 'Edit Snippet'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {viewMode === 'view' && selectedSnippet ? (
              <VStack align="stretch" spacing={4}>
                <Heading size="md">{selectedSnippet.title}</Heading>
                <Text color="gray.600">{selectedSnippet.description}</Text>
                <Divider />
                <HStack justify="space-between">
                  <Badge colorScheme="blue">{selectedSnippet.language}</Badge>
                  <Button
                    size="sm"
                    leftIcon={<FiCopy />}
                    onClick={() => handleCopy(selectedSnippet.code)}
                  >
                    Copy Code
                  </Button>
                </HStack>
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="md"
                  maxH="400px"
                  overflowY="auto"
                >
                  <Code>{selectedSnippet.code}</Code>
                </Box>
              </VStack>
            ) : (
              <SnippetForm
                initialData={selectedSnippet}
                onSubmit={() => {
                  onClose();
                  toast({
                    title: 'Snippet updated',
                    status: 'success',
                    duration: 3000,
                  });
                }}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SnippetList;
