const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/publicController');

router.get('/home', ctrl.getHomeData);
router.get('/events', ctrl.getPublicEvents);
router.get('/events/:slug', optionalAuth, ctrl.getEventBySlug);
router.get('/news', ctrl.getPublicNews);
router.get('/news/:slug', ctrl.getNewsBySlug);
router.get('/disciplines', ctrl.getDisciplines);
router.get('/rankings', ctrl.getRankings);
router.get('/calendar', ctrl.getCalendarEvents);
router.get('/gallery', ctrl.getGallery);
router.get('/partners', ctrl.getPartners);
router.get('/faq', ctrl.getFAQ);
router.post('/contact', ctrl.submitContact);

module.exports = router;
