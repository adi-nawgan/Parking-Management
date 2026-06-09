import { Request, Response } from 'express';
import ParkingReport from '../models/ParkingReport';

const getAllReports = async (req: Request, res: Response): Promise<void> => {
  const { status, reportType, startDate, endDate } = req.query as Record<string, string | undefined>;

  try {
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (reportType) query.reportType = reportType;

    if (startDate || endDate) {
      query.createdAt = {} as Record<string, Date>;
      if (startDate) {
        (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (query.createdAt as Record<string, Date>).$lte = end;
      }
    }

    const reports = await ParkingReport.find(query)
      .populate('reportedBy', 'name email phone buildingNumber flatNumber')
      .populate('resolvedBy', 'email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await ParkingReport.findById(req.params.id)
      .populate('reportedBy', 'name email phone buildingNumber flatNumber')
      .populate('resolvedBy', 'email');

    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const updateReportStatus = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as any).admin?._id;
  const { status } = req.body;

  try {
    if (!status || !['resolved', 'dismissed'].includes(status)) {
      res.status(400).json({ message: 'Status must be "resolved" or "dismissed"' });
      return;
    }

    const report = await ParkingReport.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    report.status = status;
    report.resolvedAt = new Date();
    report.resolvedBy = adminId;

    const updated = await report.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { getAllReports, getReportById, updateReportStatus };
