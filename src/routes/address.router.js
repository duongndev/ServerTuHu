import express from 'express';
const router = express.Router();
import {
    createAddress,
    getProvince,
    getWards,
    getAddressesByUser,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress
} from '../controllers/address.controller.js';
import { protect } from '../middlewares/auth.middleware.js';   
import { burstProtection } from '../middlewares/rateLimiting.middleware.js';


router.get("/province", burstProtection, getProvince)
router.get("/ward", burstProtection, getWards)   

router.post('/create', protect, burstProtection, createAddress);
router.get('/my', protect, burstProtection, getAddressesByUser);
router.get('/all', protect, burstProtection, getAllAddresses);
router.get('/:id', protect, burstProtection, getAddressById);
router.put('/update/:id', protect, burstProtection, updateAddress);
router.delete('/delete/:id', protect, burstProtection, deleteAddress);

export default router; 
