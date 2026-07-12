import { analyticsRepo } from './analytics.repository'
import { tripRepo } from '../trips/trip.repository'

export const analyticsService = {
  async getDashboard() {
    // Rule 12 & Rule 8 (from hh.md): Promise.all for independent queries
    const [
      vehicleCounts,
      tripCounts,
      driverOnDutyCount,
      recentTrips,
      vehicleStatusDist,
      monthlyCosts,
      topCostVehicles,
    ] = await Promise.all([
      analyticsRepo.getVehicleCounts(),       // AVAILABLE, ON_TRIP, IN_SHOP, RETIRED
      analyticsRepo.getTripCounts(),          // DRAFT, DISPATCHED, COMPLETED, CANCELLED
      analyticsRepo.getDriversOnDutyCount(),
      tripRepo.findRecent(5),                 // Last 5 trips
      analyticsRepo.getVehicleStatusDistribution(),
      analyticsRepo.getMonthlyCosts(6),       // Last 6 months costs
      analyticsRepo.getTopCostVehicles(5),    // Top 5 cost vehicles
    ])

    const nonRetired = vehicleCounts.AVAILABLE + vehicleCounts.ON_TRIP + vehicleCounts.IN_SHOP
    const fleetUtilization = nonRetired > 0
      ? (vehicleCounts.ON_TRIP / nonRetired) * 100
      : 0

    return {
      kpis: {
        ...vehicleCounts,
        ...tripCounts,
        driverOnDutyCount,
        fleetUtilization,
      },
      recentTrips,
      vehicleStatusDist,
      monthlyCosts,
      topCostVehicles,
    }
  },
}
