import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Tooltip,
  useClipboard,
  Switch,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Icon,
  MenuDivider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Progress,
  Grid,
  ButtonGroup,
  Collapse,
  Avatar,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCopy,
  FiFilter,
  FiShare2,
  FiGlobe,
  FiLock,
  FiChevronDown,
  FiTag,
  FiDownload,
  FiUpload,
  FiFileText,
  FiCode,
  FiDatabase,
  FiCheck,
  FiFolder,
  FiChevronRight,
  FiGrid,
  FiFolders,
  FiTerminal,
  FiSun,
  FiMoon,
  FiCoffee,
  FiPlus,
  FiX,
  FiMoreVertical,
  FiHeart,
  FiStar,
} from 'react-icons/fi';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDocs, addDoc, writeBatch, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import SnippetForm from './SnippetForm';
import { exportSnippets, importSnippets, exportAsPlainText } from '../../utils/backupUtils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  tomorrow as darkTheme,
  prism as lightTheme
} from 'react-syntax-highlighter/dist/esm/styles/prism';

const StatCard = ({ title, value, icon, colorScheme = "blue" }) => {
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
          {value}
        </Text>
      </VStack>
    </Box>
  );
};

const FolderView = ({ snippets, languageStats, onSnippetClick }) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const { currentUser } = useAuth();
  const toast = useToast();

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

  const handleRemoveFromFolder = async (snippetId) => {
    try {
      const snippetRef = doc(db, 'snippets', snippetId);
      await updateDoc(snippetRef, {
        folderId: null,
        updatedAt: new Date().toISOString()
      });
      toast({
        title: 'Snippet removed from folder',
        status: 'success',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Error removing snippet',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleFolderClick = (folderId) => {
    setSelectedFolder(selectedFolder === folderId ? null : folderId);
  };

  const getFolderSnippets = (folderId) => {
    return snippets.filter(snippet => snippet.folderId === folderId);
  };

  return (
    <Grid templateColumns={{ base: "1fr", lg: "250px 1fr" }} gap={6}>
      {/* Folder Navigation */}
      <Box
        bg={bgColor}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        p={4}
        height="fit-content"
      >
        <VStack align="stretch" spacing={2}>
          <Heading size="sm" mb={2}>Folders</Heading>
          {folders.map(folder => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? "solid" : "ghost"}
              colorScheme={selectedFolder === folder.id ? "blue" : "gray"}
              justifyContent="flex-start"
              leftIcon={<Icon as={FiFolder} />}
              onClick={() => handleFolderClick(folder.id)}
              size="sm"
              width="100%"
            >
              {folder.name}
            </Button>
          ))}
        </VStack>
      </Box>

      {/* Snippets Display */}
      <Box>
        {selectedFolder ? (
          <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap={6}>
            {getFolderSnippets(selectedFolder).map(snippet => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onView={() => onSnippetClick(snippet)}
                onRemoveFromFolder={() => handleRemoveFromFolder(snippet.id)}
                showAuthor={true}
              />
            ))}
          </Grid>
        ) : (
          <Text color="gray.500" textAlign="center">Select a folder to view snippets</Text>
        )}
      </Box>
    </Grid>
  );
};

const getLanguageIcon = (language) => {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'typescript':
    case 'jsx':
    case 'tsx':
      return FiCode;
    case 'python':
      return FiTerminal;
    case 'java':
      return FiCoffee;
    default:
      return FiCode;
  }
};

export const CodeViewer = ({ code, language }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [theme, setTheme] = useState('dark');
  const colorMode = useColorModeValue('light', 'dark');
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Update theme when color mode changes
  useEffect(() => {
    setTheme(colorMode);
  }, [colorMode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleThemeToggle = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const customStyle = {
    margin: 0,
    borderRadius: '0.375rem',
    fontSize: '0.9em',
  };

  return (
    <Box
      position="relative"
      borderRadius="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <HStack
        justify="space-between"
        bg={bgColor}
        p={2}
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <HStack spacing={3}>
          <Badge colorScheme="blue" fontSize="sm">
            {language}
          </Badge>
          <HStack spacing={2}>
            <Icon as={FiTerminal} color="gray.500" />
            <Text fontSize="sm" color="gray.500">
              {code.split('\n').length} lines
            </Text>
          </HStack>
        </HStack>
        <HStack spacing={2}>
          <IconButton
            icon={<Icon as={theme === 'dark' ? FiSun : FiMoon} />}
            size="sm"
            variant="ghost"
            aria-label="Toggle theme"
            onClick={handleThemeToggle}
          />
          <Button
            size="sm"
            leftIcon={<Icon as={isCopied ? FiCheck : FiCopy} />}
            onClick={handleCopy}
            colorScheme={isCopied ? 'green' : 'blue'}
            variant="ghost"
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </Button>
        </HStack>
      </HStack>

      <Box
        position="relative"
        maxH="600px"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: borderColor,
            borderRadius: '4px',
          },
        }}
      >
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={theme === 'dark' ? darkTheme : lightTheme}
          customStyle={customStyle}
          showLineNumbers
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
};

export const SnippetCard = ({ 
  snippet, 
  onView, 
  onEdit, 
  onDelete, 
  onShare, 
  onTogglePublic, 
  onLike, 
  isLiked, 
  onFavorite,
  isFavorite,
  onRemoveFromFolder,
  showAuthor = false 
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { hasCopied, onCopy } = useClipboard(snippet.code);

  return (
    <Box
      p={6}
      borderWidth="1px"
      borderRadius="xl"
      borderColor={borderColor}
      bg={bgColor}
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
        borderColor: 'blue.200',
      }}
      transition="all 0.2s"
      position="relative"
    >
      <VStack align="stretch" spacing={4}>
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Heading size="md" noOfLines={1}>
              {snippet.title}
            </Heading>
            <Tooltip label={snippet.isPublic ? 'Public' : 'Private'}>
              <Box>
                <Icon
                  as={snippet.isPublic ? FiGlobe : FiLock}
                  color={snippet.isPublic ? 'green.500' : 'gray.500'}
                  boxSize={5}
                />
              </Box>
            </Tooltip>
          </HStack>
          <HStack spacing={2}>
            <Tooltip label="View">
              <IconButton
                icon={<FiEye />}
                variant="ghost"
                colorScheme="blue"
                size="sm"
                onClick={onView}
                aria-label="View"
              />
            </Tooltip>
            {onEdit && (
              <Tooltip label="Edit">
                <IconButton
                  icon={<FiEdit2 />}
                  variant="ghost"
                  colorScheme="green"
                  size="sm"
                  onClick={onEdit}
                  aria-label="Edit"
                />
              </Tooltip>
            )}
            <Tooltip label={snippet.isPublic ? 'Share' : 'Make public to share'}>
              <IconButton
                icon={<FiShare2 />}
                variant="ghost"
                colorScheme="purple"
                size="sm"
                onClick={onShare}
                aria-label="Share"
                isDisabled={!snippet.isPublic}
              />
            </Tooltip>
            {onFavorite && (
              <Tooltip label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  icon={<Icon as={FiStar} />}
                  variant="ghost"
                  colorScheme={isFavorite ? 'yellow' : 'gray'}
                  size="sm"
                  onClick={onFavorite}
                  aria-label="Toggle favorite"
                />
              </Tooltip>
            )}
            {onLike && (
              <Tooltip label={isLiked ? 'Unlike' : 'Like'}>
                <IconButton
                  icon={<FiHeart />}
                  variant="ghost"
                  colorScheme={isLiked ? 'red' : 'gray'}
                  size="sm"
                  onClick={onLike}
                  aria-label="Like"
                />
              </Tooltip>
            )}
            {onRemoveFromFolder && (
              <Tooltip label="Remove from folder">
                <IconButton
                  icon={<FiX />}
                  variant="ghost"
                  colorScheme="red"
                  size="sm"
                  onClick={onRemoveFromFolder}
                  aria-label="Remove from folder"
                />
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip label="Delete">
                <IconButton
                  icon={<FiTrash2 />}
                  variant="ghost"
                  colorScheme="red"
                  size="sm"
                  onClick={onDelete}
                  aria-label="Delete"
                />
              </Tooltip>
            )}
          </HStack>
        </Flex>

        <Text color="gray.600" noOfLines={2} fontSize="md">
          {snippet.description}
        </Text>

        <HStack spacing={4} wrap="wrap">
          <Badge
            colorScheme="blue"
            fontSize="sm"
            px={3}
            py={1}
            borderRadius="full"
          >
            {snippet.language}
          </Badge>
          {snippet.subCategory && (
            <Badge
              colorScheme="purple"
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {snippet.subCategory}
            </Badge>
          )}
        </HStack>

        {snippet.tags && snippet.tags.length > 0 && (
          <Wrap spacing={2}>
            {snippet.tags.map((tag, index) => (
              <WrapItem key={index}>
                <Tag
                  size="sm"
                  variant="subtle"
                  colorScheme="gray"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                >
                  <TagLabel>{tag}</TagLabel>
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        )}

        <Divider />

        <HStack justify="space-between" align="center">
          {(showAuthor || snippet.userName) && (
            <HStack spacing={2}>
              <Avatar
                size="sm"
                src={snippet.userPhotoURL}
                name={snippet.userName || 'User'}
              />
              <VStack spacing={0} align="start">
                <Text fontSize="sm" fontWeight="medium">
                  {snippet.userName || 'User'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {new Date(snippet.createdAt).toLocaleDateString()}
                </Text>
              </VStack>
            </HStack>
          )}
          <HStack spacing={4}>
            <HStack spacing={1}>
              <Icon 
                as={FiHeart} 
                color={isLiked ? 'red.500' : 'gray.500'}
              />
              <Text fontSize="sm">{snippet.likes || 0}</Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={FiEye} color="blue.500" />
              <Text fontSize="sm">{snippet.views || 0}</Text>
            </HStack>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};

const SnippetList = () => {
  const { currentUser } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [viewMode, setViewMode] = useState('view');
  const toast = useToast();
  const [importProgress, setImportProgress] = useState(null);
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const fileInputRef = useRef();
  const cancelRef = useRef();
  const [stats, setStats] = useState({
    totalSnippets: 0,
    languages: 0,
    publicSnippets: 0,
    totalTags: 0
  });
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'folder'
  const [languages, setLanguages] = useState([]);
  const [languageStats, setLanguageStats] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [viewedSnippets, setViewedSnippets] = useState(new Set());
  const [likedSnippets, setLikedSnippets] = useState(new Set());

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.700');
  const codeTheme = useColorModeValue('light', 'dark');

  useEffect(() => {
    if (!currentUser) return;

    // Fetch favorites
    const favoritesRef = collection(db, 'favorites');
    const favoritesQuery = query(
      favoritesRef,
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeFavorites = onSnapshot(favoritesQuery, (snapshot) => {
      const favoritesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFavorites(favoritesList);
    });

    // Fetch snippets
    const snippetsRef = collection(db, 'snippets');
    const snippetsQuery = query(
      snippetsRef,
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeSnippets = onSnapshot(snippetsQuery, (snapshot) => {
      const snippetList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSnippets(snippetList);
      
      // Calculate stats
      const uniqueLanguages = new Set(snippetList.map(s => s.language));
      const uniqueTags = new Set(snippetList.flatMap(s => s.tags || []));
      const publicCount = snippetList.filter(s => s.isPublic).length;

      setStats({
        totalSnippets: snippetList.length,
        languages: uniqueLanguages.size,
        publicSnippets: publicCount,
        totalTags: uniqueTags.size
      });

      // Update available tags and subcategories
      setAvailableTags(Array.from(uniqueTags).sort());
      setSubCategories(Array.from(new Set(snippetList.map(s => s.subCategory).filter(Boolean))).sort());
    });

    return () => {
      unsubscribeFavorites();
      unsubscribeSnippets();
    };
  }, [currentUser]);

  // Update the language select options to include count
  const languageOptions = useMemo(() => {
    return languages.map(lang => ({
      value: lang,
      label: `${lang} (${languageStats[lang] || 0})`,
    }));
  }, [languages, languageStats]);

  useEffect(() => {
    // Calculate stats whenever snippets change
    const calculateStats = () => {
      const uniqueLanguages = new Set(snippets.map(s => s.language));
      const publicCount = snippets.filter(s => s.isPublic).length;
      const uniqueTags = new Set(snippets.flatMap(s => s.tags));

      setStats({
        totalSnippets: snippets.length,
        languages: uniqueLanguages.size,
        publicSnippets: publicCount,
        totalTags: uniqueTags.size
      });
    };

    calculateStats();
  }, [snippets]);

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

  const handleShareLink = (snippet) => {
    const shareUrl = `${window.location.origin}/snippet/${snippet.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Share link copied!',
      description: 'The link has been copied to your clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  const handleTogglePublic = async (snippet) => {
    try {
      const snippetRef = doc(db, 'snippets', snippet.id);
      await updateDoc(snippetRef, {
        isPublic: !snippet.isPublic,
      });
      toast({
        title: `Snippet is now ${!snippet.isPublic ? 'public' : 'private'}`,
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error updating snippet',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleAddFilterTag = (tag) => {
    if (!filterTags.includes(tag)) {
      setFilterTags([...filterTags, tag]);
    }
  };

  const handleRemoveFilterTag = (tag) => {
    setFilterTags(filterTags.filter(t => t !== tag));
  };

  const filteredSnippets = snippets
    .filter(snippet => {
      const matchesSearch = (
        snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesLanguage = !filterLanguage || snippet.language === filterLanguage;
      
      const matchesTags = filterTags.length === 0 || 
        filterTags.every(tag => snippet.tags.includes(tag));
      
      const matchesSubCategory = !filterSubCategory || 
        snippet.subCategory === filterSubCategory;

      return matchesSearch && matchesLanguage && matchesTags && matchesSubCategory;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleExport = async (format = 'json') => {
    try {
      if (format === 'json') {
        await exportSnippets(currentUser.uid);
      } else {
        await exportAsPlainText(currentUser.uid);
      }
      toast({
        title: 'Export Successful',
        description: 'Your snippets have been exported successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportProgress({ status: 'processing', progress: 0 });
      onImportOpen();

      const results = await importSnippets(file, currentUser.uid);
      
      setImportProgress({
        status: 'complete',
        progress: 100,
        results,
      });

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${results.imported} snippets. ${results.failed} failed.`,
        status: results.failed > 0 ? 'warning' : 'success',
        duration: 5000,
      });
    } catch (error) {
      setImportProgress({
        status: 'error',
        error: error.message,
      });
      toast({
        title: 'Import Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleToggleFavorite = async (snippet) => {
    try {
      const favoritesRef = collection(db, 'favorites');
      const existingFavorite = favorites.find(f => f.snippetId === snippet.id);

      if (existingFavorite) {
        // Remove from favorites
        await deleteDoc(doc(db, 'favorites', existingFavorite.id));
        toast({
          title: 'Removed from favorites',
          status: 'success',
          duration: 2000,
        });
      } else {
        // Add to favorites
        await addDoc(favoritesRef, {
          userId: currentUser.uid,
          snippetId: snippet.id,
          createdAt: new Date().toISOString(),
        });
        toast({
          title: 'Added to favorites',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error updating favorites',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleView = async (snippet) => {
    if (viewedSnippets.has(snippet.id)) {
      setSelectedSnippet(snippet);
      setViewMode('view');
      onOpen();
      return;
    }

    try {
      const snippetRef = doc(db, 'snippets', snippet.id);
      await updateDoc(snippetRef, {
        views: increment(1),
      });
      setViewedSnippets(prev => new Set([...prev, snippet.id]));
      setSelectedSnippet(snippet);
      setViewMode('view');
      onOpen();
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  const handleLike = async (snippet) => {
    if (likedSnippets.has(snippet.id)) {
      toast({
        title: 'Already liked',
        description: 'You have already liked this snippet',
        status: 'info',
        duration: 2000,
      });
      return;
    }

    try {
      const snippetRef = doc(db, 'snippets', snippet.id);
      await updateDoc(snippetRef, {
        likes: increment(1),
        likedBy: arrayUnion(currentUser.uid),
      });
      setLikedSnippets(prev => new Set([...prev, snippet.id]));
      toast({
        title: 'Snippet liked',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error liking snippet',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Search and Filters Section */}
        <Box
          bg={bgColor}
          p={6}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="sm"
          position="sticky"
          top="4"
          zIndex="sticky"
          backdropFilter="blur(8px)"
        >
          <VStack spacing={6}>
            <HStack spacing={4} width="100%" justify="space-between">
              <HStack spacing={4} flex={1}>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" boxSize={5} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search snippets by title, description, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg={inputBg}
                    _placeholder={{ color: 'gray.400' }}
                    fontSize="md"
                  />
                </InputGroup>
              </HStack>
              <ButtonGroup isAttached variant="outline" size="lg">
                <IconButton
                  icon={<FiGrid />}
                  aria-label="Grid View"
                  onClick={() => setViewType('grid')}
                  colorScheme={viewType === 'grid' ? 'blue' : 'gray'}
                />
                <IconButton
                  icon={<FiFolder />}
                  aria-label="Folder View"
                  onClick={() => setViewType('folder')}
                  colorScheme={viewType === 'folder' ? 'blue' : 'gray'}
                />
              </ButtonGroup>
            </HStack>

            <HStack spacing={4} width="100%">
              <Menu closeOnSelect={false}>
                <MenuButton
                  as={Button}
                  rightIcon={<FiChevronDown />}
                  leftIcon={<FiTag />}
                  variant="outline"
                  size="lg"
                >
                  Filter by Tags ({filterTags.length})
                </MenuButton>
                <MenuList maxH="300px" overflowY="auto">
                  {availableTags.map((tag) => (
                    <MenuItem
                      key={tag}
                      onClick={() => handleAddFilterTag(tag)}
                      isDisabled={filterTags.includes(tag)}
                      icon={
                        <Icon
                          as={filterTags.includes(tag) ? FiCheck : FiTag}
                          color={filterTags.includes(tag) ? "green.500" : "gray.400"}
                        />
                      }
                    >
                      {tag}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>

              <Select
                placeholder="All Languages"
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                bg={inputBg}
                size="lg"
                icon={<FiCode />}
              >
                {languageOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>

              <Select
                placeholder={`All Sub-categories (${subCategories.length})`}
                value={filterSubCategory}
                onChange={(e) => setFilterSubCategory(e.target.value)}
                bg={inputBg}
                size="lg"
                icon={<FiFolder />}
              >
                {subCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </HStack>

            {filterTags.length > 0 && (
              <Wrap spacing={2}>
                {filterTags.map((tag) => (
                  <WrapItem key={tag}>
                    <Tag
                      size="lg"
                      borderRadius="full"
                      variant="subtle"
                      colorScheme="blue"
                      px={4}
                      py={2}
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveFilterTag(tag)} />
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </VStack>
        </Box>

        {/* View Toggle */}
        {viewType === 'folder' ? (
          <FolderView
            snippets={filteredSnippets}
            languageStats={languageStats}
            onSnippetClick={handleView}
          />
        ) : (
          <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap={6}>
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onView={() => handleView(snippet)}
                onEdit={() => {
                  setSelectedSnippet(snippet);
                  setViewMode('edit');
                  onOpen();
                }}
                onDelete={() => handleDelete(snippet.id)}
                onShare={() => handleShareLink(snippet)}
                onTogglePublic={() => handleTogglePublic(snippet)}
                onFavorite={() => handleToggleFavorite(snippet)}
                onLike={() => handleLike(snippet)}
                isLiked={likedSnippets.has(snippet.id)}
                isFavorite={favorites.some(f => f.snippetId === snippet.id)}
              />
            ))}
          </Grid>
        )}
      </VStack>

      {/* Enhanced Modal for View/Edit */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader borderBottomWidth="1px">
            <HStack justify="space-between">
              <Text>{viewMode === 'view' ? 'View Snippet' : 'Edit Snippet'}</Text>
              {viewMode === 'view' && selectedSnippet && (
                <HStack spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="is-public" mb="0" mr={2}>
                      Public
                    </FormLabel>
                    <Switch
                      id="is-public"
                      isChecked={selectedSnippet.isPublic}
                      onChange={() => handleTogglePublic(selectedSnippet)}
                      colorScheme="green"
                    />
                  </FormControl>
                  <Button
                    size="sm"
                    leftIcon={<FiShare2 />}
                    onClick={() => handleShareLink(selectedSnippet)}
                    isDisabled={!selectedSnippet.isPublic}
                    colorScheme="blue"
                  >
                    Share
                  </Button>
                </HStack>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {viewMode === 'view' && selectedSnippet ? (
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={2}>{selectedSnippet.title}</Heading>
                  <Text color="gray.600">{selectedSnippet.description}</Text>
                </Box>

                <HStack spacing={2} wrap="wrap">
                  {selectedSnippet.subCategory && (
                    <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                      {selectedSnippet.subCategory}
                    </Badge>
                  )}
                  {selectedSnippet.tags && selectedSnippet.tags.map((tag, index) => (
                    <Badge key={index} colorScheme="gray" fontSize="md" px={3} py={1}>
                      {tag}
                    </Badge>
                  ))}
                </HStack>

                <CodeViewer
                  code={selectedSnippet.code}
                  language={selectedSnippet.language.toLowerCase()}
                  theme={codeTheme}
                />

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.500">
                    Last updated: {new Date(selectedSnippet.updatedAt).toLocaleDateString()}
                  </Text>
                  <HStack spacing={4}>
                    <Button
                      size="sm"
                      leftIcon={<FiEdit2 />}
                      onClick={() => setViewMode('edit')}
                      variant="ghost"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<FiShare2 />}
                      onClick={() => handleShareLink(selectedSnippet)}
                      isDisabled={!selectedSnippet.isPublic}
                      colorScheme="blue"
                    >
                      Share
                    </Button>
                  </HStack>
                </HStack>
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

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleImportFile}
        onClick={(e) => {
          e.target.value = null;
        }}
      />

      <AlertDialog
        isOpen={isImportOpen}
        leastDestructiveRef={cancelRef}
        onClose={onImportClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>
              Importing Snippets
            </AlertDialogHeader>
            <AlertDialogBody>
              {importProgress?.status === 'processing' && (
                <VStack spacing={4}>
                  <Text>Processing your snippets...</Text>
                  <Progress
                    size="sm"
                    isIndeterminate
                    width="100%"
                    colorScheme="blue"
                  />
                </VStack>
              )}
              {importProgress?.status === 'complete' && (
                <VStack spacing={4} align="stretch">
                  <Text>Import Complete!</Text>
                  <Box>
                    <Text>Successfully imported: {importProgress.results.imported}</Text>
                    <Text>Failed: {importProgress.results.failed}</Text>
                  </Box>
                  {importProgress.results.errors.length > 0 && (
                    <Box>
                      <Text fontWeight="bold">Errors:</Text>
                      {importProgress.results.errors.map((error, index) => (
                        <Text key={index} color="red.500">
                          {error.snippet}: {error.error}
                        </Text>
                      ))}
                    </Box>
                  )}
                </VStack>
              )}
              {importProgress?.status === 'error' && (
                <Text color="red.500">
                  {importProgress.error}
                </Text>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onImportClose}>
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default SnippetList;
