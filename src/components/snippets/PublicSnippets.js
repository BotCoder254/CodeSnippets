import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Grid,
  useColorModeValue,
  Icon,
  Avatar,
  Badge,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  IconButton,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { FiSearch, FiCode, FiFilter, FiHeart, FiEye, FiShare2 } from 'react-icons/fi';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../dashboard/Sidebar';
import { SnippetCard } from './SnippetList';
import { CodeViewer } from './SnippetList';

const PublicSnippets = () => {
  const { currentUser } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    // Fetch all public snippets
    const snippetsRef = collection(db, 'snippets');
    const q = query(
      snippetsRef,
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const snippetList = [];
        const uniqueLanguages = new Set();

        for (const doc of querySnapshot.docs) {
          const snippetData = { id: doc.id, ...doc.data() };
          
          // Add liked status for current user
          if (currentUser) {
            snippetData.isLikedByUser = snippetData.likedBy?.includes(currentUser.uid) || false;
          }

          snippetList.push(snippetData);
          if (snippetData.language) {
            uniqueLanguages.add(snippetData.language);
          }
        }

        setSnippets(snippetList);
        setLanguages(Array.from(uniqueLanguages).sort());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching snippets:', error);
        toast({
          title: 'Error fetching snippets',
          description: error.message,
          status: 'error',
          duration: 3000,
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser, toast]);

  const handleLike = async (snippet) => {
    if (!currentUser) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to like snippets',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const snippetRef = doc(db, 'snippets', snippet.id);
      const isLiked = snippet.likedBy?.includes(currentUser.uid);

      await updateDoc(snippetRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      });

      toast({
        title: isLiked ? 'Like removed' : 'Snippet liked',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error updating like',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleView = async (snippet) => {
    try {
      // Update view count
      const snippetRef = doc(db, 'snippets', snippet.id);
      await updateDoc(snippetRef, {
        views: increment(1),
      });

      // Open snippet view modal
      setSelectedSnippet(snippet);
      onOpen();
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  const handleShare = (snippet) => {
    const shareUrl = `${window.location.origin}/snippet/${snippet.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Share link copied!',
      description: 'The link has been copied to your clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = (
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesLanguage = !filterLanguage || snippet.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  return (
    <Box>
      <Sidebar />
      <Box
        ml={{ base: 0, md: 60 }}
        p="8"
        minH="100vh"
        bg={useColorModeValue('gray.50', 'gray.900')}
      >
        <Container maxW="7xl">
          <VStack spacing={8} align="stretch">
            {/* Search and Filters */}
            <Box
              bg={bgColor}
              p={6}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="sm"
            >
              <VStack spacing={4}>
                <HStack spacing={4} width="100%">
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="gray.400" boxSize={5} />
                    </InputLeftElement>
                    <Input
                      placeholder="Search public snippets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      bg={inputBg}
                    />
                  </InputGroup>
                  <Select
                    placeholder="All Languages"
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    bg={inputBg}
                    size="lg"
                    w="200px"
                    icon={<FiFilter />}
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </Select>
                </HStack>
              </VStack>
            </Box>

            {/* Snippets Grid */}
            <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap={6}>
              {filteredSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  showAuthor={true}
                  onView={() => handleView(snippet)}
                  onShare={() => handleShare(snippet)}
                  onLike={() => handleLike(snippet)}
                  isLiked={snippet.isLikedByUser}
                />
              ))}
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* Snippet View Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader borderBottomWidth="1px">
            <HStack justify="space-between">
              <Text>{selectedSnippet?.title}</Text>
              <HStack spacing={2}>
                <Tooltip label={selectedSnippet?.isLikedByUser ? 'Unlike' : 'Like'}>
                  <IconButton
                    icon={<FiHeart />}
                    colorScheme={selectedSnippet?.isLikedByUser ? 'red' : 'gray'}
                    variant="ghost"
                    onClick={() => selectedSnippet && handleLike(selectedSnippet)}
                    aria-label="Like"
                  />
                </Tooltip>
                <Tooltip label="Share">
                  <IconButton
                    icon={<FiShare2 />}
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => selectedSnippet && handleShare(selectedSnippet)}
                    aria-label="Share"
                  />
                </Tooltip>
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedSnippet && (
              <VStack align="stretch" spacing={4}>
                <Text color="gray.600">{selectedSnippet.description}</Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue">{selectedSnippet.language}</Badge>
                  {selectedSnippet.tags?.map((tag, index) => (
                    <Badge key={index} colorScheme="gray">{tag}</Badge>
                  ))}
                </HStack>
                <CodeViewer
                  code={selectedSnippet.code}
                  language={selectedSnippet.language.toLowerCase()}
                />
                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Avatar
                      size="sm"
                      src={selectedSnippet.userPhotoURL}
                      name={selectedSnippet.userName}
                    />
                    <Text fontSize="sm">{selectedSnippet.userName}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(selectedSnippet.createdAt).toLocaleDateString()}
                  </Text>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PublicSnippets; 