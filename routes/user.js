const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAthlete } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/userController');

router.use(authenticateToken, requireAthlete);

router.get('/profile', ctrl.getProfile);
router.put('/profile', upload.single('avatar'), ctrl.updateProfile);

router.get('/registrations', ctrl.getMyRegistrations);
router.post('/registrations', ctrl.registerForEvent);
router.delete('/registrations/:id', ctrl.withdrawRegistration);

router.get('/results', ctrl.getMyResults);

router.get('/notifications', ctrl.getNotifications);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);
router.patch('/notifications/read-all', ctrl.markAllNotificationsRead);

router.get('/team-members', ctrl.getTeamMembers);
router.post('/team-members', ctrl.addTeamMember);
router.put('/team-members/:id', ctrl.updateTeamMember);
router.delete('/team-members/:id', ctrl.deleteTeamMember);

router.delete('/account', ctrl.deleteAccount);

module.exports = router;
