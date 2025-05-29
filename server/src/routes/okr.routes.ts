import { Router } from 'express';
import { 
  createObjective,
  getTeamObjectives,
  updateObjective,
  deleteObjective,
  updateKeyResult,
  deleteKeyResult,
  assignObjectiveToUser
} from '../controllers/okr.controller';
import { validate } from '../middleware/validate';
import { 
  createObjectiveSchema,
  updateObjectiveSchema,
  updateKeyResultSchema,
  assignUsersSchema
} from '../schemas/okr.schema';

const router = Router();

// Objective routes
router.post('/create', createObjective);
router.get('/team/:teamId', getTeamObjectives);
router.put('/:id', updateObjective);
router.delete('/:id', deleteObjective);

// Key Result routes
router.put('/key-result/:id', validate(updateKeyResultSchema), updateKeyResult);
router.delete('/key-result/:id', deleteKeyResult);

// Assignment routes
router.post('/:id/assign', validate(assignUsersSchema), assignObjectiveToUser);

export default router; 