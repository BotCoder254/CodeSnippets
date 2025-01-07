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
  Heading,
  useToast,
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiHeart } from 'react-icons/fi';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../dashboard/Sidebar';
import { SnippetCard } from './SnippetList';

const Favorites = () => {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    if (!currentUser) return;

    // Fetch user's favorite snippets
    const favoritesRef = collection(db, 'favorites');
    const q = query(
      favoritesRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const favoritesList = [];
        const uniqueLanguages = new Set();
        const snippetsRef = collection(db, 'snippets');

        for (const doc of querySnapshot.docs) {
          const favoriteData = doc.data();
          const snippetDoc = await snippetsRef.doc(favoriteData.snippetId).get();
          
          if (snippetDoc.exists) {
            const snippetData = { 
              id: snippetDoc.id, 
              ...snippetDoc.data(),
              favoriteId: doc.id 
            };
            favoritesList.push(snippetData);
            if (snippetData.language) {
              uniqueLanguages.add(snippetData.language);
            }
          }
        }

        setFavorites(favoritesList);
        setLanguages(Array.from(uniqueLanguages).sort());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast({
          title: 'Error fetching favorites',
          description: error.message,
          status: 'error',
          duration: 3000,
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser, toast]);

  const filteredFavorites = favorites.filter(favorite => {
    const matchesSearch = (
      favorite.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorite.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesLanguage = !filterLanguage || favorite.language === filterLanguage;
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
            <HStack justify="space-between">
              <Heading size="lg">
                <HStack>
                  <Icon as={FiHeart} color="red.500" />
                  <Text>Favorite Snippets</Text>
                </HStack>
              </Heading>
            </HStack>

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
                      placeholder="Search favorites..."
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

            {/* Favorites Grid */}
            <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap={6}>
              {filteredFavorites.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  showAuthor={true}
                  isFavorite={true}
                  onView={() => {
                    // Handle view action
                  }}
                  onShare={() => {
                    // Handle share action
                  }}
                  onRemoveFavorite={() => {
                    // Handle remove from favorites
                  }}
                />
              ))}
            </Grid>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Favorites; 