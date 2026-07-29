const express = require('express');
const router = express.Router();
const { getPackages, getPackageById, createPackage, updatePackage, deletePackage } = require('../controllers/packageController');
const { protect, optionalProtect, adminOnly } = require('../middleware/auth');

router.route('/')
  .get(optionalProtect, getPackages)
  .post(protect, adminOnly, createPackage);

router.route('/:id')
  .get(optionalProtect, getPackageById)
  .put(protect, adminOnly, updatePackage)
  .delete(protect, adminOnly, deletePackage);

module.exports = router;