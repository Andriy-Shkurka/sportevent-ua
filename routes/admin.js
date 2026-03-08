const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/adminController');

router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/stats', ctrl.getDashboardStats);

// Users
router.get('/users', ctrl.getUsers);
router.get('/users/:id', ctrl.getUser);
router.put('/users/:id', ctrl.updateUser);
router.patch('/users/:id/toggle-block', ctrl.toggleUserBlock);
router.post('/users/ban-by-email', ctrl.banByEmail);
router.delete('/users/:id', ctrl.deleteUser);

// Events
router.get('/events', ctrl.getEvents);
router.post('/events', ctrl.createEvent);
router.put('/events/:id', ctrl.updateEvent);
router.delete('/events/:id', ctrl.deleteEvent);

// News
router.get('/news', ctrl.getNews);
router.post('/news', upload.single('cover_image'), ctrl.createNews);
router.put('/news/:id', upload.single('cover_image'), ctrl.updateNews);
router.delete('/news/:id', ctrl.deleteNews);

// Registrations
router.get('/registrations', ctrl.getRegistrations);
router.patch('/registrations/:id/status', ctrl.updateRegistrationStatus);

// Results
router.get('/results', ctrl.getResults);
router.post('/results', ctrl.addResult);
router.put('/results/:id', ctrl.updateResult);
router.delete('/results/:id', ctrl.deleteResult);

// Disciplines
router.get('/disciplines', ctrl.getDisciplines);
router.post('/disciplines', ctrl.createDiscipline);

// Locations
router.get('/locations', ctrl.getLocations);
router.post('/locations', ctrl.createLocation);

// Reports
router.get('/reports', ctrl.getReports);

// Contacts
router.get('/contacts', ctrl.getContactMessages);
router.patch('/contacts/:id', ctrl.replyContactMessage);

// Media
router.get('/media', ctrl.getMedia);
router.post('/media', upload.single('file'), ctrl.uploadMedia);
router.delete('/media/:id', ctrl.deleteMedia);
router.post('/media/:id/crop', ctrl.cropMedia);

// Contacts (additional)
router.delete('/contacts/:id', ctrl.deleteContact);

module.exports = router;
