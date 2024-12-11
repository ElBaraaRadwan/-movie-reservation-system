// src/types/custom.d.ts
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // The type of 'user' can be more specific if needed, e.g., User
    }
  }
}
