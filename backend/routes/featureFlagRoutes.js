import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import asyncHandler from 'express-async-handler'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

const featuresFilePath = path.join(path.resolve(), 'features.json')

// @desc    Get all feature flags
// @route   GET /api/feature-flags
// @access  Private/Admin
router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const raw = await fs.readFile(featuresFilePath, 'utf-8')
  res.json(JSON.parse(raw))
}))

// @desc    Get a single feature flag by name
// @route   GET /api/feature-flags/:name
// @access  Public
router.get('/:name', asyncHandler(async (req, res) => {
  const raw = await fs.readFile(featuresFilePath, 'utf-8')
  const flags = JSON.parse(raw)
  const flag = flags[req.params.name]
  if (!flag) {
    res.status(404)
    throw new Error(`Feature flag '${req.params.name}' not found`)
  }
  res.json({ [req.params.name]: flag })
}))

export default router
