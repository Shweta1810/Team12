import { Router } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// The engagement screens need a scoped customer list. Customer creation and
// editing remain in the existing CRM workflow rather than being duplicated here.
router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { assignedTo: req.user._id };
    const customers = await Customer.find(filter)
      .select('name email phone status assignedTo')
      .sort({ name: 1 })
      .lean();
    res.json({ count: customers.length, customers });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Customer not found' });
    const filter = { _id: req.params.id, ...(req.user.role === 'Admin' ? {} : { assignedTo: req.user._id }) };
    const customer = await Customer.findOne(filter).select('name email phone status assignedTo').lean();
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ customer });
  } catch (err) { next(err); }
});

export default router;
