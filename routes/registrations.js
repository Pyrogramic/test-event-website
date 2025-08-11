import express from 'express';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { sendApprovalEmail } from '../utils/emailService.js';

const router = express.Router();

// Student registration
router.post('/', async (req, res) => {
  try {
    const {
      eventId,
      studentName,
      studentEmail,
      studentId,
      department,
      year,
      phone,
      groupMembers
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isRegistrationOpen) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      $or: [
        { studentEmail },
        { studentId }
      ]
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const registration = new Registration({
      event: eventId,
      studentName,
      studentEmail,
      studentId,
      department,
      year,
      phone,
      groupMembers: event.registrationType === 'group' ? groupMembers : []
    });

    await registration.save();
    res.status(201).json({ 
      message: 'Registration successful! You will receive an email once approved.',
      registration
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;