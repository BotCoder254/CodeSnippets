import React from 'react';
import {
  Box,
  VStack,
  Icon,
  Text,
  Flex,
  Divider,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiCode, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const NavItem = ({ icon, children, to, isActive }) => {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'blue.400' : 'transparent'}
        color={isActive ? 'white' : 'gray.600'}
        _hover={{
          bg: 'blue.400',
          color: 'white',
        }}
      >
        <Icon
          mr="4"
          fontSize="16"
          as={icon}
        />
        {children}
      </Flex>
    </Link>
  );
};

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      bg={bgColor}
      borderRight="1px"
      borderRightColor={borderColor}
      w="64"
      h="100vh"
      pos="fixed"
      left="0"
      top="0"
    >
      <Flex h="20" alignItems="center" justifyContent="center" borderBottomWidth="1px">
        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
          CodeSnippets
        </Text>
      </Flex>

      <VStack spacing={4} align="stretch" mt="6">
        <NavItem icon={FiHome} to="/dashboard" isActive={isActive('/dashboard')}>
          Dashboard
        </NavItem>
        <NavItem icon={FiCode} to="/snippets" isActive={isActive('/snippets')}>
          My Snippets
        </NavItem>
        <NavItem icon={FiSettings} to="/settings" isActive={isActive('/settings')}>
          Settings
        </NavItem>
      </VStack>

      <Box position="absolute" bottom="5" width="100%">
        <Divider mb="4" />
        <Menu>
          <MenuButton>
            <Flex align="center" p="4" mx="4">
              <Avatar size="sm" src={currentUser?.photoURL} name={currentUser?.email} />
              <Box ml="3">
                <Text fontSize="sm">{currentUser?.email}</Text>
              </Box>
            </Flex>
          </MenuButton>
          <MenuList>
            <MenuItem onClick={handleLogout} icon={<FiLogOut />}>
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </Box>
  );
};

export default Sidebar;
