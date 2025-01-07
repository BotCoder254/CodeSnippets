import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { FiSave, FiX } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

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

const SnippetForm = ({ folder, onSubmit }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

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
        userId: currentUser.uid,
        folderId: folder?.id || null,
        timestamp: serverTimestamp()
      };

      const snippetsCollection = collection(db, 'snippets');
      const docRef = await addDoc(snippetsCollection, snippetData);

      toast({
        title: 'Success',
        description: 'Snippet saved successfully',
        status: 'success',
        duration: 2000,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        code: '',
        language: '',
        tags: [],
      });
      setTagInput('');

      if (onSubmit) {
        onSubmit(docRef.id);
      }
    } catch (error) {
      console.error('Error saving snippet:', error);
      toast({
        title: 'Error',
        description: 'Could not save snippet. Please try again.',
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

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
          <FormLabel>Tags</FormLabel>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleAddTag}
            placeholder="Type and press Enter to add tags"
            bg={inputBg}
          />
          <FormHelperText>
            Press Enter to add multiple tags
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
              });
              setTagInput('');
            }}
            leftIcon={<Icon as={FiX} />}
          >
            Clear Form
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default SnippetForm;
