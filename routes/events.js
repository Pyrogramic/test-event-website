import express from 'express';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { authenticateToken, requireAdminOrOwner } from '../middleware/auth.js';

const router = express.Router();

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate('createdBy', 'userId')
      .sort({ eventDate: -1 });

    const upcomingEvents = events.filter(event => event.isUpcoming);
    const pastEvents = events.filter(event => !event.isUpcoming);

    res.json({
      upcoming: upcomingEvents,
      past: pastEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'userId');
    
    if (!event || !event.isActive) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (Admin/Owner only)
router.post('/', authenticateToken, requireAdminOrOwner, async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      registrationDeadline,
      registrationType,
      venue,
      maxParticipants
    } = req.body;

    const event = new Event({
      title,
      description,
      eventDate: new Date(eventDate),
      registrationDeadline: new Date(registrationDeadline),
      registrationType,
      venue,
      maxParticipants: maxParticipants || null,
      createdBy: req.user._id
    });

    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (Admin/Owner only)
router.put('/:id', authenticateToken, requireAdminOrOwner, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can edit this event
    if (req.user.role === 'admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(event, req.body);
    await event.save();

    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (Admin/Owner only)
router.delete('/:id', authenticateToken, requireAdminOrOwner, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can delete this event
    if (req.user.role === 'admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    event.isActive = false;
    await event.save();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;