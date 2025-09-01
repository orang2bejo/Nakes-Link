const User = require('../models/User');
const Nakes = require('../models/Nakes');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { SecurityAuditLogger } = require('../utils/encryption');
const { securityMonitor } = require('../utils/securityMonitor');
const mongoose = require('mongoose');

class AdminController {
  // Dashboard Statistics
  async getDashboardStats(req, res) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      // User Statistics
      const totalUsers = await User.countDocuments();
      const totalPatients = await User.countDocuments({ role: 'patient' });
      const totalNakes = await User.countDocuments({ role: 'nakes' });
      const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfDay } });
      const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: startOfWeek } });
      const activeUsers = await User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      });

      // Nakes Statistics
      const pendingNakesVerification = await Nakes.countDocuments({ verified: false });
      const verifiedNakes = await Nakes.countDocuments({ verified: true });
      const suspendedNakes = await Nakes.countDocuments({ suspended: true });

      // Appointment Statistics
      const totalAppointments = await Appointment.countDocuments();
      const appointmentsToday = await Appointment.countDocuments({ 
        appointmentDate: { 
          $gte: startOfDay, 
          $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) 
        } 
      });
      const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
      const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
      const upcomingAppointments = await Appointment.countDocuments({ 
        status: 'scheduled',
        appointmentDate: { $gte: new Date() }
      });

      // Payment Statistics
      const totalRevenue = await Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const revenueToday = await Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startOfDay }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const revenueThisMonth = await Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Service Statistics
      const totalServices = await Service.countDocuments();
      const activeServices = await Service.countDocuments({ isActive: true });
      const inactiveServices = await Service.countDocuments({ isActive: false });

      // Review Statistics
      const totalReviews = await Review.countDocuments();
      const averageRating = await Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]);

      // Chat Statistics
      const activeChatRooms = await Chat.countDocuments({ status: 'active' });
      const totalMessages = await Chat.aggregate([
        { $unwind: '$messages' },
        { $count: 'total' }
      ]);

      const stats = {
        users: {
          total: totalUsers,
          patients: totalPatients,
          nakes: totalNakes,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          active: activeUsers
        },
        nakes: {
          pending: pendingNakesVerification,
          verified: verifiedNakes,
          suspended: suspendedNakes
        },
        appointments: {
          total: totalAppointments,
          today: appointmentsToday,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          upcoming: upcomingAppointments
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: revenueToday[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0
        },
        services: {
          total: totalServices,
          active: activeServices,
          inactive: inactiveServices
        },
        reviews: {
          total: totalReviews,
          averageRating: averageRating[0]?.avgRating || 0
        },
        chat: {
          activeRooms: activeChatRooms,
          totalMessages: totalMessages[0]?.total || 0
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard statistics'
      });
    }
  }

  // Chart Data for Dashboard
  async getChartData(req, res) {
    try {
      const { period = '30d' } = req.query;
      let startDate;
      let groupBy;

      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case '12m':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      // User Registration Chart
      const userRegistrations = await User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: groupBy, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      // Revenue Chart
      const revenueData = await Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startDate }
          } 
        },
        { 
          $group: { 
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount' }
          } 
        },
        { $sort: { _id: 1 } }
      ]);

      // Appointment Status Chart
      const appointmentStatus = await Appointment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Service Category Chart
      const serviceCategories = await Service.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        data: {
          userRegistrations,
          revenueData,
          appointmentStatus,
          serviceCategories
        }
      });
    } catch (error) {
      console.error('Get chart data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chart data'
      });
    }
  }

  // Recent Activities
  async getRecentActivities(req, res) {
    try {
      const { limit = 20 } = req.query;

      // Recent user registrations
      const recentUsers = await User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Recent appointments
      const recentAppointments = await Appointment.find()
        .populate('patient', 'name')
        .populate('nakes', 'name')
        .select('patient nakes appointmentDate status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Recent payments
      const recentPayments = await Payment.find()
        .populate('user', 'name')
        .select('user amount status method createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Recent reviews
      const recentReviews = await Review.find()
        .populate('patient', 'name')
        .populate('nakes', 'name')
        .select('patient nakes rating comment createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const activities = [
        ...recentUsers.map(user => ({
          type: 'user_registration',
          description: `New ${user.role} registered: ${user.name}`,
          timestamp: user.createdAt,
          data: user
        })),
        ...recentAppointments.map(apt => ({
          type: 'appointment',
          description: `Appointment ${apt.status}: ${apt.patient?.name} with ${apt.nakes?.name}`,
          timestamp: apt.createdAt,
          data: apt
        })),
        ...recentPayments.map(payment => ({
          type: 'payment',
          description: `Payment ${payment.status}: Rp ${payment.amount.toLocaleString()} by ${payment.user?.name}`,
          timestamp: payment.createdAt,
          data: payment
        })),
        ...recentReviews.map(review => ({
          type: 'review',
          description: `New review (${review.rating}★): ${review.patient?.name} reviewed ${review.nakes?.name}`,
          timestamp: review.createdAt,
          data: review
        }))
      ];

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedActivities = activities.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: limitedActivities
      });
    } catch (error) {
      console.error('Get recent activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent activities'
      });
    }
  }

  // User Management
  async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        status,
        verified,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (verified !== undefined) query.verified = verified === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const users = await User.find(query)
        .select('-password -refreshTokens')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  async getUserDetails(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password -refreshTokens')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get additional data based on user role
      let additionalData = {};
      
      if (user.role === 'nakes') {
        const nakesData = await Nakes.findOne({ user: userId }).lean();
        const appointmentCount = await Appointment.countDocuments({ nakes: userId });
        const reviewCount = await Review.countDocuments({ nakes: userId });
        const averageRating = await Review.aggregate([
          { $match: { nakes: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        additionalData = {
          nakesProfile: nakesData,
          stats: {
            appointments: appointmentCount,
            reviews: reviewCount,
            averageRating: averageRating[0]?.avgRating || 0
          }
        };
      } else if (user.role === 'patient') {
        const appointmentCount = await Appointment.countDocuments({ patient: userId });
        const reviewCount = await Review.countDocuments({ patient: userId });

        additionalData = {
          stats: {
            appointments: appointmentCount,
            reviews: reviewCount
          }
        };
      }

      res.json({
        success: true,
        data: {
          ...user,
          ...additionalData
        }
      });
    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user details'
      });
    }
  }

  async verifyUser(req, res) {
    try {
      const { userId } = req.params;
      const { verified, reason } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { verified, verifiedAt: verified ? new Date() : null },
        { new: true }
      ).select('-password -refreshTokens');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Log admin action
      await SecurityAuditLogger.logSecurityEvent({
        action: 'user_verification',
        userId: req.user.id,
        targetUserId: userId,
        details: { verified, reason },
        severity: 'medium'
      });

      // Send notification to user
      await Notification.create({
        user: userId,
        title: verified ? 'Account Verified' : 'Account Verification Revoked',
        message: verified 
          ? 'Your account has been verified by admin.'
          : `Your account verification has been revoked. Reason: ${reason}`,
        type: verified ? 'success' : 'warning'
      });

      res.json({
        success: true,
        message: `User ${verified ? 'verified' : 'unverified'} successfully`,
        data: user
      });
    } catch (error) {
      console.error('Verify user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify user'
      });
    }
  }

  async suspendUser(req, res) {
    try {
      const { userId } = req.params;
      const { suspended, reason, duration } = req.body;

      const suspendedUntil = suspended && duration 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        : null;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          suspended, 
          suspendedAt: suspended ? new Date() : null,
          suspendedUntil,
          suspensionReason: suspended ? reason : null
        },
        { new: true }
      ).select('-password -refreshTokens');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Log admin action
      await SecurityAuditLogger.logSecurityEvent({
        action: 'user_suspension',
        userId: req.user.id,
        targetUserId: userId,
        details: { suspended, reason, duration },
        severity: 'high'
      });

      // Send notification to user
      await Notification.create({
        user: userId,
        title: suspended ? 'Account Suspended' : 'Account Suspension Lifted',
        message: suspended 
          ? `Your account has been suspended. Reason: ${reason}${duration ? ` Duration: ${duration} days` : ''}`
          : 'Your account suspension has been lifted.',
        type: suspended ? 'error' : 'success'
      });

      res.json({
        success: true,
        message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`,
        data: user
      });
    } catch (error) {
      console.error('Suspend user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend user'
      });
    }
  }

  // Nakes Verification
  async getPendingNakesVerification(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const pendingNakes = await Nakes.find({ verified: false })
        .populate('user', 'name email phone createdAt')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Nakes.countDocuments({ verified: false });

      res.json({
        success: true,
        data: {
          nakes: pendingNakes,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      console.error('Get pending nakes verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending nakes verification'
      });
    }
  }

  async verifyNakes(req, res) {
    try {
      const { nakesId } = req.params;
      const { verified, reason, notes } = req.body;

      const nakes = await Nakes.findByIdAndUpdate(
        nakesId,
        { 
          verified, 
          verifiedAt: verified ? new Date() : null,
          verificationNotes: notes
        },
        { new: true }
      ).populate('user', 'name email');

      if (!nakes) {
        return res.status(404).json({
          success: false,
          message: 'Nakes not found'
        });
      }

      // Update user verification status
      await User.findByIdAndUpdate(
        nakes.user._id,
        { verified, verifiedAt: verified ? new Date() : null }
      );

      // Log admin action
      await SecurityAuditLogger.logSecurityEvent({
        action: 'nakes_verification',
        userId: req.user.id,
        targetUserId: nakes.user._id,
        details: { verified, reason, notes },
        severity: 'medium'
      });

      // Send notification to nakes
      await Notification.create({
        user: nakes.user._id,
        title: verified ? 'Nakes Verification Approved' : 'Nakes Verification Rejected',
        message: verified 
          ? 'Your Nakes profile has been verified. You can now offer services.'
          : `Your Nakes verification has been rejected. Reason: ${reason}`,
        type: verified ? 'success' : 'error'
      });

      res.json({
        success: true,
        message: `Nakes ${verified ? 'verified' : 'rejected'} successfully`,
        data: nakes
      });
    } catch (error) {
      console.error('Verify nakes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify nakes'
      });
    }
  }

  // Payment Management
  async getPayments(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        method,
        dateFrom,
        dateTo
      } = req.query;

      const query = {};
      if (status) query.status = status;
      if (method) query.method = method;
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      const payments = await Payment.find(query)
        .populate('user', 'name email')
        .populate('appointment', 'appointmentDate')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Payment.countDocuments(query);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payments'
      });
    }
  }

  // Service Management
  async getServices(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status,
        search
      } = req.query;

      const query = {};
      if (category) query.category = category;
      if (status) query.isActive = status === 'active';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const services = await Service.find(query)
        .populate('nakes', 'name specialization')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Service.countDocuments(query);

      res.json({
        success: true,
        data: {
          services,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get services'
      });
    }
  }

  async updateServiceStatus(req, res) {
    try {
      const { serviceId } = req.params;
      const { isActive, reason } = req.body;

      const service = await Service.findByIdAndUpdate(
        serviceId,
        { isActive },
        { new: true }
      ).populate('nakes', 'name');

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Log admin action
      await SecurityAuditLogger.logSecurityEvent({
        action: 'service_status_update',
        userId: req.user.id,
        details: { serviceId, isActive, reason },
        severity: 'medium'
      });

      // Send notification to nakes
      await Notification.create({
        user: service.nakes._id,
        title: `Service ${isActive ? 'Activated' : 'Deactivated'}`,
        message: `Your service "${service.name}" has been ${isActive ? 'activated' : 'deactivated'} by admin.${reason ? ` Reason: ${reason}` : ''}`,
        type: isActive ? 'success' : 'warning'
      });

      res.json({
        success: true,
        message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: service
      });
    } catch (error) {
      console.error('Update service status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update service status'
      });
    }
  }

  // Reports
  async getRevenueReport(req, res) {
    try {
      const { period, dateFrom, dateTo } = req.query;
      
      let startDate, endDate, groupBy;
      const now = new Date();

      switch (period) {
        case 'daily':
          startDate = dateFrom ? new Date(dateFrom) : new Date(now.setDate(now.getDate() - 30));
          endDate = dateTo ? new Date(dateTo) : new Date();
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case 'weekly':
          startDate = dateFrom ? new Date(dateFrom) : new Date(now.setDate(now.getDate() - 84));
          endDate = dateTo ? new Date(dateTo) : new Date();
          groupBy = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
          break;
        case 'monthly':
          startDate = dateFrom ? new Date(dateFrom) : new Date(now.setMonth(now.getMonth() - 12));
          endDate = dateTo ? new Date(dateTo) : new Date();
          groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        case 'yearly':
          startDate = dateFrom ? new Date(dateFrom) : new Date(now.setFullYear(now.getFullYear() - 5));
          endDate = dateTo ? new Date(dateTo) : new Date();
          groupBy = { $dateToString: { format: '%Y', date: '$createdAt' } };
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 30));
          endDate = new Date();
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const revenueData = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: groupBy,
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
      const totalTransactions = revenueData.reduce((sum, item) => sum + item.count, 0);

      res.json({
        success: true,
        data: {
          revenueData,
          summary: {
            totalRevenue,
            totalTransactions,
            averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
          }
        }
      });
    } catch (error) {
      console.error('Get revenue report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get revenue report'
      });
    }
  }

  async getUserReport(req, res) {
    try {
      const { period, dateFrom, dateTo, role } = req.query;
      
      let startDate, endDate, groupBy;
      const now = new Date();

      switch (period) {
        case 'daily':
          startDate = dateFrom ? new Date(dateFrom) : new Date(now.setDate(now.getDate() - 30));
          endDate = dateTo ? new Date(dateTo) : new Date();
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case 'weekly':
          startDate = dateFrom ? new Date(dateFrom) : new Date(now.setDate(now.getDate() - 84));
          endDate = dateTo ? new Date(dateTo) : new Date();
          groupBy = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
          break;
        case 'monthly':
          startDate = dateFrom ? new Date(dateFrom) : new Date(now.setMonth(now.getMonth() - 12));
          endDate = dateTo ? new Date(dateTo) : new Date();
          groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        case 'yearly':
          startDate = dateFrom ? new Date(dateFrom) : new Date(now.setFullYear(now.getFullYear() - 5));
          endDate = dateTo ? new Date(dateTo) : new Date();
          groupBy = { $dateToString: { format: '%Y', date: '$createdAt' } };
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 30));
          endDate = new Date();
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const query = {
        createdAt: { $gte: startDate, $lte: endDate }
      };
      if (role) query.role = role;

      const userData = await User.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              date: groupBy,
              role: '$role'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      // Transform data for easier consumption
      const transformedData = userData.reduce((acc, item) => {
        const date = item._id.date;
        const role = item._id.role;
        
        if (!acc[date]) {
          acc[date] = { date, patient: 0, nakes: 0, admin: 0, total: 0 };
        }
        
        acc[date][role] = item.count;
        acc[date].total += item.count;
        
        return acc;
      }, {});

      const userRegistrations = Object.values(transformedData);
      const totalUsers = userRegistrations.reduce((sum, item) => sum + item.total, 0);

      res.json({
        success: true,
        data: {
          userRegistrations,
          summary: {
            totalUsers,
            totalPatients: userRegistrations.reduce((sum, item) => sum + item.patient, 0),
            totalNakes: userRegistrations.reduce((sum, item) => sum + item.nakes, 0),
            totalAdmins: userRegistrations.reduce((sum, item) => sum + item.admin, 0)
          }
        }
      });
    } catch (error) {
      console.error('Get user report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user report'
      });
    }
  }
}

module.exports = new AdminController();