// src/routes/certificateRoutes.js
import express from 'express';
import { getCertificatesByMlt } from '../controllers/certificateController.js';

const router = express.Router();

// Public endpoint to fetch certificates for a given MLT
router.get('/mlt/:mltId', getCertificatesByMlt);

export default router;
