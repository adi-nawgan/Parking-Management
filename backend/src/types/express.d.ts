import { IAdmin } from '../models/Admin';

export interface AuthRequest extends import('express').Request {
  admin?: IAdmin;
}
