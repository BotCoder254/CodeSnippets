import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Icon,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FiFolder,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
} from 'react-icons/fi';

const FolderItem = ({ folder, onSelect, onEdit, onDelete, selectedFolder }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const isSelected = selectedFolder?.id === folder.id;

  return (
    <HStack
      p={2}
      borderRadius="md"
      cursor="pointer"
      bg={isSelected ? hoverBg : bgColor}
      _hover={{ bg: hoverBg }}
      onClick={() => onSelect(folder)}
      justify="space-between"
    >
      <HStack>
        <Icon as={FiFolder} w={4} h={4} color="blue.500" />
        <Text>{folder.name}</Text>
      </HStack>
      
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<FiMoreVertical />}
          variant="ghost"
          size="sm"
          onClick={(e) => e.stopPropagation()}
        />
        <MenuList>
          <MenuItem icon={<FiEdit2 />} onClick={() => onEdit(folder)}>
            Rename
          </MenuItem>
          <MenuItem icon={<FiTrash2 />} onClick={() => onDelete(folder)}>
            Delete
          </MenuItem>
        </MenuList>
      </Menu>
    </HStack>
  );
};

const FolderStructure = ({
  folders,
  selectedFolder,
  onFolderSelect,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    if (editingFolder) {
      onFolderEdit(editingFolder.id, newFolderName);
    } else {
      onFolderCreate(newFolderName);
    }
    
    setNewFolderName('');
    setEditingFolder(null);
    onClose();
  };

  const handleEdit = (folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    onOpen();
  };

  return (
    <Box>
      <Button
        leftIcon={<FiFolder />}
        size="sm"
        mb={4}
        onClick={() => {
          setEditingFolder(null);
          setNewFolderName('');
          onOpen();
        }}
      >
        New Folder
      </Button>

      <VStack align="stretch" spacing={1}>
        {folders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            onSelect={onFolderSelect}
            onEdit={handleEdit}
            onDelete={onFolderDelete}
            selectedFolder={selectedFolder}
          />
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingFolder ? 'Rename Folder' : 'New Folder'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <Button
                mt={4}
                colorScheme="blue"
                type="submit"
                isDisabled={!newFolderName.trim()}
              >
                {editingFolder ? 'Save' : 'Create'}
              </Button>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FolderStructure;
