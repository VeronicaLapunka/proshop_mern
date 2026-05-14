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

// @desc    Update feature flag status
// @route   PATCH /api/feature-flags/:name/status
// @access  Private/Admin
router.patch('/:name/status', protect, admin, asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['Enabled', 'Disabled', 'Testing'].includes(status)) {
    res.status(400)
    throw new Error('Invalid status. Must be Enabled, Disabled, or Testing.')
  }
  const raw = await fs.readFile(featuresFilePath, 'utf-8')
  const flags = JSON.parse(raw)
  if (!flags[req.params.name]) {
    res.status(404)
    throw new Error(`Feature flag '${req.params.name}' not found`)
  }
  flags[req.params.name].status = status
  flags[req.params.name].last_modified = new Date().toISOString().split('T')[0]
  await fs.writeFile(featuresFilePath, JSON.stringify(flags, null, 2))
  res.json({ feature_id: req.params.name, ...flags[req.params.name] })
}))

// @desc    Update feature flag traffic percentage
// @route   PATCH /api/feature-flags/:name/traffic
// @access  Private/Admin
router.patch('/:name/traffic', protect, admin, asyncHandler(async (req, res) => {
  const pct = Number(req.body.traffic_percentage)
  if (isNaN(pct) || pct < 0 || pct > 100) {
    res.status(400)
    throw new Error('traffic_percentage must be a number between 0 and 100.')
  }
  const raw = await fs.readFile(featuresFilePath, 'utf-8')
  const flags = JSON.parse(raw)
  if (!flags[req.params.name]) {
    res.status(404)
    throw new Error(`Feature flag '${req.params.name}' not found`)
  }
  flags[req.params.name].traffic_percentage = pct
  flags[req.params.name].last_modified = new Date().toISOString().split('T')[0]
  await fs.writeFile(featuresFilePath, JSON.stringify(flags, null, 2))
  res.json({ feature_id: req.params.name, ...flags[req.params.name] })
}))

export default router
