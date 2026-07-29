const prisma = require('../lib/prisma');

exports.getTiers = async (req, res) => {
  try {
    const tiers = await prisma.tier.findMany();
    res.status(200).json(tiers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, discountPct, color } = req.body;
    
    const tier = await prisma.tier.update({
      where: { id },
      data: { name, discountPct, color }
    });
    
    res.status(200).json(tier);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
