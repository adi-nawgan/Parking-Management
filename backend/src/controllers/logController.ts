import { Request, Response } from 'express';
import Log from '../models/Log';

interface LogFilters {
  plate?: string;
  flat?: string;
  building?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

const buildLogQuery = (filters: LogFilters): Record<string, unknown> => {
  const { plate, flat, building, type, startDate, endDate } = filters;
  const query: Record<string, unknown> = {};

  if (plate) {
    query.plate = { $regex: plate.toUpperCase().trim(), $options: 'i' };
  }

  if (flat) {
    query.flatNumber = { $regex: flat.trim(), $options: 'i' };
  }

  if (building) {
    query.buildingNumber = Number(building);
  }

  if (type) {
    query.type = type;
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

  return query;
};

const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = buildLogQuery(req.query as unknown as LogFilters);
    const logs = await Log.find(query)
      .populate('residentId')
      .sort({ exitTime: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const exportLogsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = buildLogQuery(req.query as unknown as LogFilters);
    const logs = await Log.find(query)
      .populate('residentId')
      .sort({ exitTime: -1 });

    let csvContent = 'Plate Number,Type,Building Number,Flat Number,Entry Time,Exit Time,Duration (Minutes),Resident/Visitor Name,Visitor Purpose\n';

    logs.forEach(log => {
      let name = '';
      let purpose = '';

      if (log.type === 'visitor') {
        name = (log.visitorDetails as { name?: string } | undefined)?.name || '';
        purpose = (log.visitorDetails as { purpose?: string } | undefined)?.purpose || '';
      } else if (log.residentId) {
        name = (log.residentId as unknown as { ownerName: string }).ownerName || '';
      }

      const cleanName = name.replace(/"/g, '""');
      const cleanPurpose = purpose.replace(/"/g, '""');

      const row = [
        log.plate,
        log.type,
        log.buildingNumber || '',
        log.flatNumber,
        new Date(log.entryTime).toLocaleString(),
        new Date(log.exitTime).toLocaleString(),
        log.duration,
        `"${cleanName}"`,
        `"${cleanPurpose}"`,
      ];

      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=parking_logs_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { getLogs, exportLogsCSV };
