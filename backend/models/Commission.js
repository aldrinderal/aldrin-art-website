const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    commissionId: {
      type: String,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
      minlength: [7, 'Phone number must be at least 7 digits'],
      maxlength: [20, 'Phone number cannot exceed 20 digits']
    },
    size: {
      type: String,
      required: [true, 'Portrait size is required'],
      enum: {
        values: ['A4', 'A3', '8×10', '10×12', '12×16', 'Custom', 'Other'],
        message: '{VALUE} is not a supported portrait size'
      }
    },
    type: {
      type: String,
      required: [true, 'Drawing type is required'],
      enum: {
        values: [
          'Pencil Portrait',
          'Charcoal',
          'Black & White',
          'Colored Pencil',
          'Realistic Sketch',
          'Custom',
          'Other'
        ],
        message: '{VALUE} is not a supported drawing type'
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: ''
    },
    referenceImageUrl: {
      type: String,
      default: ''
    },
    cloudinaryPublicId: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true
    },
    adminNotes: {
      type: String,
      default: '',
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to generate human-friendly commission ID (e.g. ART-2026-94812)
commissionSchema.pre('save', function (next) {
  if (!this.commissionId) {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    this.commissionId = `ART-${year}-${random}`;
  }
  next();
});

const Commission = mongoose.model('Commission', commissionSchema);

module.exports = Commission;
