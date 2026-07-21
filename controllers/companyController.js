// Mock DB
let companies = [
  { id: '1', name: 'Elite Travels', license: 'TRV-8910', targetVolume: '$100k', email: 'hello@elitetravels.com', tier: 'gold', status: 'approved' },
];

exports.getCompanies = async (req, res) => {
  res.status(200).json(companies);
};

exports.getCompanyById = async (req, res) => {
  const company = companies.find(c => c.id === req.params.id);
  if (company) {
    res.status(200).json(company);
  } else {
    res.status(404).json({ message: 'Company not found' });
  }
};

exports.createCompany = async (req, res) => {
  const newCompany = { id: String(Date.now()), ...req.body, status: 'pending' };
  companies.push(newCompany);
  res.status(201).json(newCompany);
};

exports.updateCompany = async (req, res) => {
  const index = companies.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    companies[index] = { ...companies[index], ...req.body };
    res.status(200).json(companies[index]);
  } else {
    res.status(404).json({ message: 'Company not found' });
  }
};

exports.deleteCompany = async (req, res) => {
  companies = companies.filter(c => c.id !== req.params.id);
  res.status(200).json({ message: 'Company removed' });
};