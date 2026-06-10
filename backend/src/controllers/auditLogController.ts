import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import Member from '../models/Member';

// Get all audit logs with optional filters
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const { memberName, actionType, startDate, endDate } = req.query as Record<string, string | undefined>;

  const query: Record<string, any> = {};

  if (memberName && memberName.trim() !== '') {
    query.memberName = { $regex: memberName.trim(), $options: 'i' };
  }

  if (actionType && actionType.trim() !== '') {
    query.actionType = actionType.trim();
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) {
      query.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include full end day
      query.timestamp.$lte = end;
    }
  }

  try {
    const logs = await AuditLog.find(query).sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get members list with lockout status and total lookups count
export const getMembersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const members = await Member.find({}).select('-password');
    
    const results = [];
    for (const member of members) {
      const lookupCount = await AuditLog.countDocuments({
        memberId: member._id,
        actionType: 'plate-lookup',
      });

      const isLocked = member.lockUntil && member.lockUntil.getTime() > Date.now();

      results.push({
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        buildingNumber: member.buildingNumber,
        flatNumber: member.flatNumber,
        status: member.status, // 'active' | 'deactivated'
        isLocked: !!isLocked,
        lockUntil: member.lockUntil,
        lookupCount,
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Admin manually unlock a member account
export const unlockMember = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const member = await Member.findById(id);
    if (!member) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    member.loginAttempts = 0;
    member.lockUntil = undefined;
    await member.save();

    res.json({ message: `Member ${member.name} successfully unlocked` });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Admin activate / deactivate a member account
export const toggleMemberStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'deactivated'

  if (!['active', 'deactivated'].includes(status)) {
    res.status(400).json({ message: 'Invalid status' });
    return;
  }

  try {
    const member = await Member.findById(id);
    if (!member) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    member.status = status;
    await member.save();

    res.json({ message: `Member status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
