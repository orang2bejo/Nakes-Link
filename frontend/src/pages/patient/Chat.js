import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemAvatar,
  Avatar,
  Badge,
  Chip,
  Paper,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
  Snackbar,
  Fab,
  AppBar,
  Toolbar,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  Search,
  MoreVert,
  Phone,
  VideoCall,
  Info,
  Block,
  Report,
  Star,
  StarBorder,
  Image,
  Description,
  LocationOn,
  Schedule,
  CheckCircle,
  Circle,
  ArrowBack,
  Add,
  FilterList,
  Notifications,
  NotificationsOff,
  VolumeUp,
  VolumeOff,
  Close,
  PhotoCamera,
  Mic,
  Stop,
  PlayArrow,
  Delete,
  Reply,
  Forward,
  Download,
  Visibility,
  VisibilityOff,
  Emergency,
  LocalHospital,
  Psychology,
  FavoriteRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const Chat = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [chatInfoDialog, setChatInfoDialog] = useState(false);
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [previewDialog, setPreviewDialog] = useState(false);

  useEffect(() => {
    fetchChats();
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (selectedChat) {
        // Simulate typing indicator
        if (Math.random() > 0.95) {
          setTyping(true);
          setTimeout(() => setTyping(false), 3000);
        }
        // Simulate new messages
        if (Math.random() > 0.98) {
          receiveMessage();
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockChats = [
        {
          id: 'chat1',
          participant: {
            id: 'dr1',
            name: 'Dr. Sarah Wijaya',
            avatar: '/api/placeholder/40/40',
            specialty: 'Dokter Umum',
            isOnline: true,
            lastSeen: new Date(),
          },
          lastMessage: {
            text: 'Baik, jangan lupa minum obat sesuai resep ya',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            sender: 'dr1',
          },
          unreadCount: 0,
          isPinned: true,
          isMuted: false,
          type: 'consultation',
        },
        {
          id: 'chat2',
          participant: {
            id: 'dr2',
            name: 'Dr. Ahmad Rizki',
            avatar: '/api/placeholder/40/40',
            specialty: 'Dokter Jantung',
            isOnline: false,
            lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          lastMessage: {
            text: 'Hasil lab sudah keluar, semuanya normal',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            sender: 'dr2',
          },
          unreadCount: 2,
          isPinned: false,
          isMuted: false,
          type: 'consultation',
        },
        {
          id: 'chat3',
          participant: {
            id: 'nurse1',
            name: 'Ns. Maya Sari',
            avatar: '/api/placeholder/40/40',
            specialty: 'Perawat',
            isOnline: true,
            lastSeen: new Date(),
          },
          lastMessage: {
            text: 'Jadwal kontrol minggu depan sudah dikonfirmasi',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            sender: 'nurse1',
          },
          unreadCount: 0,
          isPinned: false,
          isMuted: true,
          type: 'appointment',
        },
        {
          id: 'emergency',
          participant: {
            id: 'emergency',
            name: 'Layanan Darurat',
            avatar: '/api/placeholder/40/40',
            specialty: 'Emergency',
            isOnline: true,
            lastSeen: new Date(),
          },
          lastMessage: {
            text: 'Layanan darurat 24/7 tersedia',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            sender: 'emergency',
          },
          unreadCount: 0,
          isPinned: true,
          isMuted: false,
          type: 'emergency',
        },
      ];
      
      setChats(mockChats);
      setOnlineUsers(new Set(['dr1', 'nurse1', 'emergency']));
      
      // Auto-select first chat on desktop
      if (!isMobile && mockChats.length > 0) {
        setSelectedChat(mockChats[0]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat daftar chat',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockMessages = {
        chat1: [
          {
            id: 'msg1',
            text: 'Selamat pagi Dok, saya ingin konsultasi tentang keluhan saya',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            sender: 'patient',
            type: 'text',
            status: 'read',
          },
          {
            id: 'msg2',
            text: 'Selamat pagi! Silakan ceritakan keluhan yang Anda rasakan',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 2 * 60 * 1000),
            sender: 'dr1',
            type: 'text',
            status: 'read',
          },
          {
            id: 'msg3',
            text: 'Saya merasa pusing dan mual sejak kemarin',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
            sender: 'patient',
            type: 'text',
            status: 'read',
          },
          {
            id: 'msg4',
            text: 'Apakah ada demam? Dan sudah berapa lama keluhan ini berlangsung?',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 7 * 60 * 1000),
            sender: 'dr1',
            type: 'text',
            status: 'read',
          },
          {
            id: 'msg5',
            text: 'Tidak ada demam Dok, sudah 2 hari ini',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000),
            sender: 'patient',
            type: 'text',
            status: 'read',
          },
          {
            id: 'msg6',
            text: 'Baik, saya akan berikan resep obat untuk mengatasi keluhan Anda',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            sender: 'dr1',
            type: 'text',
            status: 'read',
          },
          {
            id: 'msg7',
            text: 'Baik, jangan lupa minum obat sesuai resep ya',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            sender: 'dr1',
            type: 'text',
            status: 'read',
          },
        ],
        chat2: [
          {
            id: 'msg8',
            text: 'Dok, hasil lab sudah keluar belum?',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
            sender: 'patient',
            type: 'text',
            status: 'read',
          },
          {
            id: 'msg9',
            text: 'Hasil lab sudah keluar, semuanya normal',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            sender: 'dr2',
            type: 'text',
            status: 'delivered',
          },
          {
            id: 'msg10',
            text: 'Alhamdulillah, terima kasih Dok',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
            sender: 'patient',
            type: 'text',
            status: 'sent',
          },
        ],
      };
      
      setMessages(mockMessages[chatId] || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat pesan',
        severity: 'error',
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      id: `msg${Date.now()}`,
      text: newMessage,
      timestamp: new Date(),
      sender: 'patient',
      type: 'text',
      status: 'sending',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ));
      
      // Update last message in chat list
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: { text: newMessage, timestamp: new Date(), sender: 'patient' } }
          : chat
      ));
      
      // Simulate delivery and read status updates
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'delivered' } : msg
        ));
      }, 2000);
      
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'read' } : msg
        ));
      }, 5000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'failed' } : msg
      ));
      setSnackbar({
        open: true,
        message: 'Gagal mengirim pesan',
        severity: 'error',
      });
    }
  };

  const receiveMessage = () => {
    if (!selectedChat) return;
    
    const responses = [
      'Terima kasih atas informasinya',
      'Baik, saya akan cek kondisi Anda',
      'Jangan lupa istirahat yang cukup',
      'Silakan hubungi saya jika ada keluhan lain',
      'Semoga lekas sembuh',
    ];
    
    const newMsg = {
      id: `msg${Date.now()}`,
      text: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      sender: selectedChat.participant.id,
      type: 'text',
      status: 'read',
    };
    
    setMessages(prev => [...prev, newMsg]);
    
    // Update last message in chat list
    setChats(prev => prev.map(chat => 
      chat.id === selectedChat.id 
        ? { ...chat, lastMessage: { text: newMsg.text, timestamp: newMsg.timestamp, sender: newMsg.sender } }
        : chat
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm');
    } else if (isYesterday(timestamp)) {
      return `Kemarin ${format(timestamp, 'HH:mm')}`;
    } else {
      return format(timestamp, 'dd/MM HH:mm');
    }
  };

  const formatChatTime = (timestamp) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm');
    } else if (isYesterday(timestamp)) {
      return 'Kemarin';
    } else {
      return format(timestamp, 'dd/MM/yy');
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sending': return <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />;
      case 'sent': return <CheckCircle sx={{ fontSize: 14, color: 'text.secondary' }} />;
      case 'delivered': return <CheckCircle sx={{ fontSize: 14, color: 'primary.main' }} />;
      case 'read': return <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />;
      case 'failed': return <Circle sx={{ fontSize: 14, color: 'error.main' }} />;
      default: return null;
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setPreviewDialog(true);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle other file types
      const message = {
        id: `msg${Date.now()}`,
        text: `📎 ${file.name}`,
        timestamp: new Date(),
        sender: 'patient',
        type: 'file',
        status: 'sending',
        fileData: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      };
      
      setMessages(prev => [...prev, message]);
    }
  };

  const sendImageMessage = () => {
    if (!imagePreview) return;
    
    const message = {
      id: `msg${Date.now()}`,
      text: '📷 Gambar',
      timestamp: new Date(),
      sender: 'patient',
      type: 'image',
      status: 'sending',
      imageData: imagePreview,
    };
    
    setMessages(prev => [...prev, message]);
    setImagePreview(null);
    setPreviewDialog(false);
  };

  const filteredChats = chats.filter(chat => 
    chat.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participant.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ChatList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Cari chat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>
      
      {/* Chat List */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {filteredChats.map((chat, index) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ListItem
              button
              selected={selectedChat?.id === chat.id}
              onClick={() => {
                setSelectedChat(chat);
                if (isMobile) setDrawerOpen(false);
              }}
              sx={{
                borderLeft: selectedChat?.id === chat.id ? 3 : 0,
                borderColor: 'primary.main',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={onlineUsers.has(chat.participant.id) ? 'success' : 'default'}
                >
                  <Avatar
                    src={chat.participant.avatar}
                    sx={{
                      bgcolor: chat.type === 'emergency' ? 'error.main' : 'primary.main',
                    }}
                  >
                    {chat.type === 'emergency' ? <Emergency /> : 
                     chat.participant.name.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {chat.participant.name}
                    </Typography>
                    {chat.isPinned && <Star sx={{ fontSize: 16, color: 'warning.main' }} />}
                    {chat.isMuted && <VolumeOff sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {chat.lastMessage.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {chat.participant.specialty}
                    </Typography>
                  </Box>
                }
              />
              
              <ListItemSecondaryAction>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatChatTime(chat.lastMessage.timestamp)}
                  </Typography>
                  {chat.unreadCount > 0 && (
                    <Badge
                      badgeContent={chat.unreadCount}
                      color="primary"
                      sx={{ mt: 0.5, display: 'block' }}
                    />
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </motion.div>
        ))}
      </List>
      
      {/* New Chat Button */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => setNewChatDialog(true)}
        >
          Chat Baru
        </Button>
      </Box>
    </Box>
  );

  const MessageBubble = ({ message, isOwn }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: 1,
        }}
      >
        <Paper
          sx={{
            p: 1.5,
            maxWidth: '70%',
            bgcolor: isOwn ? 'primary.main' : 'grey.100',
            color: isOwn ? 'white' : 'text.primary',
            borderRadius: 2,
            borderTopRightRadius: isOwn ? 0.5 : 2,
            borderTopLeftRadius: isOwn ? 2 : 0.5,
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setSelectedMessage(message);
            setContextMenu({ mouseX: e.clientX, mouseY: e.clientY });
          }}
        >
          {message.type === 'image' && message.imageData && (
            <Box sx={{ mb: 1 }}>
              <img
                src={message.imageData}
                alt="Shared image"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setImagePreview(message.imageData);
                  setPreviewDialog(true);
                }}
              />
            </Box>
          )}
          
          <Typography variant="body2">
            {message.text}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {formatMessageTime(message.timestamp)}
            </Typography>
            {isOwn && (
              <Box sx={{ ml: 1 }}>
                {getMessageStatusIcon(message.status)}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </motion.div>
  );

  const ChatArea = () => {
    if (!selectedChat) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Pilih chat untuk memulai percakapan
          </Typography>
          <Typography variant="body2">
            Konsultasi dengan tenaga kesehatan profesional
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <ArrowBack />
              </IconButton>
            )}
            
            <Avatar
              src={selectedChat.participant.avatar}
              sx={{
                mr: 2,
                bgcolor: selectedChat.type === 'emergency' ? 'error.main' : 'primary.main',
              }}
            >
              {selectedChat.type === 'emergency' ? <Emergency /> : 
               selectedChat.participant.name.charAt(0)}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedChat.participant.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {onlineUsers.has(selectedChat.participant.id) ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Circle sx={{ fontSize: 8, color: 'success.main' }} />
                    Online
                  </Box>
                ) : (
                  `Terakhir dilihat ${formatDistanceToNow(selectedChat.participant.lastSeen, { locale: id })} yang lalu`
                )}
              </Typography>
            </Box>
            
            <IconButton onClick={() => setChatInfoDialog(true)}>
              <Info />
            </IconButton>
            
            <IconButton>
              <Phone />
            </IconButton>
            
            <IconButton>
              <VideoCall />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            background: 'linear-gradient(to bottom, #f5f5f5, #ffffff)',
          }}
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender === 'patient'}
            />
          ))}
          
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                <Avatar size="small" src={selectedChat.participant.avatar}>
                  {selectedChat.participant.name.charAt(0)}
                </Avatar>
                <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                  <Typography variant="body2" color="text.secondary">
                    sedang mengetik...
                  </Typography>
                </Paper>
              </Box>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Message Input */}
        <Paper sx={{ p: 2, borderRadius: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              size="small"
            >
              <AttachFile />
            </IconButton>
            
            <IconButton
              onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
              size="small"
            >
              <EmojiEmotions />
            </IconButton>
            
            <TextField
              fullWidth
              placeholder="Ketik pesan..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              multiline
              maxRows={4}
              size="small"
            />
            
            <IconButton
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              color="primary"
            >
              <Send />
            </IconButton>
          </Box>
        </Paper>
        
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,application/pdf,.doc,.docx"
          onChange={handleFileUpload}
        />
      </Box>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat chat..." />;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Chat List Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 350,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 350,
            position: 'relative',
            height: '100%',
          },
        }}
      >
        <ChatList />
      </Drawer>
      
      {/* Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatArea />
      </Box>
      
      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => setContextMenu(null)}>
          <ListItemIcon><Reply /></ListItemIcon>
          <ListItemText>Balas</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setContextMenu(null)}>
          <ListItemIcon><Forward /></ListItemIcon>
          <ListItemText>Teruskan</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setContextMenu(null)}>
          <ListItemIcon><Star /></ListItemIcon>
          <ListItemText>Tandai</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setContextMenu(null)}>
          <ListItemIcon><Delete /></ListItemIcon>
          <ListItemText>Hapus</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Chat Info Dialog */}
      <Dialog open={chatInfoDialog} onClose={() => setChatInfoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Info Chat</DialogTitle>
        <DialogContent>
          {selectedChat && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  src={selectedChat.participant.avatar}
                  sx={{ width: 64, height: 64 }}
                >
                  {selectedChat.participant.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedChat.participant.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedChat.participant.specialty}
                  </Typography>
                  <Chip
                    size="small"
                    label={onlineUsers.has(selectedChat.participant.id) ? 'Online' : 'Offline'}
                    color={onlineUsers.has(selectedChat.participant.id) ? 'success' : 'default'}
                  />
                </Box>
              </Box>
              
              <List>
                <ListItem>
                  <ListItemIcon><Notifications /></ListItemIcon>
                  <ListItemText primary="Notifikasi" />
                  <ListItemSecondaryAction>
                    <IconButton>
                      {selectedChat.isMuted ? <NotificationsOff /> : <Notifications />}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon><Star /></ListItemIcon>
                  <ListItemText primary="Pin Chat" />
                  <ListItemSecondaryAction>
                    <IconButton>
                      {selectedChat.isPinned ? <Star color="warning" /> : <StarBorder />}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem button>
                  <ListItemIcon><Block /></ListItemIcon>
                  <ListItemText primary="Blokir" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon><Report /></ListItemIcon>
                  <ListItemText primary="Laporkan" />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatInfoDialog(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>
      
      {/* Image Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={sendImageMessage}>
            Kirim
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Emergency FAB */}
      <Fab
        color="error"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        }}
        onClick={() => {
          const emergencyChat = chats.find(chat => chat.type === 'emergency');
          if (emergencyChat) {
            setSelectedChat(emergencyChat);
            if (isMobile) setDrawerOpen(false);
          }
        }}
      >
        <Emergency />
      </Fab>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat;