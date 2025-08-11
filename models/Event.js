import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  registrationType: {
    type: String,
    enum: ['individual', 'group'],
    required: true,
    default: 'individual'
  },
  venue: {
    type: String,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

eventSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.eventDate;
});

eventSchema.virtual('isRegistrationOpen').get(function() {
  return new Date() < this.registrationDeadline;
});

eventSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Event', eventSchema);