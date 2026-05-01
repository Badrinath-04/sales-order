const { Router } = require('express')
const { z } = require('zod')
const ctrl = require('./branches.controller')
const { authenticate, requireSuperAdmin, enforceBranchScope } = require('../../middleware/auth')
const validate = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

const createBranchSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    code: z.string().min(1, 'code is required'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
}

const createClassSchema = {
  body: z.object({
    grade: z.number().int().min(-2).max(10),
    section: z.string().min(1),
    academicYear: z.string().optional(),
  }),
}

router.get('/', ctrl.list)
router.post('/', requireSuperAdmin, validate(createBranchSchema), ctrl.create)
router.get('/:branchId', enforceBranchScope, ctrl.getOne)
router.patch('/:branchId', requireSuperAdmin, ctrl.update)
router.get('/:branchId/kpis', enforceBranchScope, ctrl.getKpis)
router.get('/:branchId/classes', enforceBranchScope, ctrl.getClasses)
router.post('/:branchId/classes', requireSuperAdmin, validate(createClassSchema), ctrl.createClass)
router.get('/:branchId/classes/:classId/students', enforceBranchScope, ctrl.getStudents)
router.post('/:branchId/students', enforceBranchScope, ctrl.createStudent)
router.post('/:branchId/students/bulk', requireSuperAdmin, ctrl.bulkCreateStudents)
router.delete('/:branchId', requireSuperAdmin, ctrl.remove)

module.exports = router
