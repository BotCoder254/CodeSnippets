import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  FormHelperText,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Switch,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Divider,
  Heading,
} from '@chakra-ui/react';
import { FiSave, FiX, FiChevronDown, FiClock, FiGitBranch, FiGitCommit } from 'react-icons/fi';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { diffLines } from 'diff';

const LANGUAGES = [
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'Ruby',
  'Go',
  'PHP',
  'Swift',
  'Rust',
  'TypeScript',
  'HTML',
  'CSS',
  'SQL',
  'Shell',
  'Other',
];

const COMMON_TAGS = {
  'JavaScript': ['React', 'Node.js', 'Vue.js', 'Angular', 'Express', 'Frontend', 'Backend', 'API'],
  'Python': ['Django', 'Flask', 'Data Science', 'Machine Learning', 'Automation', 'API'],
  'Java': ['Spring', 'Android', 'API', 'Backend', 'Utilities'],
  'C++': ['Algorithms', 'Data Structures', 'Game Dev', 'System Programming'],
  'TypeScript': ['React', 'Angular', 'Node.js', 'Frontend', 'Backend', 'API'],
};

const DEFAULT_TAGS = ['Utility', 'Algorithm', 'Frontend', 'Backend', 'Database', 'API', 'Testing', 'Documentation'];

const SnippetForm = ({ folder, onSubmit, initialData }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [folders, setFolders] = useState([]);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    code: initialData?.code || '',
    language: initialData?.language || '',
    tags: initialData?.tags || [],
    subCategory: initialData?.subCategory || '',
    isPublic: initialData?.isPublic || false,
    folderId: initialData?.folderId || folder?.id || '',
  });
  const [tagInput, setTagInput] = useState('');
  const [userTags, setUserTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const { isOpen: isVersionOpen, onOpen: onVersionOpen, onClose: onVersionClose } = useDisclosure();
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [diffView, setDiffView] = useState(null);

  useEffect(() => {
    // Fetch user's existing tags
    const fetchUserTags = async () => {
      try {
        const tagsRef = collection(db, 'tags');
        const q = query(tagsRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const tags = querySnapshot.docs.map(doc => doc.data().name);
        setUserTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    if (currentUser) {
      fetchUserTags();
    }
  }, [currentUser]);

  useEffect(() => {
    // Update suggested tags based on selected language
    if (formData.language) {
      const languageTags = COMMON_TAGS[formData.language] || [];
      const defaultTags = DEFAULT_TAGS;
      const combined = [...new Set([...languageTags, ...defaultTags])];
      setSuggestedTags(combined);
    }
  }, [formData.language]);

  useEffect(() => {
    if (initialData?.id) {
      fetchVersions();
    }
  }, [initialData]);

  useEffect(() => {
    // Fetch user's folders
    const fetchFolders = async () => {
      if (!currentUser) return;
      try {
        const foldersRef = collection(db, 'folders');
        const q = query(foldersRef, where('userId', '==', currentUser.uid));
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

    fetchFolders();
  }, [currentUser]);

  const fetchVersions = async () => {
    try {
      const versionsRef = collection(db, `snippets/${initialData.id}/versions`);
      const q = query(versionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const versionList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVersions(versionList);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'Please log in to save snippets',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!formData.title || !formData.code || !formData.language) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const snippetData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        code: formData.code.trim(),
        language: formData.language,
        tags: formData.tags,
        subCategory: formData.subCategory.trim(),
        userId: currentUser.uid,
        folderId: formData.folderId,
        isPublic: formData.isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let docRef;
      if (initialData?.id) {
        // Update existing snippet
        docRef = doc(db, 'snippets', initialData.id);
        
        // Create a new version before updating
        const versionsRef = collection(db, `snippets/${initialData.id}/versions`);
        const currentSnippet = await getDoc(docRef);
        await addDoc(versionsRef, {
          ...currentSnippet.data(),
          createdAt: new Date().toISOString(),
          versionNumber: versions.length + 1,
        });

        await updateDoc(docRef, {
          ...snippetData,
          createdAt: initialData.createdAt, // Keep original creation date
        });

        // Refresh versions list
        await fetchVersions();
      } else {
        // Create new snippet
        const snippetsCollection = collection(db, 'snippets');
        docRef = await addDoc(snippetsCollection, snippetData);

        // Create initial version
        const versionsRef = collection(db, `snippets/${docRef.id}/versions`);
        await addDoc(versionsRef, {
          ...snippetData,
          versionNumber: 1,
        });
      }

      // Save new tags to user's tags collection
      const newTags = formData.tags.filter(tag => !userTags.includes(tag));
      for (const tag of newTags) {
        await addDoc(collection(db, 'tags'), {
          name: tag,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: 'Success',
        description: 'Snippet saved successfully',
        status: 'success',
        duration: 2000,
      });

      if (!initialData) {
        setFormData({
          title: '',
          description: '',
          code: '',
          language: '',
          tags: [],
          subCategory: '',
          isPublic: false,
          folderId: folder?.id || '',
        });
        setTagInput('');
      }

      if (onSubmit) {
        onSubmit(docRef.id);
      }
    } catch (error) {
      console.error('Error saving snippet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not save snippet. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = (tag) => {
    if (!tag.trim() || formData.tags.includes(tag.trim())) return;
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag.trim()]
    }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleVersionSelect = async (version) => {
    setSelectedVersion(version);
    
    // Calculate diff if there's a current version
    if (formData.code) {
      const diff = diffLines(formData.code, version.code);
      setDiffView(diff);
    }
  };

  const handleRestoreVersion = () => {
    if (selectedVersion) {
      setFormData({
        ...formData,
        code: selectedVersion.code,
        title: selectedVersion.title,
        description: selectedVersion.description,
        language: selectedVersion.language,
        tags: selectedVersion.tags,
        subCategory: selectedVersion.subCategory,
      });
      onVersionClose();
      toast({
        title: 'Version Restored',
        description: `Restored to version ${selectedVersion.versionNumber}`,
        status: 'success',
        duration: 2000,
      });
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg={bgColor}
      p={6}
      borderRadius="lg"
      boxShadow="base"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <VStack spacing={6}>
        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a descriptive title"
            bg={inputBg}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add a brief description"
            bg={inputBg}
            rows={3}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Code</FormLabel>
          <Textarea
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="Paste your code here"
            bg={inputBg}
            fontFamily="mono"
            rows={10}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Language</FormLabel>
          <Select
            name="language"
            value={formData.language}
            onChange={handleChange}
            placeholder="Select language"
            bg={inputBg}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Sub-category</FormLabel>
          <Input
            name="subCategory"
            value={formData.subCategory}
            onChange={handleChange}
            placeholder="Enter a sub-category (e.g., 'React Components', 'Utility Functions')"
            bg={inputBg}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Folder</FormLabel>
          <Select
            name="folderId"
            value={formData.folderId}
            onChange={handleChange}
            placeholder="Select folder"
            bg={inputBg}
          >
            <option value="">No folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Tags</FormLabel>
          <HStack spacing={2}>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              placeholder="Type and press Enter to add tags"
              bg={inputBg}
            />
            <Menu>
              <MenuButton as={Button} rightIcon={<FiChevronDown />}>
                Add Tag
              </MenuButton>
              <MenuList maxH="200px" overflowY="auto">
                {suggestedTags.map((tag) => (
                  <MenuItem
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    isDisabled={formData.tags.includes(tag)}
                  >
                    {tag}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </HStack>
          <FormHelperText>
            Press Enter to add custom tags or select from suggested tags
          </FormHelperText>
          <Wrap spacing={2} mt={2}>
            {formData.tags.map((tag, index) => (
              <WrapItem key={index}>
                <Tag
                  size="md"
                  borderRadius="full"
                  variant="solid"
                  colorScheme="blue"
                >
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="is-public" mb="0">
            Make this snippet public
          </FormLabel>
          <Switch
            id="is-public"
            isChecked={formData.isPublic}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              isPublic: e.target.checked
            }))}
          />
        </FormControl>

        {initialData?.id && (
          <Button
            leftIcon={<Icon as={FiClock} />}
            variant="outline"
            onClick={onVersionOpen}
            size="sm"
            alignSelf="flex-start"
          >
            View Version History
          </Button>
        )}

        <HStack width="100%" spacing={4} pt={4}>
          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            width="full"
            isLoading={isSubmitting}
            leftIcon={<Icon as={FiSave} />}
          >
            Save Snippet
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            width="full"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                code: '',
                language: '',
                tags: [],
                subCategory: '',
                isPublic: false,
                folderId: folder?.id || '',
              });
              setTagInput('');
            }}
            leftIcon={<Icon as={FiX} />}
          >
            Clear Form
          </Button>
        </HStack>
      </VStack>

      <Modal isOpen={isVersionOpen} onClose={onVersionClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Version History</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <HStack align="stretch" spacing={4}>
              <Box flex="1">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Version</Th>
                      <Th>Date</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {versions.map((version) => (
                      <Tr
                        key={version.id}
                        cursor="pointer"
                        onClick={() => handleVersionSelect(version)}
                        bg={selectedVersion?.id === version.id ? 'blue.50' : undefined}
                      >
                        <Td>
                          <HStack>
                            <Icon as={FiGitCommit} />
                            <Text>Version {version.versionNumber}</Text>
                          </HStack>
                        </Td>
                        <Td>{new Date(version.createdAt).toLocaleString()}</Td>
                        <Td>
                          <Button
                            size="xs"
                            leftIcon={<Icon as={FiGitBranch} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreVersion();
                            }}
                            isDisabled={!selectedVersion || selectedVersion.id !== version.id}
                          >
                            Restore
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {selectedVersion && (
                <Box flex="2">
                  <VStack align="stretch" spacing={4}>
                    <Heading size="sm">Changes</Heading>
                    <Box
                      p={4}
                      bg="gray.50"
                      borderRadius="md"
                      maxH="500px"
                      overflowY="auto"
                      fontFamily="mono"
                    >
                      {diffView ? (
                        diffView.map((part, index) => (
                          <Box
                            key={index}
                            color={part.added ? 'green.600' : part.removed ? 'red.600' : 'gray.800'}
                            bg={part.added ? 'green.50' : part.removed ? 'red.50' : undefined}
                            p={1}
                          >
                            <Text as="pre" whiteSpace="pre-wrap">
                              {part.value}
                            </Text>
                          </Box>
                        ))
                      ) : (
                        <Text as="pre" whiteSpace="pre-wrap">
                          {selectedVersion.code}
                        </Text>
                      )}
                    </Box>
                  </VStack>
                </Box>
              )}
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SnippetForm;
