import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  Tooltip,
  Avatar,
  Badge,
  LinearProgress,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Assignment,
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Flag,
  Person,
  CalendarToday,
  Notifications,
  Star,
  StarBorder,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
  AccessTime,
  TrendingUp,
  Assignment as TaskIcon,
  EventNote,
  MedicalServices,
  LocalHospital,
  Psychology,
  Healing,
  MonitorHeart,
  Vaccines,
  ChildCare,
  Elderly
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const TodoManager = () => {
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [todoDialog, setTodoDialog] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [showCompleted, setShowCompleted] = useState(true);

  // Form states
  const [todoForm, setTodoForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    assignedTo: '',
    tags: [],
    isRecurring: false,
    recurringType: 'daily',
    estimatedDuration: 30,
    reminderMinutes: 15
  });

  // Mock data
  const mockCategories = [
    { id: 'consultation', name: 'Konsultasi', icon: <Psychology />, color: '#4CAF50' },
    { id: 'appointment', name: 'Janji Temu', icon: <CalendarToday />, color: '#2196F3' },
    { id: 'checkup', name: 'Pemeriksaan', icon: <MonitorHeart />, color: '#FF9800' },
    { id: 'therapy', name: 'Terapi', icon: <Healing />, color: '#9C27B0' },
    { id: 'vaccination', name: 'Vaksinasi', icon: <Vaccines />, color: '#F44336' },
    { id: 'pediatric', name: 'Anak', icon: <ChildCare />, color: '#E91E63' },
    { id: 'geriatric', name: 'Lansia', icon: <Elderly />, color: '#795548' },
    { id: 'emergency', name: 'Darurat', icon: <MedicalServices />, color: '#FF5722' },
    { id: 'administrative', name: 'Administrasi', icon: <EventNote />, color: '#607D8B' },
    { id: 'general', name: 'Umum', icon: <LocalHospital />, color: '#3F51B5' }
  ];

  const mockTodos = [
    {
      id: 1,
      title: 'Konsultasi dengan Pasien A',
      description: 'Konsultasi rutin untuk follow-up pengobatan hipertensi',
      category: 'consultation',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-01-20T10:00:00',
      assignedTo: 'Dr. Sarah Wijaya',
      tags: ['follow-up', 'hipertensi'],
      isStarred: true,
      isRecurring: false,
      estimatedDuration: 30,
      actualDuration: null,
      reminderMinutes: 15,
      createdAt: '2024-01-15T09:00:00',
      completedAt: null,
      notes: ''
    },
    {
      id: 2,
      title: 'Persiapan Medical Check-up Korporat',
      description: 'Menyiapkan protokol dan peralatan untuk medical check-up karyawan PT. ABC',
      category: 'checkup',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2024-01-21T08:00:00',
      assignedTo: 'Tim Medis',
      tags: ['korporat', 'persiapan'],
      isStarred: false,
      isRecurring: false,
      estimatedDuration: 120,
      actualDuration: 45,
      reminderMinutes: 30,
      createdAt: '2024-01-14T14:30:00',
      completedAt: null,
      notes: 'Sudah koordinasi dengan HR PT. ABC'
    },
    {
      id: 3,
      title: 'Update Jadwal Praktek Mingguan',
      description: 'Memperbarui jadwal praktek untuk minggu depan',
      category: 'administrative',
      priority: 'low',
      status: 'completed',
      dueDate: '2024-01-19T17:00:00',
      assignedTo: 'Admin',
      tags: ['jadwal', 'rutin'],
      isStarred: false,
      isRecurring: true,
      recurringType: 'weekly',
      estimatedDuration: 15,
      actualDuration: 12,
      reminderMinutes: 60,
      createdAt: '2024-01-12T10:00:00',
      completedAt: '2024-01-19T16:45:00',
      notes: 'Jadwal sudah diupdate dan dikomunikasikan'
    },
    {
      id: 4,
      title: 'Terapi Fisik Pasien B',
      description: 'Sesi terapi fisik untuk rehabilitasi pasca operasi',
      category: 'therapy',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-01-20T14:00:00',
      assignedTo: 'Fisioterapis',
      tags: ['rehabilitasi', 'pasca-operasi'],
      isStarred: true,
      isRecurring: false,
      estimatedDuration: 60,
      actualDuration: null,
      reminderMinutes: 30,
      createdAt: '2024-01-16T11:20:00',
      completedAt: null,
      notes: ''
    },
    {
      id: 5,
      title: 'Vaksinasi Anak Balita',
      description: 'Program vaksinasi rutin untuk anak usia 2-5 tahun',
      category: 'vaccination',
      priority: 'medium',
      status: 'pending',
      dueDate: '2024-01-22T09:00:00',
      assignedTo: 'Perawat Anak',
      tags: ['balita', 'rutin'],
      isStarred: false,
      isRecurring: true,
      recurringType: 'monthly',
      estimatedDuration: 45,
      actualDuration: null,
      reminderMinutes: 60,
      createdAt: '2024-01-10T08:15:00',
      completedAt: null,
      notes: ''
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCategories(mockCategories);
      setTodos(mockTodos);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async () => {
    try {
      const newTodo = {
        id: Date.now(),
        ...todoForm,
        dueDate: todoForm.dueDate && todoForm.dueTime ? 
          `${todoForm.dueDate}T${todoForm.dueTime}:00` : 
          todoForm.dueDate ? `${todoForm.dueDate}T23:59:59` : null,
        status: 'pending',
        isStarred: false,
        actualDuration: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        notes: ''
      };
      
      setTodos(prev => [newTodo, ...prev]);
      setTodoDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleUpdateTodo = async () => {
    try {
      const updatedTodo = {
        ...editingTodo,
        ...todoForm,
        dueDate: todoForm.dueDate && todoForm.dueTime ? 
          `${todoForm.dueDate}T${todoForm.dueTime}:00` : 
          todoForm.dueDate ? `${todoForm.dueDate}T23:59:59` : null
      };
      
      setTodos(prev => prev.map(todo => 
        todo.id === editingTodo.id ? updatedTodo : todo
      ));
      setTodoDialog(false);
      setEditingTodo(null);
      resetForm();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
      setAnchorEl(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleToggleComplete = async (todoId) => {
    try {
      setTodos(prev => prev.map(todo => {
        if (todo.id === todoId) {
          const isCompleting = todo.status !== 'completed';
          return {
            ...todo,
            status: isCompleting ? 'completed' : 'pending',
            completedAt: isCompleting ? new Date().toISOString() : null
          };
        }
        return todo;
      }));
    } catch (error) {
      console.error('Error toggling todo status:', error);
    }
  };

  const handleToggleStar = async (todoId) => {
    try {
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, isStarred: !todo.isStarred } : todo
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleStartTask = async (todoId) => {
    try {
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, status: 'in_progress' } : todo
      ));
      setAnchorEl(null);
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const resetForm = () => {
    setTodoForm({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      assignedTo: '',
      tags: [],
      isRecurring: false,
      recurringType: 'daily',
      estimatedDuration: 30,
      reminderMinutes: 15
    });
  };

  const openEditDialog = (todo) => {
    setEditingTodo(todo);
    const dueDateTime = todo.dueDate ? new Date(todo.dueDate) : null;
    setTodoForm({
      title: todo.title,
      description: todo.description,
      category: todo.category,
      priority: todo.priority,
      dueDate: dueDateTime ? format(dueDateTime, 'yyyy-MM-dd') : '',
      dueTime: dueDateTime ? format(dueDateTime, 'HH:mm') : '',
      assignedTo: todo.assignedTo,
      tags: todo.tags || [],
      isRecurring: todo.isRecurring || false,
      recurringType: todo.recurringType || 'daily',
      estimatedDuration: todo.estimatedDuration || 30,
      reminderMinutes: todo.reminderMinutes || 15
    });
    setTodoDialog(true);
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || { name: 'Unknown', icon: <TaskIcon />, color: '#666' };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#2196f3';
      case 'pending': return '#ff9800';
      default: return '#666';
    }
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || todo.category === filterCategory;
    const matchesCompleted = showCompleted || todo.status !== 'completed';
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesCompleted;
  });

  const getStats = () => {
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.status === 'completed').length;
    const pendingTodos = todos.filter(todo => todo.status === 'pending').length;
    const inProgressTodos = todos.filter(todo => todo.status === 'in_progress').length;
    const overdueTodos = todos.filter(todo => 
      todo.status !== 'completed' && todo.dueDate && isPast(new Date(todo.dueDate))
    ).length;
    const todayTodos = todos.filter(todo => 
      todo.dueDate && isToday(new Date(todo.dueDate))
    ).length;
    
    return { totalTodos, completedTodos, pendingTodos, inProgressTodos, overdueTodos, todayTodos };
  };

  const getTodosByTimeframe = (timeframe) => {
    return todos.filter(todo => {
      if (!todo.dueDate) return false;
      const dueDate = new Date(todo.dueDate);
      
      switch (timeframe) {
        case 'today':
          return isToday(dueDate);
        case 'tomorrow':
          return isTomorrow(dueDate);
        case 'thisWeek':
          return isThisWeek(dueDate);
        case 'overdue':
          return isPast(dueDate) && todo.status !== 'completed';
        default:
          return false;
      }
    });
  };

  const stats = getStats();

  if (loading) {
    return <LoadingSpinner message="Memuat data tugas..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <Assignment sx={{ mr: 2, verticalAlign: 'middle' }} />
          Manajemen Tugas
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={2}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalTodos}
                  </Typography>
                  <Typography variant="body2">Total Tugas</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.todayTodos}
                  </Typography>
                  <Typography variant="body2">Hari Ini</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.inProgressTodos}
                  </Typography>
                  <Typography variant="body2">Sedang Berjalan</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.pendingTodos}
                  </Typography>
                  <Typography variant="body2">Menunggu</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Card sx={{ background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.completedTodos}
                  </Typography>
                  <Typography variant="body2">Selesai</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Card sx={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.overdueTodos}
                  </Typography>
                  <Typography variant="body2">Terlambat</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Progress Keseluruhan</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.completedTodos} dari {stats.totalTodos} tugas selesai
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.totalTodos > 0 ? (stats.completedTodos / stats.totalTodos) * 100 : 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>

        {/* Action Bar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setTodoDialog(true)}
          >
            Tambah Tugas
          </Button>
          
          <TextField
            placeholder="Cari tugas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">Semua Status</MenuItem>
              <MenuItem value="pending">Menunggu</MenuItem>
              <MenuItem value="in_progress">Sedang Berjalan</MenuItem>
              <MenuItem value="completed">Selesai</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Prioritas</InputLabel>
            <Select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              label="Prioritas"
            >
              <MenuItem value="all">Semua Prioritas</MenuItem>
              <MenuItem value="high">Tinggi</MenuItem>
              <MenuItem value="medium">Sedang</MenuItem>
              <MenuItem value="low">Rendah</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Kategori"
            >
              <MenuItem value="all">Semua Kategori</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {category.icon}
                    {category.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
            }
            label="Tampilkan Selesai"
          />
        </Box>

        {/* Main Content */}
        <Card>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Semua Tugas" />
            <Tab label="Hari Ini" />
            <Tab label="Minggu Ini" />
            <Tab label="Terlambat" />
            <Tab label="Kategori" />
          </Tabs>
          
          {/* All Tasks Tab */}
          {tabValue === 0 && (
            <CardContent>
              <AnimatePresence>
                {filteredTodos.map((todo) => {
                  const categoryInfo = getCategoryInfo(todo.category);
                  const isOverdue = todo.dueDate && isPast(new Date(todo.dueDate)) && todo.status !== 'completed';
                  
                  return (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          mb: 2,
                          opacity: todo.status === 'completed' ? 0.7 : 1,
                          borderLeft: `4px solid ${getPriorityColor(todo.priority)}`,
                          '&:hover': { boxShadow: 2 }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Checkbox
                              checked={todo.status === 'completed'}
                              onChange={() => handleToggleComplete(todo.id)}
                              icon={<RadioButtonUnchecked />}
                              checkedIcon={<CheckCircle />}
                              sx={{ mt: -1 }}
                            />
                            
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 'bold',
                                    textDecoration: todo.status === 'completed' ? 'line-through' : 'none'
                                  }}
                                >
                                  {todo.title}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Chip 
                                    label={categoryInfo.name} 
                                    size="small" 
                                    sx={{ bgcolor: categoryInfo.color, color: 'white' }}
                                    icon={categoryInfo.icon}
                                  />
                                  <Chip 
                                    label={todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} 
                                    size="small" 
                                    sx={{ bgcolor: getPriorityColor(todo.priority), color: 'white' }}
                                  />
                                  <Chip 
                                    label={todo.status === 'in_progress' ? 'Sedang Berjalan' : 
                                           todo.status === 'completed' ? 'Selesai' : 'Menunggu'} 
                                    size="small" 
                                    sx={{ bgcolor: getStatusColor(todo.status), color: 'white' }}
                                  />
                                  {todo.isRecurring && (
                                    <Chip label="Berulang" size="small" color="info" />
                                  )}
                                  {isOverdue && (
                                    <Chip label="Terlambat" size="small" color="error" />
                                  )}
                                </Box>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {todo.description}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                                {todo.dueDate && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Schedule fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {format(new Date(todo.dueDate), 'dd MMM yyyy HH:mm', { locale: id })}
                                    </Typography>
                                  </Box>
                                )}
                                
                                {todo.assignedTo && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Person fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {todo.assignedTo}
                                    </Typography>
                                  </Box>
                                )}
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AccessTime fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {todo.estimatedDuration} menit
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {todo.tags && todo.tags.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {todo.tags.map((tag, index) => (
                                    <Chip key={index} label={tag} size="small" variant="outlined" />
                                  ))}
                                </Box>
                              )}
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton 
                                onClick={() => handleToggleStar(todo.id)}
                                color={todo.isStarred ? 'warning' : 'default'}
                              >
                                {todo.isStarred ? <Star /> : <StarBorder />}
                              </IconButton>
                              
                              {todo.status === 'pending' && (
                                <Tooltip title="Mulai Tugas">
                                  <IconButton 
                                    onClick={() => handleStartTask(todo.id)}
                                    color="primary"
                                  >
                                    <PlayArrow />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <IconButton 
                                onClick={(e) => {
                                  setAnchorEl(e.currentTarget);
                                  setSelectedTodo(todo);
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {filteredTodos.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    Tidak ada tugas yang ditemukan
                  </Typography>
                </Box>
              )}
            </CardContent>
          )}
          
          {/* Today Tab */}
          {tabValue === 1 && (
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tugas Hari Ini ({getTodosByTimeframe('today').length})
              </Typography>
              {/* Similar structure as All Tasks but filtered for today */}
            </CardContent>
          )}
          
          {/* This Week Tab */}
          {tabValue === 2 && (
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tugas Minggu Ini ({getTodosByTimeframe('thisWeek').length})
              </Typography>
              {/* Similar structure as All Tasks but filtered for this week */}
            </CardContent>
          )}
          
          {/* Overdue Tab */}
          {tabValue === 3 && (
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Tugas Terlambat ({getTodosByTimeframe('overdue').length})
              </Typography>
              {/* Similar structure as All Tasks but filtered for overdue */}
            </CardContent>
          )}
          
          {/* Categories Tab */}
          {tabValue === 4 && (
            <CardContent>
              <Grid container spacing={3}>
                {categories.map((category) => {
                  const categoryTodos = todos.filter(todo => todo.category === category.id);
                  const completedCount = categoryTodos.filter(todo => todo.status === 'completed').length;
                  
                  return (
                    <Grid item xs={12} md={6} lg={4} key={category.id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: category.color }}>
                              {category.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {category.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {categoryTodos.length} tugas
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Progress
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {completedCount}/{categoryTodos.length}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={categoryTodos.length > 0 ? (completedCount / categoryTodos.length) * 100 : 0}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                          
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            onClick={() => setFilterCategory(category.id)}
                          >
                            Lihat Tugas
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Create/Edit Todo Dialog */}
      <Dialog open={todoDialog} onClose={() => setTodoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTodo ? 'Edit Tugas' : 'Tambah Tugas Baru'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Judul Tugas"
                  value={todoForm.title}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Deskripsi"
                  value={todoForm.description}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={todoForm.category}
                    onChange={(e) => setTodoForm(prev => ({ ...prev, category: e.target.value }))}
                    label="Kategori"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {category.icon}
                          {category.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioritas</InputLabel>
                  <Select
                    value={todoForm.priority}
                    onChange={(e) => setTodoForm(prev => ({ ...prev, priority: e.target.value }))}
                    label="Prioritas"
                  >
                    <MenuItem value="low">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Flag sx={{ color: '#4caf50' }} />
                        Rendah
                      </Box>
                    </MenuItem>
                    <MenuItem value="medium">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Flag sx={{ color: '#ff9800' }} />
                        Sedang
                      </Box>
                    </MenuItem>
                    <MenuItem value="high">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Flag sx={{ color: '#f44336' }} />
                        Tinggi
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tanggal Jatuh Tempo"
                  type="date"
                  value={todoForm.dueDate}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Waktu Jatuh Tempo"
                  type="time"
                  value={todoForm.dueTime}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, dueTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ditugaskan Kepada"
                  value={todoForm.assignedTo}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estimasi Durasi (menit)"
                  type="number"
                  value={todoForm.estimatedDuration}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 30 }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={todoForm.isRecurring}
                      onChange={(e) => setTodoForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                    />
                  }
                  label="Tugas Berulang"
                />
              </Grid>
              
              {todoForm.isRecurring && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Jenis Pengulangan</InputLabel>
                    <Select
                      value={todoForm.recurringType}
                      onChange={(e) => setTodoForm(prev => ({ ...prev, recurringType: e.target.value }))}
                      label="Jenis Pengulangan"
                    >
                      <MenuItem value="daily">Harian</MenuItem>
                      <MenuItem value="weekly">Mingguan</MenuItem>
                      <MenuItem value="monthly">Bulanan</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTodoDialog(false)}>Batal</Button>
          <Button 
            onClick={editingTodo ? handleUpdateTodo : handleCreateTodo}
            variant="contained"
            disabled={!todoForm.title || !todoForm.category}
          >
            {editingTodo ? 'Update' : 'Tambah Tugas'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          openEditDialog(selectedTodo);
          setAnchorEl(null);
        }}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {selectedTodo?.status === 'pending' && (
          <MenuItem onClick={() => handleStartTask(selectedTodo?.id)}>
            <ListItemIcon><PlayArrow /></ListItemIcon>
            <ListItemText>Mulai Tugas</ListItemText>
          </MenuItem>
        )}
        {selectedTodo?.status === 'in_progress' && (
          <MenuItem onClick={() => {
            setTodos(prev => prev.map(todo => 
              todo.id === selectedTodo.id ? { ...todo, status: 'pending' } : todo
            ));
            setAnchorEl(null);
          }}>
            <ListItemIcon><Pause /></ListItemIcon>
            <ListItemText>Jeda Tugas</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleToggleStar(selectedTodo?.id)}>
          <ListItemIcon>
            {selectedTodo?.isStarred ? <StarBorder /> : <Star />}
          </ListItemIcon>
          <ListItemText>
            {selectedTodo?.isStarred ? 'Hapus Bintang' : 'Beri Bintang'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteTodo(selectedTodo?.id)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Hapus</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TodoManager;