import { Request, Response } from 'express';
import Log from '../models/Log';
import CurrentlyParked from '../models/CurrentlyParked';

const getVisitorLogs = async (req: Request, res: Response): Promise<void> => {
  const { plate, flat, building, startDate, endDate } = req.query as Record<string, string | undefined>;

  try {
    const query: Record<string, unknown> = { type: 'visitor' };

    if (plate) {
      query.plate = { $regex: plate.toUpperCase().trim(), $options: 'i' };
    }

    if (flat) {
      query.flatNumber = { $regex: flat.trim(), $options: 'i' };
    }

    if (building) {
      query.buildingNumber = Number(building);
    }

    if (startDate || endDate) {
      query.entryTime = {} as Record<string, Date>;
      if (startDate) {
        (query.entryTime as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (query.entryTime as Record<string, Date>).$lte = end;
      }
    }

    const activeVisitors = await CurrentlyParked.find(query).lean();
    const archivedVisitors = await Log.find(query).lean();

    const formattedActive = activeVisitors.map(v => ({
      ...v,
      exitTime: null,
      duration: null,
      isCurrentlyInside: true,
    }));

    const formattedArchived = archivedVisitors.map(v => ({
      ...v,
      isCurrentlyInside: false,
    }));

    const combinedVisitors = [...formattedActive, ...formattedArchived].sort((a, b) => {
      return new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime();
    });

    const visitorsWithRepeatStats = await Promise.all(
      combinedVisitors.map(async (visitor) => {
        const completedVisits = await Log.countDocuments({
          plate: visitor.plate,
          type: 'visitor',
        });

        const isInsideNow = await CurrentlyParked.exists({
          plate: visitor.plate,
          type: 'visitor',
        });

        const totalVisitsCount = completedVisits + (isInsideNow ? 1 : 0);

        return {
          ...visitor,
          totalVisits: totalVisitsCount,
          isRepeatVisitor: totalVisitsCount > 1,
        };
      })
    );

    res.json(visitorsWithRepeatStats);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { getVisitorLogs };
