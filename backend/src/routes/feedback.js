import { Router } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Feedback from '../models/Feedback.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const TYPES = ['Feedback', 'Complaint', 'Issue'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High'];
router.use(requireAuth);

function visibleToUser(user) {
  return user.role === 'Admin' ? {} : { staff: user._id };
}

async function populateFeedback(query) {
  return query.populate('customer', 'name email phone status')
    .populate('staff', 'name email role');
}

router.get('/', async (req, res, next) => {
  try {
    const feedback = await populateFeedback(
      Feedback.find(visibleToUser(req.user)).sort({ createdAt: -1 })
    );
    res.json({ count: feedback.length, feedback });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { customer, type, subject, description, priority = 'Medium' } = req.body ?? {};
    if (!mongoose.isValidObjectId(customer) || !TYPES.includes(type) ||
        typeof subject !== 'string' || !subject.trim() || subject.trim().length > 160 ||
        typeof description !== 'string' || !description.trim() || description.trim().length > 5000 ||
        !PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Provide a valid customer, type, subject, description and priority' });
    }
    const customerFilter = { _id: customer, ...(req.user.role === 'Admin' ? {} : { assignedTo: req.user._id }) };
    const customerRecord = await Customer.findOne(customerFilter).select('_id');
    if (!customerRecord) return res.status(404).json({ message: 'Customer not found' });
    const created = await Feedback.create({ customer, staff: req.user._id, type, subject: subject.trim(), description: description.trim(), priority, status: 'Open' });
    const feedback = await populateFeedback(Feedback.findById(created._id));
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Feedback not found' });
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid feedback status' });
    const feedback = await Feedback.findOne({ _id: req.params.id, ...visibleToUser(req.user) });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    feedback.status = status;
    await feedback.save();
    res.json({ message: 'Feedback status updated successfully', feedback: await populateFeedback(Feedback.findById(feedback._id)) });
  } catch (err) { next(err); }
});

export default router;
