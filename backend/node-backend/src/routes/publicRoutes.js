const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// No auth — public marketing data for the homepage
router.get('/recent-activity', publicController.getRecentActivity);

module.exports = router;