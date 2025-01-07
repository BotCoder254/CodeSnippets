import React, { useState } from 'react';
import {
  VStack,
  Box,
  Button,
  Input,
  IconButton,
  HStack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const FolderStructure = ({
  folders,
  selectedFolder,
  onFolderSelect,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { currentUser } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const folderData = {
        name: newFolderName.trim(),
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const foldersCollection = collection(db, 'folders');
      const docRef = await addDoc(foldersCollection, folderData);
      
      if (onFolderCreate) {
        onFolderCreate({ id: docRef.id, ...folderData });
      }
      
      setNewFolderName('');
      toast({
        title: 'Success',
        description: 'Folder created successfully',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not create folder. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFolder = async (folder, newName) => {
    if (!newName.trim() || !currentUser) return;

    try {
      await onFolderEdit(folder.id, newName.trim());
      setEditingFolder(null);
      toast({
        title: 'Success',
        description: 'Folder renamed successfully',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error editing folder:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not rename folder. Please try again.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!currentUser) return;

    try {
      await onFolderDelete(folder);
      toast({
        title: 'Success',
        description: 'Folder deleted successfully',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not delete folder. Please try again.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <HStack spacing={2}>
          <Input
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
          <Button
            leftIcon={<FiPlus />}
            onClick={handleCreateFolder}
            isLoading={isSubmitting}
            colorScheme="blue"
          >
            Create
          </Button>
        </HStack>
      </Box>

      <VStack spacing={2} align="stretch">
        {folders.map((folder) => (
          <Box
            key={folder.id}
            p={3}
            bg={selectedFolder?.id === folder.id ? hoverBg : bgColor}
            borderWidth="1px"
            borderRadius="md"
            borderColor={borderColor}
            cursor="pointer"
            onClick={() => onFolderSelect(folder)}
            _hover={{ bg: hoverBg }}
          >
            <HStack justify="space-between">
              {editingFolder?.id === folder.id ? (
                <Input
                  defaultValue={folder.name}
                  onBlur={(e) => handleEditFolder(folder, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleEditFolder(folder, e.target.value);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <HStack spacing={2}>
                  <FiFolder />
                  <Text>{folder.name}</Text>
                </HStack>
              )}
              <HStack spacing={2}>
                <IconButton
                  icon={<FiEdit2 />}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                  }}
                />
                <IconButton
                  icon={<FiTrash2 />}
                  variant="ghost"
                  size="sm"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder);
                  }}
                />
              </HStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
};

export default FolderStructure;
