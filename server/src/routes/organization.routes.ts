import { Router } from 'express';
import { createOrganization } from '../controllers/organizationController';

const organizationRouter = Router();

organizationRouter.post('/', createOrganization);

export default organizationRouter;

