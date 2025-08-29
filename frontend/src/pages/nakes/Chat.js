import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  InputAdornment,
  Avatar,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  CardHeader,
  CardActions,
  LinearProgress,
  CircularProgress,
  AppBar,
  Toolbar,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Warning,
  Info,
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Message,
  VideoCall,
  Assignment,
  AttachMoney,
  Star,
  StarBorder,
  Today,
  DateRange,
  Event,
  EventAvailable,
  EventBusy,
  Refresh,
  Print,
  Download,
  Share,
  Close,
  Save,
  Clear,
  ArrowBack,
  ArrowForward,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  MedicalServices,
  Psychology,
  LocalHospital,
  Healing,
  MonetizationOn,
  Timeline as TimelineIcon,
  TrendingUp,
  Group,
  Notifications,
  NotificationsActive,
  Block,
  Done,
  Replay,
  Update,
  PersonAdd,
  History,
  CalendarToday,
  FolderSpecial,
  Description,
  AttachFile,
  CloudUpload,
  GetApp,
  Favorite,
  FavoriteBorder,
  BookmarkBorder,
  Bookmark,
  Flag,
  PriorityHigh,
  Schedule,
  AccountCircle,
  ContactPhone,
  Home,
  Work,
  School,
  Cake,
  Wc,
  Height,
  FitnessCenter,
  Bloodtype,
  Medication,
  LocalPharmacy,
  Emergency,
  ContactEmergency,
  Family,
  ChildCare,
  Elderly,
  Accessible,
  HealthAndSafety,
  Vaccines,
  MonitorHeart,
  Thermostat,
  Speed,
  ShowChart,
  Send,
  EmojiEmotions,
  AttachmentOutlined,
  ImageOutlined,
  MicOutlined,
  VideocamOutlined,
  CallOutlined,
  MoreHorizOutlined,
  CheckOutlined,
  DoneAllOutlined,
  AccessTimeOutlined,
  ErrorOutlineOutlined,
  ReplyOutlined,
  ForwardOutlined,
  DeleteOutlineOutlined,
  ContentCopyOutlined,
  BookmarkBorderOutlined,
  ReportOutlined,
  VolumeOffOutlined,
  VolumeUpOutlined,
  OnlineIcon,
  OfflineIcon,
  CircleOutlined,
  FiberManualRecordOutlined,
  KeyboardVoiceOutlined,
  StopOutlined,
  PlayArrowOutlined,
  PauseOutlined,
  GetAppOutlined,
  LaunchOutlined,
  ZoomInOutlined,
  FullscreenOutlined,
  CloseOutlined,
  ArrowBackOutlined,
  MenuOutlined,
  SearchOutlined,
  FilterListOutlined,
  SortOutlined,
  SettingsOutlined,
  InfoOutlined,
  HelpOutlineOutlined,
  FeedbackOutlined,
  BugReportOutlined,
  SecurityOutlined,
  PrivacyTipOutlined,
  DataUsageOutlined,
  StorageOutlined,
  CloudOutlined,
  SyncOutlined,
  BackupOutlined,
  RestoreOutlined,
  ArchiveOutlined,
  UnarchiveOutlined,
  StarOutlineOutlined,
  StarOutlined,
  ThumbUpOutlined,
  ThumbDownOutlined,
  ShareOutlined,
  LinkOutlined,
  QrCodeOutlined,
  PrintOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  CreateNewFolderOutlined,
  DriveFileMoveOutlined,
  FileCopyOutlined,
  FileDownloadOutlined,
  FileUploadOutlined,
  InsertDriveFileOutlined,
  PictureAsPdfOutlined,
  ImageSearchOutlined,
  PhotoLibraryOutlined,
  PhotoCameraOutlined,
  VideoCameraBackOutlined,
  MicNoneOutlined,
  HeadsetMicOutlined,
  RecordVoiceOverOutlined,
  VoiceChatOutlined,
  ChatBubbleOutlineOutlined,
  ForumOutlined,
  QuestionAnswerOutlined,
  LiveHelpOutlined,
  ContactSupportOutlined,
  SupportAgentOutlined,
  PersonOutlineOutlined,
  PeopleOutlineOutlined,
  GroupAddOutlined,
  PersonAddOutlined,
  PersonRemoveOutlined,
  SupervisorAccountOutlined,
  AdminPanelSettingsOutlined,
  ManageAccountsOutlined,
  AccountBoxOutlined,
  AccountCircleOutlined,
  BadgeOutlined,
  CardMembershipOutlined,
  ContactMailOutlined,
  ContactPageOutlined,
  ContactPhoneOutlined,
  AlternateEmailOutlined,
  PhoneOutlined,
  PhoneAndroidOutlined,
  PhoneIphoneOutlined,
  TabletOutlined,
  TabletMacOutlined,
  LaptopOutlined,
  LaptopMacOutlined,
  DesktopMacOutlined,
  DesktopWindowsOutlined,
  DevicesOutlined,
  DeviceHubOutlined,
  RouterOutlined,
  WifiOutlined,
  WifiOffOutlined,
  SignalWifiOffOutlined,
  NetworkCheckOutlined,
  NetworkWifiOutlined,
  BluetoothOutlined,
  BluetoothDisabledOutlined,
  BluetoothSearchingOutlined,
  BluetoothConnectedOutlined,
  UsbOutlined,
  CableOutlined,
  PowerOutlined,
  PowerOffOutlined,
  PowerSettingsNewOutlined,
  BatteryFullOutlined,
  BatteryChargingFullOutlined,
  Battery20Outlined,
  BatteryAlertOutlined,
  BatteryUnknownOutlined,
  FlashlightOnOutlined,
  FlashlightOffOutlined,
  LocationOnOutlined,
  LocationOffOutlined,
  LocationSearchingOutlined,
  MyLocationOutlined,
  GpsFixedOutlined,
  GpsNotFixedOutlined,
  GpsOffOutlined,
  MapOutlined,
  SatelliteOutlined,
  TerrainOutlined,
  LayersOutlined,
  LayersClearOutlined,
  PlaceOutlined,
  RoomOutlined,
  BusinessOutlined,
  StoreOutlined,
  StorefrontOutlined,
  LocalOfferOutlined,
  LocalActivityOutlined,
  LocalAtmOutlined,
  LocalBarOutlined,
  LocalCafeOutlined,
  LocalDiningOutlined,
  LocalFloristOutlined,
  LocalGasStationOutlined,
  LocalGroceryStoreOutlined,
  LocalHospitalOutlined,
  LocalHotelOutlined,
  LocalLaundryServiceOutlined,
  LocalLibraryOutlined,
  LocalMallOutlined,
  LocalMoviesOutlined,
  LocalParkingOutlined,
  LocalPharmacyOutlined,
  LocalPhoneOutlined,
  LocalPizzaOutlined,
  LocalPlayOutlined,
  LocalPostOfficeOutlined,
  LocalPrintshopOutlined,
  LocalSeeOutlined,
  LocalShippingOutlined,
  LocalTaxiOutlined,
  DirectionsOutlined,
  DirectionsBusOutlined,
  DirectionsCarOutlined,
  DirectionsSubwayOutlined,
  DirectionsTransitOutlined,
  DirectionsWalkOutlined,
  DirectionsBikeOutlined,
  DirectionsBoatOutlined,
  DirectionsRailwayOutlined,
  FlightOutlined,
  FlightTakeoffOutlined,
  FlightLandOutlined,
  AirplanemodeActiveOutlined,
  AirplanemodeInactiveOutlined,
  TrainOutlined,
  SubwayOutlined,
  TramOutlined,
  BusAlertOutlined,
  CommuteOutlined,
  DriveEtaOutlined,
  LocalShippingOutlined as TruckOutlined,
  TwoWheelerOutlined,
  PedalBikeOutlined,
  ElectricBikeOutlined,
  ElectricCarOutlined,
  ElectricScooterOutlined,
  EvStationOutlined,
  CarRentalOutlined,
  CarRepairOutlined,
  BuildOutlined,
  ConstructionOutlined,
  EngineeringOutlined,
  HandymanOutlined,
  PlumbingOutlined,
  ElectricalServicesOutlined,
  RoofingOutlined,
  CarpenterOutlined,
  FormatPaintOutlined,
  CleaningServicesOutlined,
  PestControlOutlined,
  YardOutlined,
  GrassOutlined,
  AgricultureOutlined,
  EcoOutlined,
  RecyclingOutlined,
  CompostOutlined,
  WaterDropOutlined,
  OpacityOutlined,
  InvertColorsOutlined,
  ColorizeOutlined,
  PaletteOutlined,
  BrushOutlined,
  FormatColorFillOutlined,
  FormatColorResetOutlined,
  FormatColorTextOutlined,
  TextFieldsOutlined,
  TitleOutlined,
  SubtitlesOutlined,
  ClosedCaptionOutlined,
  TranslateOutlined,
  SpellcheckOutlined,
  FontDownloadOutlined,
  FontDownloadOffOutlined,
  FormatSizeOutlined,
  FormatBoldOutlined,
  FormatItalicOutlined,
  FormatUnderlinedOutlined,
  FormatStrikethroughOutlined,
  FormatClearOutlined,
  FormatAlignLeftOutlined,
  FormatAlignCenterOutlined,
  FormatAlignRightOutlined,
  FormatAlignJustifyOutlined,
  FormatIndentIncreaseOutlined,
  FormatIndentDecreaseOutlined,
  FormatLineSpacingOutlined,
  FormatListBulletedOutlined,
  FormatListNumberedOutlined,
  FormatQuoteOutlined,
  LinkOffOutlined,
  InsertLinkOutlined,
  InsertCommentOutlined,
  InsertEmoticonOutlined,
  InsertInvitationOutlined,
  InsertPhotoOutlined,
  InsertChartOutlined,
  TableChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineAxisOutlined,
  ScatterPlotOutlined,
  BubbleChartOutlined,
  DonutLargeOutlined,
  DonutSmallOutlined,
  ShowChartOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  TrendingFlatOutlined,
  TimelineOutlined,
  GanttChartOutlined,
  AssessmentOutlined,
  AnalyticsOutlined,
  InsightsOutlined,
  QueryStatsOutlined,
  PollOutlined,
  EqualizerOutlined,
  GraphicEqOutlined,
  MultilineChartOutlined,
  StackedLineChartOutlined,
  AreaChartOutlined,
  WaterfallChartOutlined,
  CandlestickChartOutlined,
  RadarOutlined,
  HexagonOutlined,
  PentagonOutlined,
  SquareOutlined,
  CircleOutlined as CircleShapeOutlined,
  TriangleOutlined,
  StarOutlined as StarShapeOutlined,
  DiamondOutlined,
  OvalOutlined,
  RectangleOutlined,
  PolylineOutlined,
  LinearScaleOutlined,
  StraightenOutlined,
  SquareFootOutlined,
  AspectRatioOutlined,
  CropOutlined,
  Crop169Outlined,
  Crop32Outlined,
  Crop54Outlined,
  Crop75Outlined,
  CropDinOutlined,
  CropFreeOutlined,
  CropLandscapeOutlined,
  CropOriginalOutlined,
  CropPortraitOutlined,
  CropRotateOutlined,
  CropSquareOutlined,
  FlipOutlined,
  FlipToBackOutlined,
  FlipToFrontOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  Rotate90DegreesCcwOutlined,
  Rotate90DegreesCwOutlined,
  TransformOutlined,
  TuneOutlined,
  FilterOutlined,
  FilterAltOutlined,
  FilterListOutlined as FilterListAltOutlined,
  FilterNoneOutlined,
  Filter1Outlined,
  Filter2Outlined,
  Filter3Outlined,
  Filter4Outlined,
  Filter5Outlined,
  Filter6Outlined,
  Filter7Outlined,
  Filter8Outlined,
  Filter9Outlined,
  Filter9PlusOutlined,
  FilterBAndWOutlined,
  FilterCenterFocusOutlined,
  FilterDramaOutlined,
  FilterFramesOutlined,
  FilterHdrOutlined,
  FilterTiltShiftOutlined,
  FilterVintageOutlined,
  AutoFixHighOutlined,
  AutoFixNormalOutlined,
  AutoFixOffOutlined,
  AutoAwesomeOutlined,
  AutoAwesomeMosaicOutlined,
  AutoAwesomeMotionOutlined,
  AutoDeleteOutlined,
  AutorenewOutlined,
  AutoModeOutlined,
  AutoStoriesOutlined,
  AutoGraphOutlined,
  SmartButtonOutlined,
  SmartDisplayOutlined,
  SmartScreenOutlined,
  SmartToyOutlined,
  PsychologyOutlined,
  ScienceOutlined,
  BiotechOutlined,
  ChemistryOutlined,
  MedicalInformationOutlined,
  MedicalServicesOutlined,
  LocalHospitalOutlined as HospitalOutlined,
  EmergencyOutlined,
  AmbulanceOutlined,
  HealthAndSafetyOutlined,
  VaccinesOutlined,
  CoronavirusOutlined,
  MasksOutlined,
  SanitizeOutlined,
  CleanHandsOutlined,
  WashOutlined,
  BathtubOutlined,
  ShowerOutlined,
  HotTubOutlined,
  PoolOutlined,
  BeachAccessOutlined,
  UmbrellaOutlined,
  KitesurfingOutlined,
  SurfingOutlined,
  SkiingOutlined,
  SnowboardingOutlined,
  IceSkatingOutlined,
  SledingOutlined,
  DownhillSkiingOutlined,
  CrossCountrySkiingOutlined,
  SnowshoeingOutlined,
  HikingOutlined,
  TrekkingOutlined,
  MountainBikingOutlined,
  CyclingOutlined,
  RunningOutlined,
  WalkingOutlined,
  FitnessOutlined,
  SportsOutlined,
  SportsBaseballOutlined,
  SportsBasketballOutlined,
  SportsCricketOutlined,
  SportsEsportsOutlined,
  SportsFootballOutlined,
  SportsGolfOutlined,
  SportsHandballOutlined,
  SportsHockeyOutlined,
  SportsKabaddiOutlined,
  SportsMmaOutlined,
  SportsMotorsportsOutlined,
  SportsRugbyOutlined,
  SportsSoccerOutlined,
  SportsTennisOutlined,
  SportsVolleyballOutlined,
  Pool8BallOutlined,
  Pool9BallOutlined,
  BilliardsOutlined,
  CasinoOutlined,
  DiceOutlined,
  SlotsOutlined,
  PokerChipOutlined,
  VideogameAssetOutlined,
  VideogameAssetOffOutlined,
  SportsEsportsOutlined as GamingOutlined,
  GamepadOutlined,
  JoystickOutlined,
  MouseOutlined,
  KeyboardOutlined,
  KeyboardAltOutlined,
  KeyboardArrowDownOutlined,
  KeyboardArrowLeftOutlined,
  KeyboardArrowRightOutlined,
  KeyboardArrowUpOutlined,
  KeyboardBackspaceOutlined,
  KeyboardCapsLockOutlined,
  KeyboardCommandKeyOutlined,
  KeyboardControlKeyOutlined,
  KeyboardDoubleArrowDownOutlined,
  KeyboardDoubleArrowLeftOutlined,
  KeyboardDoubleArrowRightOutlined,
  KeyboardDoubleArrowUpOutlined,
  KeyboardHideOutlined,
  KeyboardOptionKeyOutlined,
  KeyboardReturnOutlined,
  KeyboardTabOutlined,
  KeyboardVoiceOutlined as VoiceInputOutlined,
  SpaceBarOutlined,
  TouchAppOutlined,
  PanToolOutlined,
  BackHandOutlined,
  FrontHandOutlined,
  WavingHandOutlined,
  ThumbUpOutlined as LikeOutlined,
  ThumbDownOutlined as DislikeOutlined,
  ThumbsUpDownOutlined,
  FavoriteOutlined,
  FavoriteBorderOutlined,
  HeartBrokenOutlined,
  VolunteerActivismOutlined,
  EmojiEmotionsOutlined,
  EmojiEventsOutlined,
  EmojiObjectsOutlined,
  EmojiPeopleOutlined,
  EmojiSymbolsOutlined,
  EmojiTransportationOutlined,
  EmojiNatureOutlined,
  EmojiFoodBeverageOutlined,
  EmojiAnimalsOutlined,
  EmojiActivitiesOutlined,
  EmojiTravelOutlined,
  EmojiPlacesOutlined,
  EmojiObjectsOutlined as ObjectsOutlined,
  EmojiSymbolsOutlined as SymbolsOutlined,
  EmojiEventsOutlined as EventsOutlined,
  EmojiEmotionsOutlined as EmotionsOutlined,
  EmojiPeopleOutlined as PeopleEmojiOutlined,
  EmojiNatureOutlined as NatureOutlined,
  EmojiFoodBeverageOutlined as FoodOutlined,
  EmojiAnimalsOutlined as AnimalsOutlined,
  EmojiActivitiesOutlined as ActivitiesOutlined,
  EmojiTravelOutlined as TravelOutlined,
  EmojiPlacesOutlined as PlacesOutlined,
  EmojiTransportationOutlined as TransportationOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, isToday, isTomorrow, isYesterday, differenceInYears, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const NakesChat = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachmentMenu, setAttachmentMenu] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [chatInfo, setChatInfo] = useState(false);
  
  const [dialogs, setDialogs] = useState({
    imagePreview: false,
    chatInfo: false,
    deleteMessage: false,
    blockUser: false,
    reportUser: false,
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const messageStatuses = {
    sending: { icon: AccessTimeOutlined, color: 'text.secondary' },
    sent: { icon: CheckOutlined, color: 'text.secondary' },
    delivered: { icon: DoneAllOutlined, color: 'text.secondary' },
    read: { icon: DoneAllOutlined, color: 'primary.main' },
    failed: { icon: ErrorOutlineOutlined, color: 'error.main' },
  };

  const chatStatuses = {
    online: { label: 'Online', color: 'success.main', icon: FiberManualRecordOutlined },
    offline: { label: 'Offline', color: 'text.secondary', icon: CircleOutlined },
    away: { label: 'Away', color: 'warning.main', icon: FiberManualRecordOutlined },
    busy: { label: 'Busy', color: 'error.main', icon: FiberManualRecordOutlined },
  };

  useEffect(() => {
    fetchChats();
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateOnlineStatus();
      if (selectedChat) {
        simulateTyping();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRecordingTime(0);
    }
  }, [isRecording]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockChats = [
        {
          id: 'chat1',
          patientId: 'pat1',
          patientName: 'Ahmad Wijaya',
          patientAvatar: null,
          lastMessage: 'Terima kasih dokter atas konsultasinya',
          lastMessageTime: '2024-01-15T14:30:00Z',
          unreadCount: 2,
          status: 'online',
          isTyping: false,
          isPinned: true,
          isMuted: false,
          isArchived: false,
          priority: 'high',
          tags: ['follow-up', 'diabetes'],
        },
        {
          id: 'chat2',
          patientId: 'pat2',
          patientName: 'Siti Nurhaliza',
          patientAvatar: null,
          lastMessage: 'Kapan jadwal kontrol berikutnya dok?',
          lastMessageTime: '2024-01-15T13:45:00Z',
          unreadCount: 0,
          status: 'offline',
          isTyping: false,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          priority: 'normal',
          tags: ['pregnancy'],
        },
        {
          id: 'chat3',
          patientId: 'pat3',
          patientName: 'Budi Santoso',
          patientAvatar: null,
          lastMessage: 'Hasil lab sudah keluar dok',
          lastMessageTime: '2024-01-15T12:20:00Z',
          unreadCount: 5,
          status: 'away',
          isTyping: true,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          priority: 'urgent',
          tags: ['lab-results', 'critical'],
        },
        {
          id: 'chat4',
          patientId: 'pat4',
          patientName: 'Maya Sari',
          patientAvatar: null,
          lastMessage: 'Baik dok, saya akan datang besok',
          lastMessageTime: '2024-01-15T11:15:00Z',
          unreadCount: 0,
          status: 'online',
          isTyping: false,
          isPinned: false,
          isMuted: true,
          isArchived: false,
          priority: 'normal',
          tags: ['appointment'],
        },
        {
          id: 'chat5',
          patientId: 'pat5',
          patientName: 'Andi Pratama',
          patientAvatar: null,
          lastMessage: 'Obatnya sudah habis dok',
          lastMessageTime: '2024-01-15T10:30:00Z',
          unreadCount: 1,
          status: 'offline',
          isTyping: false,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          priority: 'normal',
          tags: ['prescription'],
        },
      ];
      
      setChats(mockChats);
      setOnlineUsers(new Set(['pat1', 'pat4']));
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
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockMessages = [
        {
          id: 'msg1',
          chatId,
          senderId: 'pat1',
          senderName: 'Ahmad Wijaya',
          content: 'Selamat pagi dokter, saya ingin konsultasi tentang hasil lab saya',
          type: 'text',
          timestamp: '2024-01-15T09:00:00Z',
          status: 'read',
          isEdited: false,
          replyTo: null,
          attachments: [],
        },
        {
          id: 'msg2',
          chatId,
          senderId: user.uid,
          senderName: user.displayName,
          content: 'Selamat pagi Pak Ahmad. Baik, saya akan review hasil lab Bapak terlebih dahulu.',
          type: 'text',
          timestamp: '2024-01-15T09:05:00Z',
          status: 'read',
          isEdited: false,
          replyTo: null,
          attachments: [],
        },
        {
          id: 'msg3',
          chatId,
          senderId: 'pat1',
          senderName: 'Ahmad Wijaya',
          content: 'Ini hasil lab saya dok',
          type: 'image',
          timestamp: '2024-01-15T09:10:00Z',
          status: 'read',
          isEdited: false,
          replyTo: null,
          attachments: [
            {
              id: 'att1',
              type: 'image',
              name: 'hasil_lab_ahmad.jpg',
              url: '/api/placeholder/400/300',
              size: 245760,
            }
          ],
        },
        {
          id: 'msg4',
          chatId,
          senderId: user.uid,
          senderName: user.displayName,
          content: 'Terima kasih. Dari hasil lab yang saya lihat, kadar gula darah Bapak masih dalam batas normal. Namun kolesterol LDL sedikit tinggi. Saya sarankan untuk mengurangi makanan berlemak dan rutin olahraga.',
          type: 'text',
          timestamp: '2024-01-15T09:15:00Z',
          status: 'read',
          isEdited: false,
          replyTo: 'msg3',
          attachments: [],
        },
        {
          id: 'msg5',
          chatId,
          senderId: 'pat1',
          senderName: 'Ahmad Wijaya',
          content: 'Baik dok, apakah perlu obat tambahan?',
          type: 'text',
          timestamp: '2024-01-15T09:20:00Z',
          status: 'read',
          isEdited: false,
          replyTo: null,
          attachments: [],
        },
        {
          id: 'msg6',
          chatId,
          senderId: user.uid,
          senderName: user.displayName,
          content: 'Untuk sementara belum perlu obat tambahan. Coba dulu dengan pola makan sehat dan olahraga teratur. Kontrol lagi 3 bulan ke depan ya.',
          type: 'text',
          timestamp: '2024-01-15T09:25:00Z',
          status: 'delivered',
          isEdited: false,
          replyTo: null,
          attachments: [],
        },
        {
          id: 'msg7',
          chatId,
          senderId: 'pat1',
          senderName: 'Ahmad Wijaya',
          content: 'Terima kasih dokter atas konsultasinya',
          type: 'text',
          timestamp: '2024-01-15T14:30:00Z',
          status: 'sent',
          isEdited: false,
          replyTo: null,
          attachments: [],
        },
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat pesan',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOnlineStatus = () => {
    // Simulate random online status changes
    const randomPatients = ['pat1', 'pat2', 'pat3', 'pat4', 'pat5'];
    const newOnlineUsers = new Set();
    
    randomPatients.forEach(patientId => {
      if (Math.random() > 0.5) {
        newOnlineUsers.add(patientId);
      }
    });
    
    setOnlineUsers(newOnlineUsers);
  };

  const simulateTyping = () => {
    if (Math.random() > 0.8) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !replyTo) return;
    
    try {
      const messageData = {
        id: `msg${Date.now()}`,
        chatId: selectedChat.id,
        senderId: user.uid,
        senderName: user.displayName,
        content: newMessage.trim(),
        type: 'text',
        timestamp: new Date().toISOString(),
        status: 'sending',
        isEdited: false,
        replyTo: replyTo?.id || null,
        attachments: [],
      };
      
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
      setReplyTo(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id 
          ? { ...msg, status: 'sent' }
          : msg
      ));
      
      // Update chat last message
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id
          ? { 
              ...chat, 
              lastMessage: newMessage.trim(),
              lastMessageTime: new Date().toISOString()
            }
          : chat
      ));
      
    } catch (error) {
      console.error('Error sending message:', error);
      setSnackbar({
        open: true,
        message: 'Gagal mengirim pesan',
        severity: 'error',
      });
    }
  };

  const handleFileUpload = async (file) => {
    try {
      const messageData = {
        id: `msg${Date.now()}`,
        chatId: selectedChat.id,
        senderId: user.uid,
        senderName: user.displayName,
        content: file.type.startsWith('image/') ? 'Mengirim gambar' : 'Mengirim file',
        type: file.type.startsWith('image/') ? 'image' : 'file',
        timestamp: new Date().toISOString(),
        status: 'sending',
        isEdited: false,
        replyTo: null,
        attachments: [
          {
            id: `att${Date.now()}`,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            url: URL.createObjectURL(file),
            size: file.size,
          }
        ],
      };
      
      setMessages(prev => [...prev, messageData]);
      
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id 
          ? { ...msg, status: 'sent' }
          : msg
      ));
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setSnackbar({
        open: true,
        message: 'Gagal mengirim file',
        severity: 'error',
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getFilteredChats = () => {
    let filtered = chats;
    
    if (searchQuery) {
      filtered = filtered.filter(chat => 
        chat.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'unread') {
        filtered = filtered.filter(chat => chat.unreadCount > 0);
      } else if (statusFilter === 'pinned') {
        filtered = filtered.filter(chat => chat.isPinned);
      } else if (statusFilter === 'archived') {
        filtered = filtered.filter(chat => chat.isArchived);
      } else {
        filtered = filtered.filter(chat => chat.status === statusFilter);
      }
    }
    
    // Sort by pinned, then by last message time
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
  };

  const getMessageStatusIcon = (status) => {
    const statusInfo = messageStatuses[status];
    const IconComponent = statusInfo.icon;
    return <IconComponent sx={{ fontSize: 16, color: statusInfo.color }} />;
  };

  const formatMessageTime = (timestamp) => {
    const date = parseISO(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Kemarin';
    } else {
      return format(date, 'dd/MM');
    }
  };

  const formatChatTime = (timestamp) => {
    const date = parseISO(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: id });
  };

  const ChatList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat List Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Chat Pasien
        </Typography>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Cari chat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <FormControl fullWidth size="small">
          <InputLabel>Filter</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Filter"
          >
            <MenuItem value="all">Semua Chat</MenuItem>
            <MenuItem value="unread">Belum Dibaca</MenuItem>
            <MenuItem value="pinned">Dipinkan</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
            <MenuItem value="archived">Diarsipkan</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Chat List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ p: 0 }}>
          {getFilteredChats().map((chat) => {
            const isOnline = onlineUsers.has(chat.patientId);
            const statusInfo = chatStatuses[isOnline ? 'online' : 'offline'];
            const StatusIcon = statusInfo.icon;
            
            return (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ListItem
                  button
                  selected={selectedChat?.id === chat.id}
                  onClick={() => {
                    setSelectedChat(chat);
                    if (isMobile) {
                      setDrawerOpen(false);
                    }
                  }}
                  sx={{
                    borderLeft: selectedChat?.id === chat.id ? 4 : 0,
                    borderColor: 'primary.main',
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <StatusIcon 
                          sx={{ 
                            fontSize: 12, 
                            color: statusInfo.color,
                            backgroundColor: 'background.paper',
                            borderRadius: '50%',
                            p: 0.2,
                          }} 
                        />
                      }
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {chat.patientName.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: chat.unreadCount > 0 ? 700 : 500,
                            flex: 1,
                          }}
                        >
                          {chat.patientName}
                        </Typography>
                        {chat.isPinned && (
                          <BookmarkOutlined sx={{ fontSize: 16, color: 'warning.main' }} />
                        )}
                        {chat.isMuted && (
                          <VolumeOffOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontWeight: chat.unreadCount > 0 ? 600 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {chat.isTyping ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                sedang mengetik
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.2 }}>
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ 
                                      duration: 1, 
                                      repeat: Infinity, 
                                      delay: i * 0.2 
                                    }}
                                  >
                                    <Box 
                                      sx={{ 
                                        width: 3, 
                                        height: 3, 
                                        borderRadius: '50%', 
                                        bgcolor: 'primary.main' 
                                      }} 
                                    />
                                  </motion.div>
                                ))}
                              </Box>
                            </Box>
                          ) : (
                            chat.lastMessage
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatChatTime(chat.lastMessageTime)}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                      {chat.unreadCount > 0 && (
                        <Badge 
                          badgeContent={chat.unreadCount} 
                          color="primary" 
                          max={99}
                        />
                      )}
                      {chat.priority === 'urgent' && (
                        <PriorityHigh sx={{ fontSize: 16, color: 'error.main' }} />
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider variant="inset" component="li" />
              </motion.div>
            );
          })}
        </List>
        
        {getFilteredChats().length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ChatBubbleOutlineOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Tidak ada chat ditemukan
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  const MessageBubble = ({ message, isOwn }) => {
    const replyMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
    
    return (
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
          <Box
            sx={{
              maxWidth: '70%',
              minWidth: '100px',
            }}
          >
            {/* Reply Preview */}
            {replyMessage && (
              <Box
                sx={{
                  p: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  backgroundColor: 'action.hover',
                  borderLeft: 3,
                  borderColor: 'primary.main',
                }}
              >
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                  {replyMessage.senderName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {replyMessage.content.length > 50 
                    ? `${replyMessage.content.substring(0, 50)}...` 
                    : replyMessage.content
                  }
                </Typography>
              </Box>
            )}
            
            {/* Message Content */}
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: isOwn ? 'primary.main' : 'background.paper',
                color: isOwn ? 'primary.contrastText' : 'text.primary',
                position: 'relative',
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setMessageMenu(e.currentTarget);
                setSelectedMessage(message);
              }}
            >
              {/* Message Text */}
              {message.type === 'text' && (
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {message.content}
                </Typography>
              )}
              
              {/* Image Message */}
              {message.type === 'image' && message.attachments[0] && (
                <Box>
                  {message.content && (
                    <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-word' }}>
                      {message.content}
                    </Typography>
                  )}
                  <Box
                    component="img"
                    src={message.attachments[0].url}
                    alt={message.attachments[0].name}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setImagePreview(message.attachments[0]);
                      setDialogs(prev => ({ ...prev, imagePreview: true }));
                    }}
                  />
                </Box>
              )}
              
              {/* File Message */}
              {message.type === 'file' && message.attachments[0] && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFileOutlined />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {message.attachments[0].name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(message.attachments[0].size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    <GetAppOutlined />
                  </IconButton>
                </Box>
              )}
              
              {/* Message Info */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {formatMessageTime(message.timestamp)}
                  {message.isEdited && ' • diedit'}
                </Typography>
                
                {isOwn && (
                  <Box sx={{ ml: 1 }}>
                    {getMessageStatusIcon(message.status)}
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </motion.div>
    );
  };

  const ChatArea = () => {
    if (!selectedChat) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <ChatBubbleOutlineOutlined sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            Pilih chat untuk memulai percakapan
          </Typography>
        </Box>
      );
    }
    
    const isOnline = onlineUsers.has(selectedChat.patientId);
    
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
                <ArrowBackOutlined />
              </IconButton>
            )}
            
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              {selectedChat.patientName.charAt(0)}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedChat.patientName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiberManualRecordOutlined 
                  sx={{ 
                    fontSize: 8, 
                    color: isOnline ? 'success.main' : 'text.secondary' 
                  }} 
                />
                <Typography variant="caption" color="text.secondary">
                  {isOnline ? 'Online' : `Terakhir dilihat ${formatChatTime(selectedChat.lastMessageTime)}`}
                </Typography>
                {isTyping && (
                  <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
                    sedang mengetik...
                  </Typography>
                )}
              </Box>
            </Box>
            
            <IconButton onClick={() => setDialogs(prev => ({ ...prev, chatInfo: true }))}>
              <InfoOutlined />
            </IconButton>
            
            <IconButton>
              <CallOutlined />
            </IconButton>
            
            <IconButton>
              <VideocamOutlined />
            </IconButton>
            
            <IconButton>
              <MoreVertOutlined />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {/* Messages Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === user.uid}
            />
          ))}
          
          {isTyping && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {selectedChat.patientName} sedang mengetik
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.2 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 4, 
                          height: 4, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main' 
                        }} 
                      />
                    </motion.div>
                  ))}
                </Box>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Reply Preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'action.hover' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                      Membalas {replyTo.senderName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                      {replyTo.content.length > 100 
                        ? `${replyTo.content.substring(0, 100)}...` 
                        : replyTo.content
                      }
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setReplyTo(null)}>
                    <CloseOutlined />
                  </IconButton>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <IconButton
              onClick={(e) => setAttachmentMenu(e.currentTarget)}
              sx={{ mb: 0.5 }}
            >
              <AttachmentOutlined />
            </IconButton>
            
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ketik pesan..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
            
            {isRecording ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="error">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </Typography>
                <IconButton
                  color="error"
                  onClick={() => setIsRecording(false)}
                >
                  <StopOutlined />
                </IconButton>
              </Box>
            ) : (
              <IconButton
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                onMouseLeave={() => setIsRecording(false)}
                sx={{ mb: 0.5 }}
              >
                <KeyboardVoiceOutlined />
              </IconButton>
            )}
            
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !replyTo}
              sx={{ mb: 0.5 }}
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </Box>
    );
  };

  // Attachment Menu
  const AttachmentMenu = () => (
    <Menu
      anchorEl={attachmentMenu}
      open={Boolean(attachmentMenu)}
      onClose={() => setAttachmentMenu(null)}
    >
      <MenuItemComponent
        onClick={() => {
          fileInputRef.current?.click();
          setAttachmentMenu(null);
        }}
      >
        <ListItemIcon>
          <AttachFileOutlined />
        </ListItemIcon>
        <ListItemText primary="File" />
      </MenuItemComponent>
      
      <MenuItemComponent
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) handleFileUpload(file);
          };
          input.click();
          setAttachmentMenu(null);
        }}
      >
        <ListItemIcon>
          <ImageOutlined />
        </ListItemIcon>
        <ListItemText primary="Gambar" />
      </MenuItemComponent>
      
      <MenuItemComponent
        onClick={() => {
          setAttachmentMenu(null);
          // Handle camera
        }}
      >
        <ListItemIcon>
          <PhotoCameraOutlined />
        </ListItemIcon>
        <ListItemText primary="Kamera" />
      </MenuItemComponent>
    </Menu>
   );

  // Chat Info Dialog
  const ChatInfoDialog = () => (
    <Dialog
      open={dialogs.chatInfo}
      onClose={() => setDialogs(prev => ({ ...prev, chatInfo: false }))}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {selectedChat?.patientName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{selectedChat?.patientName}</Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {selectedChat?.patientId}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <List>
          <ListItem>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText
              primary="Status"
              secondary={onlineUsers.has(selectedChat?.patientId) ? 'Online' : 'Offline'}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <AccessTime />
            </ListItemIcon>
            <ListItemText
              primary="Terakhir dilihat"
              secondary={formatChatTime(selectedChat?.lastMessageTime)}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Message />
            </ListItemIcon>
            <ListItemText
              primary="Total pesan"
              secondary={messages.length}
            />
          </ListItem>
          
          <Divider sx={{ my: 1 }} />
          
          <ListItem button>
            <ListItemIcon>
              <Assignment />
            </ListItemIcon>
            <ListItemText primary="Lihat Riwayat Medis" />
          </ListItem>
          
          <ListItem button>
            <ListItemIcon>
              <Event />
            </ListItemIcon>
            <ListItemText primary="Jadwalkan Appointment" />
          </ListItem>
          
          <ListItem button>
            <ListItemIcon>
              <LocalPharmacy />
            </ListItemIcon>
            <ListItemText primary="Resep Obat" />
          </ListItem>
          
          <Divider sx={{ my: 1 }} />
          
          <ListItem>
            <ListItemIcon>
              <VolumeOffOutlined />
            </ListItemIcon>
            <ListItemText primary="Bisukan notifikasi" />
            <ListItemSecondaryAction>
              <Switch
                checked={selectedChat?.isMuted}
                onChange={(e) => {
                  setChats(prev => prev.map(chat => 
                    chat.id === selectedChat.id
                      ? { ...chat, isMuted: e.target.checked }
                      : chat
                  ));
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem button onClick={() => setDialogs(prev => ({ ...prev, blockUser: true }))}>
            <ListItemIcon>
              <Block color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Blokir Pasien" 
              primaryTypographyProps={{ color: 'error' }}
            />
          </ListItem>
        </List>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setDialogs(prev => ({ ...prev, chatInfo: false }))}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Image Preview Dialog
  const ImagePreviewDialog = () => (
    <Dialog
      open={dialogs.imagePreview}
      onClose={() => setDialogs(prev => ({ ...prev, imagePreview: false }))}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{imagePreview?.name}</Typography>
          <IconButton onClick={() => setDialogs(prev => ({ ...prev, imagePreview: false }))}>
            <CloseOutlined />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', p: 0 }}>
        {imagePreview && (
          <Box
            component="img"
            src={imagePreview.url}
            alt={imagePreview.name}
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
            }}
          />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button startIcon={<GetAppOutlined />}>
          Download
        </Button>
        <Button startIcon={<ShareOutlined />}>
          Bagikan
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Delete Message Dialog
  const DeleteMessageDialog = () => (
    <Dialog
      open={dialogs.deleteMessage}
      onClose={() => setDialogs(prev => ({ ...prev, deleteMessage: false }))}
    >
      <DialogTitle>Hapus Pesan</DialogTitle>
      <DialogContent>
        <Typography>
          Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogs(prev => ({ ...prev, deleteMessage: false }))}>
          Batal
        </Button>
        <Button 
          color="error" 
          onClick={() => {
            setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
            setDialogs(prev => ({ ...prev, deleteMessage: false }));
            setSnackbar({
              open: true,
              message: 'Pesan berhasil dihapus',
              severity: 'success',
            });
          }}
        >
          Hapus
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Block User Dialog
  const BlockUserDialog = () => (
    <Dialog
      open={dialogs.blockUser}
      onClose={() => setDialogs(prev => ({ ...prev, blockUser: false }))}
    >
      <DialogTitle>Blokir Pasien</DialogTitle>
      <DialogContent>
        <Typography>
          Apakah Anda yakin ingin memblokir {selectedChat?.patientName}? 
          Pasien tidak akan dapat mengirim pesan kepada Anda.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogs(prev => ({ ...prev, blockUser: false }))}>
          Batal
        </Button>
        <Button 
          color="error" 
          onClick={() => {
            setDialogs(prev => ({ ...prev, blockUser: false }));
            setSnackbar({
              open: true,
              message: 'Pasien berhasil diblokir',
              severity: 'success',
            });
          }}
        >
          Blokir
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Report User Dialog
  const ReportUserDialog = () => (
    <Dialog
      open={dialogs.reportUser}
      onClose={() => setDialogs(prev => ({ ...prev, reportUser: false }))}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Laporkan Pasien</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Laporkan {selectedChat?.patientName} karena:
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Alasan Laporan</InputLabel>
          <Select label="Alasan Laporan">
            <MenuItem value="spam">Spam</MenuItem>
            <MenuItem value="harassment">Pelecehan</MenuItem>
            <MenuItem value="inappropriate">Konten Tidak Pantas</MenuItem>
            <MenuItem value="fake">Akun Palsu</MenuItem>
            <MenuItem value="other">Lainnya</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Deskripsi (Opsional)"
          placeholder="Jelaskan detail masalah..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogs(prev => ({ ...prev, reportUser: false }))}>
          Batal
        </Button>
        <Button 
          color="error" 
          onClick={() => {
            setDialogs(prev => ({ ...prev, reportUser: false }));
            setSnackbar({
              open: true,
              message: 'Laporan berhasil dikirim',
              severity: 'success',
            });
          }}
        >
          Kirim Laporan
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading && chats.length === 0) {
    return <LoadingSpinner message="Memuat chat..." />;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Chat List Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: isMobile ? '100%' : 350,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 350,
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
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) handleFileUpload(file);
        }}
      />
      
      {/* Menus and Dialogs */}
      <AttachmentMenu />
      <MessageMenu />
      <ChatInfoDialog />
      <ImagePreviewDialog />
      <DeleteMessageDialog />
      <BlockUserDialog />
      <ReportUserDialog />
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NakesChat;