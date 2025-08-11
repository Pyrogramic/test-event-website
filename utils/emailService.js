import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendApprovalEmail = async (registration) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: registration.studentEmail,
    subject: `Registration Approved: ${registration.event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Registration Approved!</h2>
        <p>Dear ${registration.studentName},</p>
        <p>Your registration for <strong>${registration.event.title}</strong> has been approved.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Event Details:</h3>
          <p><strong>Event:</strong> ${registration.event.title}</p>
          <p><strong>Date:</strong> ${new Date(registration.event.eventDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(registration.event.eventDate).toLocaleTimeString()}</p>
          <p><strong>Venue:</strong> ${registration.event.venue || 'TBD'}</p>
        </div>
        
        <p>Please make sure to attend the event on time. If you have any questions, feel free to contact us.</p>
        <p>Best regards,<br>Event Management Team</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};