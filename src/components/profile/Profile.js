import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  useToast,
  HStack,
  Text,
  useColorModeValue,
  Divider,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { FiCamera, FiSave, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Sidebar from '../dashboard/Sidebar';

const Profile = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    photoURL: currentUser?.photoURL || '',
  });
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const storage = getStorage();
      const storageRef = ref(storage, `profile-images/${currentUser.uid}/${file.name}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setFormData(prev => ({
        ...prev,
        photoURL: downloadURL
      }));

      toast({
        title: 'Image uploaded',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error uploading image',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsLoading(true);
      await updateProfile(currentUser, {
        displayName: formData.displayName,
        photoURL: formData.photoURL,
      });

      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error updating profile',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Sidebar />
      <Box
        ml={{ base: 0, md: 60 }}
        p="8"
        minH="100vh"
        bg={useColorModeValue('gray.50', 'gray.900')}
      >
        <Container maxW="container.md">
          <VStack spacing={8} align="stretch">
            <Box
              bg={bgColor}
              p={8}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              shadow="base"
            >
              <VStack spacing={6}>
                <Heading size="lg">Profile Settings</Heading>
                <Divider />
                
                <Box position="relative">
                  <Avatar
                    size="2xl"
                    src={formData.photoURL}
                    name={formData.displayName}
                  />
                  <IconButton
                    icon={<FiCamera />}
                    isRound
                    size="sm"
                    position="absolute"
                    bottom="0"
                    right="0"
                    colorScheme="blue"
                    onClick={() => document.getElementById('image-upload').click()}
                  />
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                </Box>

                <FormControl>
                  <FormLabel>Display Name</FormLabel>
                  <Input
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Enter your display name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    value={currentUser?.email || ''}
                    isReadOnly
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  />
                </FormControl>

                <HStack width="100%" justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="gray.500">
                      Account Status
                    </Text>
                    <Badge colorScheme="green">Active</Badge>
                  </VStack>
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiSave />}
                    isLoading={isLoading}
                    onClick={handleSubmit}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Profile; 