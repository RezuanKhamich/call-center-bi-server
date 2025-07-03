import express from 'express'
import multer from 'multer'
import { parseExcelFile } from '../controllers/fileController.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

router.post('/upload', upload.single('file'), parseExcelFile)

export default router
