
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ''
    },
    source: {
      type: String,
      enum: [
        'Website',
        'Social Media',
        'Referral',
        'Advertisement',
        'Campaign',
        'Other'
      ],
      default: 'Other'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model('Customer', customerSchema);
