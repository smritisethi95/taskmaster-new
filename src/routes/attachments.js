import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import * as attachmentController from '../controllers/attachmentController.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post('/', upload.single('file'), attachmentController.uploadAttachment);
router.get('/', attachmentController.getAttachments);
router.get('/:id/download', attachmentController.downloadAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

export default router;
