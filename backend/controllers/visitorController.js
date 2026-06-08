const Log = require('../models/Log');
const CurrentlyParked = require('../models/CurrentlyParked');

// @desc    Get all visitor logs (both active and completed) with repeat visitor analysis
// @route   GET /api/visitors
// @access  Private
const getVisitorLogs = async (req, res) => {
  const { plate, flat, building, startDate, endDate } = req.query;

  try {
    let query = { type: 'visitor' };

    // Filter by plate
    if (plate) {
      query.plate = { $regex: plate.toUpperCase().trim(), $options: 'i' };
    }

    // Filter by flat
    if (flat) {
      query.flatNumber = { $regex: flat.trim(), $options: 'i' };
    }

    // Filter by building
    if (building) {
      query.buildingNumber = Number(building);
    }

    // Filter by date range (on entryTime)
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

    // 1. Fetch currently parked visitors matching filters
    const activeVisitors = await CurrentlyParked.find(query).lean();

    // 2. Fetch completed visitor logs matching filters
    const archivedVisitors = await Log.find(query).lean();

    // 3. Format active entries to match log structure (setting exitTime and duration representation)
    const formattedActive = activeVisitors.map(v => ({
      ...v,
      exitTime: null,
      duration: null,
      isCurrentlyInside: true
    }));

    // 4. Format archived entries
    const formattedArchived = archivedVisitors.map(v => ({
      ...v,
      isCurrentlyInside: false
    }));

    // 5. Combine and sort by entryTime descending
    const combinedVisitors = [...formattedActive, ...formattedArchived].sort((a, b) => {
      return new Date(b.entryTime) - new Date(a.entryTime);
    });

    // 6. Map through combined records to count historical visits (repeat visitor calculation)
    const visitorsWithRepeatStats = await Promise.all(
      combinedVisitors.map(async (visitor) => {
        // Count previous entries in Log database
        const completedVisits = await Log.countDocuments({
          plate: visitor.plate,
          type: 'visitor'
        });

        // Check if currently inside
        const isInsideNow = await CurrentlyParked.exists({
          plate: visitor.plate,
          type: 'visitor'
        });

        const totalVisitsCount = completedVisits + (isInsideNow ? 1 : 0);

        return {
          ...visitor,
          totalVisits: totalVisitsCount,
          isRepeatVisitor: totalVisitsCount > 1
        };
      })
    );

    res.json(visitorsWithRepeatStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVisitorLogs
};

