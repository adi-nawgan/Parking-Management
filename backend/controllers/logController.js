const Log = require('../models/Log');

// Helper to compile filters
const buildLogQuery = (filters) => {
  const { plate, flat, building, type, startDate, endDate } = filters;
  let query = {};

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
    query.entryTime = {};
    if (startDate) {
      query.entryTime.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.entryTime.$lte = end;
    }
  }

  return query;
};

// @desc    Get all logs with filters
// @route   GET /api/logs
// @access  Private
const getLogs = async (req, res) => {
  try {
    const query = buildLogQuery(req.query);
    const logs = await Log.find(query)
      .populate('residentId')
      .sort({ exitTime: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export logs as CSV
// @route   GET /api/logs/export
// @access  Private
const exportLogsCSV = async (req, res) => {
  try {
    const query = buildLogQuery(req.query);
    const logs = await Log.find(query)
      .populate('residentId')
      .sort({ exitTime: -1 });

    // Build CSV Content
    let csvContent = 'Plate Number,Type,Building Number,Flat Number,Entry Time,Exit Time,Duration (Minutes),Resident/Visitor Name,Visitor Purpose\n';

    logs.forEach(log => {
      let name = '';
      let purpose = '';

      if (log.type === 'visitor') {
        name = log.visitorDetails?.name || '';
        purpose = log.visitorDetails?.purpose || '';
      } else if (log.residentId) {
        name = log.residentId.ownerName || '';
      }

      // Escape quotes in fields to ensure correct formatting
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
        `"${cleanPurpose}"`
      ];

      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=parking_logs_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLogs,
  exportLogsCSV
};
