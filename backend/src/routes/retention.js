import { Router } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import RetentionActivity from '../models/RetentionActivity.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const TYPES = ['Follow-up', 'Special Offer', 'Loyalty Reward', 'Feedback Review', 'Check-in', 'Other'];
const STATUSES = ['Planned', 'Completed', 'Cancelled'];
router.use(requireAuth);

function visibleToUser(user) {
  return user.role === 'Admin' ? {} : { staff: user._id };
}

async function populateActivity(query) {
  return query.populate('customer', 'name email phone status')
    .populate('staff', 'name email role');
}

router.get('/', async (req, res, next) => {
  try {
    const activities = await populateActivity(
      RetentionActivity.find(visibleToUser(req.user)).sort({ date: -1, createdAt: -1 })
    );
    res.json({ count: activities.length, activities });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { customer, type, description, date } = req.body ?? {};
    if (!mongoose.isValidObjectId(customer) || !TYPES.includes(type) ||
        typeof description !== 'string' || !description.trim() || description.trim().length > 5000) {
      return res.status(400).json({ message: 'Provide a valid customer, activity type and description' });
    }
    let activityDate = new Date();
    if (date !== undefined) {
      activityDate = new Date(date);
      if (Number.isNaN(activityDate.getTime())) return res.status(400).json({ message: 'Invalid activity date' });
    }
    const customerFilter = { _id: customer, ...(req.user.role === 'Admin' ? {} : { assignedTo: req.user._id }) };
    const customerRecord = await Customer.findOne(customerFilter).select('_id');
    if (!customerRecord) return res.status(404).json({ message: 'Customer not found' });
    const created = await RetentionActivity.create({ customer, staff: req.user._id, type, description: description.trim(), date: activityDate, status: 'Planned' });
    const activity = await populateActivity(RetentionActivity.findById(created._id));
    res.status(201).json({ message: 'Retention activity created successfully', activity });
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Retention activity not found' });
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid retention activity status' });
    const activity = await RetentionActivity.findOne({ _id: req.params.id, ...visibleToUser(req.user) });
    if (!activity) return res.status(404).json({ message: 'Retention activity not found' });
    activity.status = status;
    await activity.save();
    res.json({ message: 'Retention activity status updated successfully', activity: await populateActivity(RetentionActivity.findById(activity._id)) });
  } catch (err) { next(err); }
});

export default router;
