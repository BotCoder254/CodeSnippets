import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
  useToast,
  Grid,
  GridItem,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  Button,
} from '@chakra-ui/react';
import { FiCode, FiPlus, FiFolder } from 'react-icons/fi';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import SnippetForm from './SnippetForm';
import SnippetList from './SnippetList';
import Sidebar from '../dashboard/Sidebar';
import FolderStructure from './FolderStructure';

const SnippetsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [snippetsByLanguage, setSnippetsByLanguage] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    const fetchFolders = async () => {
      try {
        const q = collection(db, 'folders');
        const querySnapshot = await getDocs(q);
        const folderList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFolders(folderList);
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    };

    const fetchSnippets = async () => {
      try {
        const q = collection(db, 'snippets');
        const querySnapshot = await getDocs(q);
        const snippetsData = {};
        
        querySnapshot.docs.forEach(doc => {
          const snippet = { id: doc.id, ...doc.data() };
          if (snippet.userId === currentUser.uid) {
            const language = snippet.language || 'Other';
            if (!snippetsData[language]) {
              snippetsData[language] = [];
            }
            snippetsData[language].push(snippet);
          }
        });
        
        setSnippetsByLanguage(snippetsData);
      } catch (error) {
        console.error('Error fetching snippets:', error);
      }
    };

    fetchFolders();
    fetchSnippets();
  }, [currentUser]);

  const handleCreateFolder = async (name) => {
    if (!name.trim() || !currentUser) return;

    try {
      const folderData = {
        name: name.trim(),
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'folders'), folderData);
      const newFolder = { id: docRef.id, ...folderData };
      setFolders(prev => [...prev, newFolder]);
      
      toast({
        title: 'Success',
        description: 'Folder created',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Could not create folder',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleEditFolder = async (folderId, newName) => {
    if (!newName.trim()) return;

    try {
      await updateDoc(doc(db, 'folders', folderId), { 
        name: newName.trim() 
      });
      
      setFolders(prev => 
        prev.map(folder => 
          folder.id === folderId 
            ? { ...folder, name: newName.trim() } 
            : folder
        )
      );
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Could not rename folder',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleDeleteFolder = async (folder) => {
    try {
      await deleteDoc(doc(db, 'folders', folder.id));
      setFolders(prev => prev.filter(f => f.id !== folder.id));
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Could not delete folder',
        status: 'error',
        duration: 2000,
      });
    }
  };

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
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Icon as={FiCode} w={6} h={6} color="blue.500" />
                <Heading size="lg">Code Snippets</Heading>
              </HStack>
              <Button leftIcon={<FiFolder />} onClick={onOpen}>
                Manage Folders
              </Button>
            </HStack>

            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              <GridItem colSpan={{ base: 12, lg: 3 }}>
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Heading size="sm" mb={4}>Languages</Heading>
                  <VStack align="stretch" spacing={2}>
                    {Object.entries(snippetsByLanguage).map(([language, snippets]) => (
                      <Button
                        key={language}
                        variant="ghost"
                        justifyContent="flex-start"
                        leftIcon={<FiCode />}
                        size="sm"
                      >
                        {language} ({snippets.length})
                      </Button>
                    ))}
                  </VStack>
                </Box>
              </GridItem>

              <GridItem colSpan={{ base: 12, lg: 9 }}>
                <Box
                  bg={bgColor}
                  borderRadius="xl"
                  boxShadow="base"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Tabs isLazy variant="enclosed-colored">
                    <TabList bg={useColorModeValue('gray.50', 'gray.700')} px={4} pt={4}>
                      <Tab
                        _selected={{
                          bg: bgColor,
                          borderColor: borderColor,
                          borderBottom: 'none',
                          mb: '-1px',
                        }}
                        px={6}
                      >
                        <HStack spacing={2}>
                          <FiCode />
                          <Text>My Snippets</Text>
                        </HStack>
                      </Tab>
                      <Tab
                        _selected={{
                          bg: bgColor,
                          borderColor: borderColor,
                          borderBottom: 'none',
                          mb: '-1px',
                        }}
                        px={6}
                      >
                        <HStack spacing={2}>
                          <FiPlus />
                          <Text>Create New</Text>
                        </HStack>
                      </Tab>
                    </TabList>

                    <TabPanels>
                      <TabPanel p={0}>
                        <Box p={6}>
                          <SnippetList
                            folder={selectedFolder}
                            snippetsByLanguage={snippetsByLanguage}
                          />
                        </Box>
                      </TabPanel>
                      <TabPanel p={0}>
                        <Box maxW="800px" mx="auto" p={6}>
                          <SnippetForm folder={selectedFolder} />
                        </Box>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </GridItem>
            </Grid>
          </VStack>
        </Container>
      </Box>

      <Drawer isOpen={isOpen} onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Manage Folders</DrawerHeader>
          <DrawerBody>
            <FolderStructure
              folders={folders}
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
              onFolderCreate={handleCreateFolder}
              onFolderEdit={handleEditFolder}
              onFolderDelete={handleDeleteFolder}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
};

export default SnippetsPage;
