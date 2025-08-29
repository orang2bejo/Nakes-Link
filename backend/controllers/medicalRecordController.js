const { MedicalRecord, User, Appointment, Service } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { sendNotification } = require('../services/notificationService');
const { encryptData, decryptData } = require('../utils/encryption');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/medical-records');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `medical-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// Create medical record
exports.createMedicalRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      patient_id,
      appointment_id,
      diagnosis,
      symptoms,
      treatment,
      prescription,
      notes,
      vital_signs,
      allergies,
      medical_history,
      follow_up_date,
      record_type = 'consultation',
      privacy_level = 'private'
    } = req.body;

    const nakes_id = req.user.id;

    // Verify appointment exists and belongs to this Nakes
    if (appointment_id) {
      const appointment = await Appointment.findOne({
        where: {
          id: appointment_id,
          nakes_id,
          status: { [Op.in]: ['confirmed', 'in_progress', 'completed'] }
        }
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found or not authorized'
        });
      }

      // Ensure patient_id matches appointment
      if (appointment.patient_id !== parseInt(patient_id)) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID does not match appointment'
        });
      }
    }

    // Verify patient exists
    const patient = await User.findOne({
      where: { id: patient_id, role: 'patient' }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Encrypt sensitive data
    const encryptedData = {
      diagnosis: diagnosis ? encryptData(diagnosis) : null,
      symptoms: symptoms ? encryptData(symptoms) : null,
      treatment: treatment ? encryptData(treatment) : null,
      prescription: prescription ? encryptData(prescription) : null,
      notes: notes ? encryptData(notes) : null,
      vital_signs: vital_signs ? encryptData(JSON.stringify(vital_signs)) : null,
      allergies: allergies ? encryptData(JSON.stringify(allergies)) : null,
      medical_history: medical_history ? encryptData(JSON.stringify(medical_history)) : null
    };

    // Create medical record
    const medicalRecord = await MedicalRecord.create({
      patient_id,
      nakes_id,
      appointment_id,
      record_type,
      privacy_level,
      follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
      ...encryptedData,
      created_by: nakes_id,
      status: 'active'
    });

    // Update appointment status if provided
    if (appointment_id) {
      await Appointment.update(
        { status: 'completed' },
        { where: { id: appointment_id } }
      );
    }

    // Send notification to patient
    await sendNotification({
      user_id: patient_id,
      type: 'medical_record_created',
      title: 'New Medical Record',
      message: 'A new medical record has been added to your profile',
      data: {
        record_id: medicalRecord.id,
        nakes_name: req.user.full_name,
        record_type
      }
    });

    // Load the created record with associations
    const createdRecord = await MedicalRecord.findByPk(medicalRecord.id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: { medical_record: createdRecord }
    });

  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get medical records
exports.getMedicalRecords = async (req, res) => {
  try {
    const {
      patient_id,
      record_type,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;

    const user_id = req.user.id;
    const user_role = req.user.role;
    const offset = (page - 1) * limit;

    let whereClause = { status: 'active' };

    // Role-based access control
    if (user_role === 'patient') {
      whereClause.patient_id = user_id;
    } else if (user_role === 'nakes') {
      if (patient_id) {
        whereClause.patient_id = patient_id;
        // Verify Nakes has access to this patient's records
        const hasAccess = await Appointment.findOne({
          where: {
            patient_id,
            nakes_id: user_id,
            status: { [Op.in]: ['confirmed', 'completed'] }
          }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to patient records'
          });
        }
      } else {
        whereClause.nakes_id = user_id;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (record_type) {
      whereClause.record_type = record_type;
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const records = await MedicalRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'full_name', 'email', 'date_of_birth']
        },
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date', 'status'],
          include: [
            {
              model: Service,
              as: 'service',
              attributes: ['id', 'name', 'category']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Decrypt sensitive data for authorized users
    const decryptedRecords = records.rows.map(record => {
      const recordData = record.toJSON();
      
      // Only decrypt if user has access
      if (user_role === 'patient' && recordData.patient_id === user_id ||
          user_role === 'nakes' && recordData.nakes_id === user_id) {
        try {
          if (recordData.diagnosis) recordData.diagnosis = decryptData(recordData.diagnosis);
          if (recordData.symptoms) recordData.symptoms = decryptData(recordData.symptoms);
          if (recordData.treatment) recordData.treatment = decryptData(recordData.treatment);
          if (recordData.prescription) recordData.prescription = decryptData(recordData.prescription);
          if (recordData.notes) recordData.notes = decryptData(recordData.notes);
          if (recordData.vital_signs) recordData.vital_signs = JSON.parse(decryptData(recordData.vital_signs));
          if (recordData.allergies) recordData.allergies = JSON.parse(decryptData(recordData.allergies));
          if (recordData.medical_history) recordData.medical_history = JSON.parse(decryptData(recordData.medical_history));
        } catch (decryptError) {
          console.error('Decryption error:', decryptError);
        }
      }
      
      return recordData;
    });

    res.json({
      success: true,
      data: {
        medical_records: decryptedRecords,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(records.count / limit),
          total_items: records.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single medical record
exports.getMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    const record = await MedicalRecord.findOne({
      where: { id, status: 'active' },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'full_name', 'email', 'date_of_birth', 'phone']
        },
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization', 'license_number']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date', 'status'],
          include: [
            {
              model: Service,
              as: 'service',
              attributes: ['id', 'name', 'category', 'description']
            }
          ]
        }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check access permissions
    const hasAccess = (
      (user_role === 'patient' && record.patient_id === user_id) ||
      (user_role === 'nakes' && record.nakes_id === user_id)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this medical record'
      });
    }

    // Decrypt sensitive data
    const recordData = record.toJSON();
    try {
      if (recordData.diagnosis) recordData.diagnosis = decryptData(recordData.diagnosis);
      if (recordData.symptoms) recordData.symptoms = decryptData(recordData.symptoms);
      if (recordData.treatment) recordData.treatment = decryptData(recordData.treatment);
      if (recordData.prescription) recordData.prescription = decryptData(recordData.prescription);
      if (recordData.notes) recordData.notes = decryptData(recordData.notes);
      if (recordData.vital_signs) recordData.vital_signs = JSON.parse(decryptData(recordData.vital_signs));
      if (recordData.allergies) recordData.allergies = JSON.parse(decryptData(recordData.allergies));
      if (recordData.medical_history) recordData.medical_history = JSON.parse(decryptData(recordData.medical_history));
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
    }

    res.json({
      success: true,
      data: { medical_record: recordData }
    });

  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update medical record
exports.updateMedicalRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      diagnosis,
      symptoms,
      treatment,
      prescription,
      notes,
      vital_signs,
      allergies,
      medical_history,
      follow_up_date
    } = req.body;

    const user_id = req.user.id;
    const user_role = req.user.role;

    // Find the record
    const record = await MedicalRecord.findOne({
      where: { id, status: 'active' }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Only the creating Nakes can update the record
    if (user_role !== 'nakes' || record.nakes_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creating healthcare provider can update this record'
      });
    }

    // Prepare update data with encryption
    const updateData = {
      updated_by: user_id,
      updated_at: new Date()
    };

    if (diagnosis !== undefined) updateData.diagnosis = diagnosis ? encryptData(diagnosis) : null;
    if (symptoms !== undefined) updateData.symptoms = symptoms ? encryptData(symptoms) : null;
    if (treatment !== undefined) updateData.treatment = treatment ? encryptData(treatment) : null;
    if (prescription !== undefined) updateData.prescription = prescription ? encryptData(prescription) : null;
    if (notes !== undefined) updateData.notes = notes ? encryptData(notes) : null;
    if (vital_signs !== undefined) updateData.vital_signs = vital_signs ? encryptData(JSON.stringify(vital_signs)) : null;
    if (allergies !== undefined) updateData.allergies = allergies ? encryptData(JSON.stringify(allergies)) : null;
    if (medical_history !== undefined) updateData.medical_history = medical_history ? encryptData(JSON.stringify(medical_history)) : null;
    if (follow_up_date !== undefined) updateData.follow_up_date = follow_up_date ? new Date(follow_up_date) : null;

    // Update the record
    await record.update(updateData);

    // Send notification to patient
    await sendNotification({
      user_id: record.patient_id,
      type: 'medical_record_updated',
      title: 'Medical Record Updated',
      message: 'Your medical record has been updated',
      data: {
        record_id: record.id,
        nakes_name: req.user.full_name
      }
    });

    // Load updated record with associations
    const updatedRecord = await MedicalRecord.findByPk(record.id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date', 'status']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: { medical_record: updatedRecord }
    });

  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload medical record attachment
exports.uploadAttachment = [upload.single('attachment'), async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const user_id = req.user.id;
    const user_role = req.user.role;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find the record
    const record = await MedicalRecord.findOne({
      where: { id, status: 'active' }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check access permissions
    const hasAccess = (
      (user_role === 'nakes' && record.nakes_id === user_id) ||
      (user_role === 'patient' && record.patient_id === user_id)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this medical record'
      });
    }

    // Add attachment to record
    const currentAttachments = record.attachments || [];
    const newAttachment = {
      id: Date.now().toString(),
      filename: req.file.filename,
      original_name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      description: description || '',
      uploaded_by: user_id,
      uploaded_at: new Date()
    };

    await record.update({
      attachments: [...currentAttachments, newAttachment],
      updated_by: user_id,
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: { attachment: newAttachment }
    });

  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// Delete medical record (soft delete)
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    // Find the record
    const record = await MedicalRecord.findOne({
      where: { id, status: 'active' }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Only the creating Nakes can delete the record
    if (user_role !== 'nakes' || record.nakes_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creating healthcare provider can delete this record'
      });
    }

    // Soft delete
    await record.update({
      status: 'deleted',
      deleted_by: user_id,
      deleted_at: new Date()
    });

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });

  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get medical record statistics
exports.getMedicalRecordStats = async (req, res) => {
  try {
    const { patient_id, start_date, end_date } = req.query;
    const user_id = req.user.id;
    const user_role = req.user.role;

    let whereClause = { status: 'active' };

    // Role-based access control
    if (user_role === 'patient') {
      whereClause.patient_id = user_id;
    } else if (user_role === 'nakes') {
      if (patient_id) {
        whereClause.patient_id = patient_id;
      } else {
        whereClause.nakes_id = user_id;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const [totalRecords, recordsByType] = await Promise.all([
      MedicalRecord.count({ where: whereClause }),
      MedicalRecord.findAll({
        where: whereClause,
        attributes: [
          'record_type',
          [MedicalRecord.sequelize.fn('COUNT', MedicalRecord.sequelize.col('id')), 'count']
        ],
        group: ['record_type']
      })
    ]);

    const stats = {
      total_records: totalRecords,
      records_by_type: recordsByType.reduce((acc, item) => {
        acc[item.record_type] = parseInt(item.dataValues.count);
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get medical record stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};