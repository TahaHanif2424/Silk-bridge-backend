const prisma = require('../lib/prisma');
const { sendAdminNotificationEmail, sendEmailGracefully } = require('../lib/mail');

exports.createApplication = async (req, res) => {
  try {
    const { company, license, email, website, instagram } = req.body;
    const userId = req.user ? req.user.id : null;
    
    if (!company || !email) {
      return res.status(400).json({ message: 'Please provide company name and email' });
    }

    const application = await prisma.application.create({
      data: {
        userId,
        company,
        license,
        email,
        website,
        instagram
      }
    });

    // Send actual email notification to admin via configured SMTP (fails gracefully if not configured)
    try {
      await sendAdminNotificationEmail(application);
    } catch (mailErr) {
      console.error('[SMTP WARNING] Admin notification email failed:', mailErr);
    }

    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { submitted: 'desc' }
    });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tierId } = req.body;
    
    // Only update provided fields
    const data = {};
    if (status) data.status = status;
    if (tierId) data.tierId = tierId;

    const application = await prisma.application.update({
      where: { id },
      data
    });
    
    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    if (!to || !to.trim()) {
      return res.status(400).json({ message: 'Recipient email address is required' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Email subject is required' });
    }

    const sent = await sendEmailGracefully({
      to: to.trim(),
      subject: subject.trim(),
      html: html || undefined,
      text: text || undefined,
    });

    res.status(200).json({
      success: true,
      message: sent ? 'Email sent successfully via SMTP' : 'Email dispatched (SMTP unconfigured; logged to server console)',
      recipient: to,
    });
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
};

