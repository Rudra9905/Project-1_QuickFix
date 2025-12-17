package com.quickhelper.backend.util;

/**
 * Utility class for calculating distances between geographical coordinates
 */
public class DistanceCalculator {
    
    private static final double EARTH_RADIUS_KM = 6371.0;
    
    /**
     * Calculates the distance between two points using the Haversine formula
     * 
     * @param lat1 Latitude of point 1 in degrees
     * @param lon1 Longitude of point 1 in degrees
     * @param lat2 Latitude of point 2 in degrees
     * @param lon2 Longitude of point 2 in degrees
     * @return Distance in kilometers
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        System.out.println("Calculating distance between (" + lat1 + ", " + lon1 + ") and (" + lat2 + ", " + lon2 + ")");
        
        // Validate inputs
        if (Double.isNaN(lat1) || Double.isNaN(lon1) || Double.isNaN(lat2) || Double.isNaN(lon2)) {
            System.out.println("Invalid input: NaN detected");
            return Double.MAX_VALUE; // Return a very large distance
        }
        
        if (Double.isInfinite(lat1) || Double.isInfinite(lon1) || Double.isInfinite(lat2) || Double.isInfinite(lon2)) {
            System.out.println("Invalid input: Infinite value detected");
            return Double.MAX_VALUE; // Return a very large distance
        }
        
        // Convert degrees to radians
        double lat1Rad = Math.toRadians(lat1);
        double lon1Rad = Math.toRadians(lon1);
        double lat2Rad = Math.toRadians(lat2);
        double lon2Rad = Math.toRadians(lon2);
        
        // Differences in coordinates
        double deltaLat = lat2Rad - lat1Rad;
        double deltaLon = lon2Rad - lon1Rad;
        
        // Haversine formula
        double a = Math.pow(Math.sin(deltaLat / 2), 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.pow(Math.sin(deltaLon / 2), 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        // Distance in kilometers
        double distance = EARTH_RADIUS_KM * c;
        System.out.println("Calculated distance: " + distance + " km");
        return distance;
    }
}