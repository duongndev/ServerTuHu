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


router.get("/province", getProvince)
router.get("/ward", getWards)   

router.post('/create', protect, createAddress);
router.get('/my', protect, getAddressesByUser);
router.get('/all', protect, getAllAddresses);
router.get('/:id', protect, getAddressById);
router.put('/update/:id', protect, updateAddress);
router.delete('/delete/:id', protect, deleteAddress);

export default router; 
