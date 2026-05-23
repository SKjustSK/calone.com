import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timezone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { timezone }
    });
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
