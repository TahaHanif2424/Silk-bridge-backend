const prisma = require('../lib/prisma');

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
