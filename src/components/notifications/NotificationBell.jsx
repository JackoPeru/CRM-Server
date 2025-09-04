import React from 'react';
import {
  Box,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Divider,
  useColorModeValue,
  Tooltip,
  Icon,
  Flex,
  useDisclosure
} from '@chakra-ui/react';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, removeNotification, markAllAsRead, clearAllNotifications } = useNotifications();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bellColor = useColorModeValue('gray.600', 'gray.300');
  const badgeColor = useColorModeValue('red.500', 'red.400');
  const popoverBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: it
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-end">
      <PopoverTrigger>
        <Box position="relative">
          <Tooltip label="Notifiche" placement="bottom">
            <IconButton
              icon={<Icon as={Bell} />}
              variant="ghost"
              color={bellColor}
              size="md"
              aria-label="Notifiche"
              _hover={{ bg: hoverBg }}
            />
          </Tooltip>
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              bg={badgeColor}
              color="white"
              borderRadius="full"
              fontSize="xs"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      
      <PopoverContent
        bg={popoverBg}
        borderColor={borderColor}
        boxShadow="lg"
        w="400px"
        maxH="500px"
      >
        <PopoverHeader>
          <HStack justify="space-between" align="center">
            <Text fontWeight="semibold">Notifiche</Text>
            {notifications.length > 0 && (
              <HStack spacing={2}>
                {unreadCount > 0 && (
                  <Tooltip label="Segna tutte come lette">
                    <IconButton
                      icon={<Icon as={CheckCheck} />}
                      size="sm"
                      variant="ghost"
                      onClick={markAllAsRead}
                      aria-label="Segna tutte come lette"
                    />
                  </Tooltip>
                )}
                <Tooltip label="Cancella tutte">
                  <IconButton
                    icon={<Icon as={Trash2} />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={clearAllNotifications}
                    aria-label="Cancella tutte le notifiche"
                  />
                </Tooltip>
              </HStack>
            )}
          </HStack>
        </PopoverHeader>
        
        <PopoverCloseButton />
        
        <PopoverBody p={0}>
          {notifications.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={8}
              color="gray.500"
            >
              <Icon as={Bell} size={32} mb={2} />
              <Text>Nessuna notifica</Text>
            </Flex>
          ) : (
            <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <Box
                    p={3}
                    cursor="pointer"
                    _hover={{ bg: hoverBg }}
                    onClick={() => handleNotificationClick(notification)}
                    opacity={notification.read ? 0.7 : 1}
                    position="relative"
                  >
                    <HStack justify="space-between" align="flex-start" spacing={3}>
                      <VStack align="flex-start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                          <Text
                            fontWeight={notification.read ? 'normal' : 'semibold'}
                            fontSize="sm"
                            noOfLines={1}
                          >
                            {notification.title}
                          </Text>
                          <Badge
                            size="sm"
                            colorScheme={getPriorityColor(notification.priority)}
                            variant="subtle"
                          >
                            {notification.priority}
                          </Badge>
                        </HStack>
                        
                        <Text
                          fontSize="xs"
                          color="gray.600"
                          noOfLines={2}
                        >
                          {notification.message}
                        </Text>
                        
                        <Text
                          fontSize="xs"
                          color="gray.500"
                        >
                          {formatTime(notification.timestamp)}
                        </Text>
                      </VStack>
                      
                      <Tooltip label="Rimuovi notifica">
                        <IconButton
                          icon={<Icon as={X} />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          aria-label="Rimuovi notifica"
                        />
                      </Tooltip>
                    </HStack>
                    
                    {!notification.read && (
                      <Box
                        position="absolute"
                        left={2}
                        top="50%"
                        transform="translateY(-50%)"
                        w={2}
                        h={2}
                        bg={badgeColor}
                        borderRadius="full"
                      />
                    )}
                  </Box>
                  
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;