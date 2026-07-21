const express = require('express');
const router = express.Router();
const { getPackages, getPackageById, createPackage, updatePackage, deletePackage } = require('../controllers/packageController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/')
  .get(protect, getPackages)
  .post(protect, adminOnly, createPackage);

router.route('/:id')
  .get(protect, getPackageById)
  .put(protect, adminOnly, updatePackage)
  .delete(protect, adminOnly, deletePackage);

module.exports = router;