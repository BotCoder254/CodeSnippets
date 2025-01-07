import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  IconButton,
  Collapse,
  Button,
  Divider,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiCode,
  FiFolder,
  FiGlobe,
  FiStar,
  FiChevronRight,
  FiChevronDown,
  FiMenu,
} from 'react-icons/fi';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [folders, setFolders] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    if (!currentUser) return;

    const foldersRef = collection(db, 'folders');
    const q = query(foldersRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const folderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFolders(folderList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const NavItem = ({ icon, children, to, isActive }) => (
    <Link to={to}>
      <HStack
        spacing={4}
        px={4}
        py={3}
        rounded="lg"
        transition="all 0.2s"
        bg={isActive ? 'blue.400' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{
          bg: isActive ? 'blue.500' : hoverBgColor,
        }}
      >
        <Icon as={icon} boxSize={5} />
        <Text fontWeight="medium">{children}</Text>
      </HStack>
    </Link>
  );

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      h="100vh"
      pb="10"
      overflowX="hidden"
      overflowY="auto"
      bg={bgColor}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: 'full', md: 60 }}
      transform={{ base: isOpen ? 'translateX(0)' : 'translateX(-100%)', md: 'translateX(0)' }}
      transition="transform 0.3s"
      zIndex={20}
    >
      <VStack spacing={1} align="stretch" p={4}>
        <HStack justify="space-between" mb={4}>
          <Text fontSize="xl" fontWeight="bold">Code Snippets</Text>
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={() => setIsOpen(false)}
            icon={<FiMenu />}
            size="sm"
            variant="ghost"
          />
        </HStack>

        <NavItem
          icon={FiHome}
          to="/dashboard"
          isActive={location.pathname === '/dashboard'}
        >
          Dashboard
        </NavItem>

        <NavItem
          icon={FiCode}
          to="/snippets"
          isActive={location.pathname === '/snippets'}
        >
          My Snippets
        </NavItem>

        <Box py={2}>
          <Button
            w="full"
            justifyContent="space-between"
            variant="ghost"
            rightIcon={<Icon as={isFoldersExpanded ? FiChevronDown : FiChevronRight} />}
            onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
            mb={2}
          >
            <HStack spacing={4}>
              <Icon as={FiFolder} />
              <Text>Folders</Text>
            </HStack>
          </Button>
          
          <Collapse in={isFoldersExpanded}>
            <VStack align="stretch" pl={8} spacing={1}>
              {folders.map(folder => (
                <Link key={folder.id} to={`/snippets?folder=${folder.id}`}>
                  <HStack
                    spacing={4}
                    px={4}
                    py={2}
                    rounded="md"
                    transition="all 0.2s"
                    _hover={{
                      bg: hoverBgColor,
                    }}
                  >
                    <Icon as={FiFolder} boxSize={4} />
                    <Text fontSize="sm">{folder.name}</Text>
                  </HStack>
                </Link>
              ))}
            </VStack>
          </Collapse>
        </Box>

        <Divider my={2} />

        <NavItem
          icon={FiGlobe}
          to="/public"
          isActive={location.pathname === '/public'}
        >
          Public Snippets
        </NavItem>

        <NavItem
          icon={FiStar}
          to="/favorites"
          isActive={location.pathname === '/favorites'}
        >
          Favorites
        </NavItem>
      </VStack>
    </Box>
  );
};

export default Sidebar;
