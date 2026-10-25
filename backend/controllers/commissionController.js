const Commission = require('../models/Commission');
const { uploadImageStream, deleteImage, isConfigured: isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Public: Submit a new commission request
 * POST /api/commissions
 */
const createCommission = async (req, res, next) => {
  let uploadedCloudinary = null;

  try {
    const { name, email, phone, mobile, size, type, description } = req.body;
    const finalPhone = (phone || mobile || '').trim();

    // Required field validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!finalPhone) {
      return res.status(400).json({ success: false, message: 'Phone / mobile number is required.' });
    }
    if (!size || size === 'Select Portrait Size') {
      return res.status(400).json({ success: false, message: 'Please select a valid portrait size.' });
    }
    if (!type || type === 'Select Drawing Type') {
      return res.status(400).json({ success: false, message: 'Please select a valid drawing type.' });
    }

    let referenceImageUrl = '';
    let cloudinaryPublicId = '';

    // Handle optional reference image upload
    if (req.file) {
      if (isCloudinaryConfigured()) {
        try {
          uploadedCloudinary = await uploadImageStream(req.file.buffer, {
            folder: 'aldrin_art_commissions',
            tags: ['customer_commission', 'reference_photo']
          });
          referenceImageUrl = uploadedCloudinary.secure_url || uploadedCloudinary.url;
          cloudinaryPublicId = uploadedCloudinary.public_id;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError.message);
          return res.status(502).json({
            success: false,
            message: 'Failed to upload reference image to cloud storage. Please try again or check file format.'
          });
        }
      } else {
        console.warn('⚠️ Cloudinary is not configured. Saving commission without uploading reference photo to Cloudinary.');
      }
    }

    // Create MongoDB document
    const newCommission = new Commission({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: finalPhone,
      size,
      type,
      description: (description || '').trim(),
      referenceImageUrl,
      cloudinaryPublicId,
      status: 'Pending'
    });

    const savedCommission = await newCommission.save();

    return res.status(201).json({
      success: true,
      message: 'Your commission request has been received! Aldrin will review it and contact you soon.',
      commissionId: savedCommission.commissionId,
      data: {
        id: savedCommission._id,
        commissionId: savedCommission.commissionId,
        name: savedCommission.name,
        email: savedCommission.email,
        size: savedCommission.size,
        type: savedCommission.type,
        hasReferenceImage: Boolean(savedCommission.referenceImageUrl),
        createdAt: savedCommission.createdAt
      }
    });
  } catch (error) {
    // If MongoDB saving failed after Cloudinary upload, remove the orphan Cloudinary image
    if (uploadedCloudinary && uploadedCloudinary.public_id) {
      await deleteImage(uploadedCloudinary.public_id).catch(() => {});
    }
    next(error);
  }
};

/**
 * Admin: Get all commissions with optional search & filter
 * GET /api/commissions
 */
const getCommissions = async (req, res, next) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { commissionId: regex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [commissions, totalCount] = await Promise.all([
      Commission.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Commission.countDocuments(query)
    ]);

    // Status counts for dashboard metrics
    const [pendingCount, inProgressCount, completedCount, cancelledCount] = await Promise.all([
      Commission.countDocuments({ status: 'Pending' }),
      Commission.countDocuments({ status: 'In Progress' }),
      Commission.countDocuments({ status: 'Completed' }),
      Commission.countDocuments({ status: 'Cancelled' })
    ]);

    return res.status(200).json({
      success: true,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      counts: {
        all: totalCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount
      },
      commissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get a single commission by ID or commissionId
 * GET /api/commissions/:id
 */
const getCommissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let commission = null;

    if (id.startsWith('ART-')) {
      commission = await Commission.findOne({ commissionId: id });
    } else {
      commission = await Commission.findById(id);
    }

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found.'
      });
    }

    return res.status(200).json({
      success: true,
      commission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update commission status and notes
 * PATCH /api/commissions/:id/status
 */
const updateCommissionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (typeof adminNotes === 'string') updateFields.adminNotes = adminNotes;

    const commission = await Commission.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Commission status updated to "${commission.status}".`,
      commission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Delete a commission and its Cloudinary photo
 * DELETE /api/commissions/:id
 */
const deleteCommission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const commission = await Commission.findById(id);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found.'
      });
    }

    // Safely delete Cloudinary photo if present
    if (commission.cloudinaryPublicId) {
      await deleteImage(commission.cloudinaryPublicId);
    }

    await Commission.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Commission ${commission.commissionId || id} and associated reference photo deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCommission,
  getCommissions,
  getCommissionById,
  updateCommissionStatus,
  deleteCommission
};
