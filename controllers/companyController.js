const prisma = require('../lib/prisma');

// Retrieves approved or all partner companies from Applications
exports.getCompanies = async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { submitted: 'desc' }
    });

    const companies = applications.map(app => ({
      id: app.id,
      name: app.company,
      license: app.license || '',
      email: app.email,
      website: app.website || '',
      instagram: app.instagram || '',
      tier: app.tierId || 'silver',
      status: app.status || 'pending',
      submitted: app.submitted
    }));

    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const app = await prisma.application.findUnique({
      where: { id: req.params.id }
    });

    if (!app) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({
      id: app.id,
      name: app.company,
      license: app.license || '',
      email: app.email,
      website: app.website || '',
      instagram: app.instagram || '',
      tier: app.tierId || 'silver',
      status: app.status || 'pending',
      submitted: app.submitted
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const { name, company, license, email, website, instagram } = req.body;
    const companyName = name || company;

    if (!companyName || !email) {
      return res.status(400).json({ message: 'Please provide company name and email' });
    }

    const application = await prisma.application.create({
      data: {
        company: companyName,
        license,
        email,
        website,
        instagram,
        status: 'pending',
        tierId: 'silver'
      }
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { name, company, license, email, website, instagram, status, tier } = req.body;
    const data = {};
    if (name || company) data.company = name || company;
    if (license !== undefined) data.license = license;
    if (email !== undefined) data.email = email;
    if (website !== undefined) data.website = website;
    if (instagram !== undefined) data.instagram = instagram;
    if (status !== undefined) data.status = status;
    if (tier !== undefined) data.tierId = tier;

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data
    });

    res.status(200).json(application);
  } catch (error) {
    res.status(404).json({ message: 'Company not found or update failed' });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    await prisma.application.delete({
      where: { id: req.params.id }
    });
    res.status(200).json({ message: 'Company removed' });
  } catch (error) {
    res.status(404).json({ message: 'Company not found or delete failed' });
  }
};