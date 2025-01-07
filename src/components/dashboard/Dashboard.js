import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Flex,
  SimpleGrid,
  Icon,
  VStack,
} from '@chakra-ui/react';
import { FiCode, FiDatabase, FiTag } from 'react-icons/fi';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';

const StatCard = ({ title, stat, icon, description }) => {
  return (
    <Stat
      px={{ base: 4, md: 8 }}
      py="5"
      shadow="xl"
      border="1px solid"
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded="lg"
      backgroundColor={useColorModeValue('blue.500', 'blue.200')}
      color="white"
    >
      <Flex justifyContent="space-between">
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight="medium" isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="medium">
            {stat}
          </StatNumber>
          {description && (
            <StatHelpText color="white" opacity={0.8}>
              {description}
            </StatHelpText>
          )}
        </Box>
        <Box
          my="auto"
          color="white"
          alignContent="center"
        >
          <Icon as={icon} w={8} h={8} />
        </Box>
      </Flex>
    </Stat>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalSnippets: 0,
    languages: new Set(),
    categories: new Set(),
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;

      try {
        const snippetsRef = collection(db, 'snippets');
        const q = query(snippetsRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const languages = new Set();
        const categories = new Set();
        
        querySnapshot.forEach((doc) => {
          const snippet = doc.data();
          if (snippet.language) languages.add(snippet.language);
          if (snippet.category) categories.add(snippet.category);
        });

        setStats({
          totalSnippets: querySnapshot.size,
          languages: languages.size,
          categories: categories.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [currentUser]);

  return (
    <Flex>
      <Sidebar />
      <Box
        ml={{ base: 0, md: 60 }}
        p="8"
        flex="1"
        minH="100vh"
        bg={useColorModeValue('gray.50', 'gray.800')}
      >
        <Container maxW="7xl">
          <VStack spacing={8} align="stretch">
            <Box>
              <Heading mb={2}>Welcome back!</Heading>
              <Text color="gray.600">
                Here's an overview of your code snippets
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, lg: 8 }}>
              <StatCard
                title="Total Snippets"
                stat={stats.totalSnippets}
                icon={FiCode}
                description="Your saved snippets"
              />
              <StatCard
                title="Languages"
                stat={stats.languages}
                icon={FiDatabase}
                description="Different languages used"
              />
              <StatCard
                title="Categories"
                stat={stats.categories}
                icon={FiTag}
                description="Organized categories"
              />
            </SimpleGrid>

            {/* Recent Activity Section */}
            <Box
              bg={useColorModeValue('white', 'gray.700')}
              p={6}
              rounded="lg"
              shadow="base"
            >
              <Heading size="md" mb={4}>
                Recent Activity
              </Heading>
              <Text color="gray.600">
                Your recent snippets will appear here
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
};

export default Dashboard;
