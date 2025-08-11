import express from 'express';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authenticateToken, requireAdminOrOwner, requireOwner } from '../middleware/auth.js';
import { sendApprovalEmail } from '../utils/emailService.js';

const router = express.Router();

// Get all registrations (Admin/Owner)
router.get('/registrations', authenticateToken, requireAdminOrOwner, async (req, res) => {
  try {
    let query = {};
    
    // If admin, only show registrations for their events
    if (req.user.role === 'admin') {
      const adminEvents = await Event.find({ createdBy: req.user._id });
      query.event = { $in: adminEvents.map(e => e._id) };
    }

    const registrations = await Registration.find(query)
      .populate('event', 'title eventDate registrationType')
      .sort({ createdAt: -1 });

    // Group by department
    const groupedByDept = registrations.reduce((acc, reg) => {
      if (!acc[reg.department]) {
        acc[reg.department] = [];
      }
      acc[reg.department].push(reg);
      return acc;
    }, {});

    res.json({
      all: registrations,
      byDepartment: groupedByDept
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Decline registration
router.patch('/registrations/:id/status', authenticateToken, requireAdminOrOwner, async (req, res) => {
  try {
    const { status } = req.body;
    const registration = await Registration.findById(req.params.id)
      .populate('event');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check if admin can approve this registration
    if (req.user.role === 'admin' && 
        registration.event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    registration.status = status;
    registration.approvedBy = req.user._id;
    registration.approvedAt = new Date();

    await registration.save();

    // Send email if approved
    if (status === 'approved' && !registration.emailSent) {
      try {
        await sendApprovalEmail(registration);
        registration.emailSent = true;
        await registration.save();
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    res.json({ message: `Registration ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', authenticateToken, requireAdminOrOwner, async (req, res) => {
  try {
    let eventQuery = {};
    if (req.user.role === 'admin') {
      eventQuery.createdBy = req.user._id;
    }

    const totalEvents = await Event.countDocuments({ ...eventQuery, isActive: true });
    const upcomingEvents = await Event.countDocuments({
      ...eventQuery,
      isActive: true,
      eventDate: { $gt: new Date() }
    });

    let registrationQuery = {};
    if (req.user.role === 'admin') {
      const adminEvents = await Event.find(eventQuery);
      registrationQuery.event = { $in: adminEvents.map(e => e._id) };
    }

    const totalRegistrations = await Registration.countDocuments(registrationQuery);
    const pendingRegistrations = await Registration.countDocuments({
      ...registrationQuery,
      status: 'pending'
    });

    res.json({
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      pendingRegistrations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all admins (Owner only)
router.get('/admins', authenticateToken, requireOwner, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('userId isActive createdAt')
      .sort({ createdAt: -1 });
    
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle admin status (Owner only)
router.patch('/admins/:id/toggle', authenticateToken, requireOwner, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({ message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;