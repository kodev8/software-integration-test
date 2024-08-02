import { Router } from 'express';
import * as profileServices from '../controllers/profile.controller';

const router: Router = Router();

router.put('/', profileServices.editPassword);
router.post('/', profileServices.logout);

export default router;
