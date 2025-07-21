const router = require('express').Router();
const addressController = require('../controllers/address.controller');
const { protect } = require('../middlewares/auth.middleware');


router.get("/province", addressController.getProvince)
router.get("/ward", addressController.getWards)

router.post('/create', protect, addressController.createAddress);
router.get('/my', protect, addressController.getAddressesByUser);
router.get('/all', protect, addressController.getAllAddresses);
router.get('/:id', protect, addressController.getAddressById);
router.put('/update/:id', protect, addressController.updateAddress);
router.delete('/delete/:id', protect, addressController.deleteAddress);

module.exports = router; 