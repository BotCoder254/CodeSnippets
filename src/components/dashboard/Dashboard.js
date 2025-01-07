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
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Button,
  Image,
  Avatar,
} from '@chakra-ui/react';
import {
  FiCode,
  FiDatabase,
  FiTag,
  FiGlobe,
  FiClock,
  FiTrendingUp,
  FiEye,
  FiUser,
  FiActivity,
  FiHeart,
} from 'react-icons/fi';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, stat, icon, description, trend, colorScheme = "blue" }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      bg={bgColor}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="medium" color="gray.500">
            {title}
          </Text>
          <Icon as={icon} boxSize={6} color={`${colorScheme}.500`} />
        </HStack>
        <Text fontSize="3xl" fontWeight="bold">
          {stat}
        </Text>
        {description && (
          <HStack spacing={2} color="gray.500">
            {trend && (
              <Icon
                as={FiTrendingUp}
                color={trend > 0 ? 'green.500' : 'red.500'}
                transform={trend < 0 ? 'rotate(180deg)' : undefined}
              />
            )}
            <Text fontSize="sm">{description}</Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

const ActivityGraph = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Snippets Created',
        data: data.snippets,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Views',
        data: data.views,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 10,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Activity Over Time',
        font: {
          size: 16,
          weight: 'normal',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  return (
    <Box position="relative" h="400px" w="100%">
      <Line options={options} data={chartData} />
    </Box>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const loadingBgColor = useColorModeValue('gray.50', 'gray.800');
  
  const [stats, setStats] = useState({
    totalSnippets: 0,
    languages: new Set(),
    categories: new Set(),
    publicSnippets: 0,
    recentViews: 0,
    totalLikes: 0,
    weeklyGrowth: 0,
  });
  const [recentSnippets, setRecentSnippets] = useState([]);
  const [activityData, setActivityData] = useState({
    labels: [],
    snippets: [],
    views: [],
  });
  const [loading, setLoading] = useState(true);
  const [languageDistribution, setLanguageDistribution] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    // Real-time listener for snippets
    const snippetsRef = collection(db, 'snippets');
    const q = query(
      snippetsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const languages = new Set();
      const categories = new Set();
      let publicCount = 0;
      let totalLikes = 0;
      const langDist = {};
      
      querySnapshot.forEach((doc) => {
        const snippet = doc.data();
        if (snippet.language) {
          languages.add(snippet.language);
          langDist[snippet.language] = (langDist[snippet.language] || 0) + 1;
        }
        if (snippet.category) categories.add(snippet.category);
        if (snippet.isPublic) publicCount++;
        if (snippet.likes) totalLikes += snippet.likes;
      });

      // Calculate weekly growth
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklySnippets = querySnapshot.docs.filter(
        doc => doc.data().createdAt > weekAgo.toISOString()
      ).length;

      setStats({
        totalSnippets: querySnapshot.size,
        languages: languages.size,
        categories: categories.size,
        publicSnippets: publicCount,
        totalLikes,
        weeklyGrowth: weeklySnippets,
      });

      setLanguageDistribution(langDist);

      // Update recent snippets
      const recentDocs = querySnapshot.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentSnippets(recentDocs);

      // Generate activity data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const snippetsByDay = last7Days.map(date => 
        querySnapshot.docs.filter(doc => 
          doc.data().createdAt.split('T')[0] === date
        ).length
      );

      // Simulate view data (replace with actual view tracking)
      const viewsByDay = snippetsByDay.map(count => 
        Math.floor(count * (1 + Math.random()))
      );

      setActivityData({
        labels: last7Days.map(date => new Date(date).toLocaleDateString()),
        snippets: snippetsByDay,
        views: viewsByDay,
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <Flex>
        <Sidebar />
        <Box
          ml={{ base: 0, md: 60 }}
          p="8"
          flex="1"
          minH="100vh"
          bg={loadingBgColor}
        >
          <Progress size="xs" isIndeterminate />
        </Box>
      </Flex>
    );
  }

  return (
    <Flex>
      <Sidebar />
      <Box
        ml={{ base: 0, md: 60 }}
        p="8"
        flex="1"
        minH="100vh"
        bg={loadingBgColor}
      >
        <Container maxW="7xl">
          <VStack spacing={8} align="stretch">
            <HStack justify="space-between" align="center">
              <Box>
                <Heading size="lg" mb={2}>Welcome back, {currentUser.displayName || 'User'}!</Heading>
                <Text color="gray.600">
                  Here's an overview of your code snippets and recent activity
                </Text>
              </Box>
              <Avatar
                size="lg"
                src={currentUser.photoURL}
                name={currentUser.displayName}
              />
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, lg: 8 }}>
              <StatCard
                title="Total Snippets"
                stat={stats.totalSnippets}
                icon={FiCode}
                description="All your saved snippets"
                colorScheme="blue"
              />
              <StatCard
                title="Languages"
                stat={stats.languages}
                icon={FiDatabase}
                description="Different languages used"
                colorScheme="purple"
              />
              <StatCard
                title="Public Snippets"
                stat={stats.publicSnippets}
                icon={FiGlobe}
                description={`${Math.round((stats.publicSnippets / stats.totalSnippets) * 100)}% of total`}
                colorScheme="green"
              />
              <StatCard
                title="Weekly Growth"
                stat={stats.weeklyGrowth}
                icon={FiTrendingUp}
                description="New snippets this week"
                trend={stats.weeklyGrowth}
                colorScheme="orange"
              />
            </SimpleGrid>

            {/* Activity Graph */}
            <Box
              bg={bgColor}
              p={6}
              rounded="lg"
              shadow="base"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <ActivityGraph data={activityData} />
            </Box>

            {/* Recent Activity Section */}
            <Box
              bg={bgColor}
              p={6}
              rounded="lg"
              shadow="base"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <HStack justify="space-between" mb={6}>
                <Heading size="md">Recent Activity</Heading>
                <Button
                  as={Link}
                  to="/snippets"
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  rightIcon={<FiClock />}
                >
                  View All
                </Button>
              </HStack>
              
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Title</Th>
                    <Th>Language</Th>
                    <Th>Status</Th>
                    <Th>Created</Th>
                    <Th>Likes</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentSnippets.map((snippet) => (
                    <Tr key={snippet.id}>
                      <Td>
                        <Link to={`/snippets?id=${snippet.id}`}>
                          <Text color="blue.500" fontWeight="medium">
                            {snippet.title}
                          </Text>
                        </Link>
                      </Td>
                      <Td>
                        <Badge colorScheme="purple">{snippet.language}</Badge>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={snippet.isPublic ? 'green' : 'gray'}
                        >
                          {snippet.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </Td>
                      <Td>
                        <Text color="gray.600" fontSize="sm">
                          {new Date(snippet.createdAt).toLocaleDateString()}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Icon as={FiHeart} color="red.500" />
                          <Text>{snippet.likes || 0}</Text>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
};

export default Dashboard;
