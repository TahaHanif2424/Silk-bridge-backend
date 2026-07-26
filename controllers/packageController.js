const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getPackages = async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // The frontend will receive netPrice and retailPrice
    // Margin is simply retailPrice - netPrice
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPackageById = async (req, res) => {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: req.params.id }
    });
    
    if (pkg) {
      res.status(200).json(pkg);
    } else {
      res.status(404).json({ message: 'Package not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPackage = async (req, res) => {
  try {
    const { id, baseNetCost, ...cleanData } = req.body;
    
    if (cleanData.duration !== undefined && cleanData.duration !== null) {
      cleanData.duration = parseInt(cleanData.duration, 10);
    }
    if (cleanData.inventory !== undefined && cleanData.inventory !== null) {
      cleanData.inventory = parseInt(cleanData.inventory, 10);
    }
    if (cleanData.netPrice !== undefined && cleanData.netPrice !== null) {
      cleanData.netPrice = parseFloat(cleanData.netPrice);
    }
    if (cleanData.retailPrice !== undefined && cleanData.retailPrice !== null) {
      cleanData.retailPrice = parseFloat(cleanData.retailPrice);
    }

    const newPkg = await prisma.package.create({
      data: cleanData
    });
    res.status(201).json(newPkg);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const { id, baseNetCost, ...cleanData } = req.body;

    if (cleanData.duration !== undefined && cleanData.duration !== null) {
      cleanData.duration = parseInt(cleanData.duration, 10);
    }
    if (cleanData.inventory !== undefined && cleanData.inventory !== null) {
      cleanData.inventory = parseInt(cleanData.inventory, 10);
    }
    if (cleanData.netPrice !== undefined && cleanData.netPrice !== null) {
      cleanData.netPrice = parseFloat(cleanData.netPrice);
    }
    if (cleanData.retailPrice !== undefined && cleanData.retailPrice !== null) {
      cleanData.retailPrice = parseFloat(cleanData.retailPrice);
    }

    const updatedPkg = await prisma.package.update({
      where: { id: req.params.id },
      data: cleanData
    });
    res.status(200).json(updatedPkg);
  } catch (error) {
    res.status(404).json({ message: 'Package not found or update failed', error: error.message });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    await prisma.package.delete({
      where: { id: req.params.id }
    });
    res.status(200).json({ message: 'Package removed' });
  } catch (error) {
    res.status(404).json({ message: 'Package not found or delete failed' });
  }
};