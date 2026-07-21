const express = require('express');
const router = express.Router();
const { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getCompanies)
  .post(createCompany); // public to apply

router.route('/:id')
  .get(protect, getCompanyById)
  .put(protect, updateCompany)
  .delete(protect, deleteCompany);

module.exports = router;