#!/usr/bin/env python3
"""
Location Simulator - Simulate GPS movement along routes
"""

import math
import time
import logging
from typing import List, Tuple, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class LocationSimulator:
    """Simulate GPS movement along a route"""

    EARTH_RADIUS = 6371  # km

    def __init__(self, controller):
        """
        Initialize location simulator

        Args:
            controller: AndroidGPSController instance
        """
        self.controller = controller
        self.running = False
        self.current_progress = 0

    def calculate_bearing(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate bearing between two points

        Args:
            lat1, lng1: First point coordinates
            lat2, lng2: Second point coordinates

        Returns:
            Bearing in degrees (0-360)
        """
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        d_lng = lng2 - lng1

        y = math.sin(d_lng) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - \
            math.sin(lat1) * math.cos(lat2) * math.cos(d_lng)

        bearing = math.atan2(y, x)
        return (math.degrees(bearing) + 360) % 360

    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate distance between two points using Haversine formula

        Args:
            lat1, lng1: First point coordinates
            lat2, lng2: Second point coordinates

        Returns:
            Distance in kilometers
        """
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])

        d_lat = lat2 - lat1
        d_lng = lng2 - lng1

        a = math.sin(d_lat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng/2)**2
        c = 2 * math.asin(math.sqrt(a))

        return self.EARTH_RADIUS * c

    def interpolate_route(
        self,
        start_pos: Tuple[float, float],
        end_pos: Tuple[float, float],
        num_points: int
    ) -> List[Tuple[float, float]]:
        """
        Generate intermediate points between two locations

        Args:
            start_pos: Starting (lat, lng)
            end_pos: Ending (lat, lng)
            num_points: Number of intermediate points

        Returns:
            List of (lat, lng) tuples
        """
        lat1, lng1 = start_pos
        lat2, lng2 = end_pos
        points = []

        for i in range(num_points + 1):
            ratio = i / num_points
            lat = lat1 + (lat2 - lat1) * ratio
            lng = lng1 + (lng2 - lng1) * ratio
            points.append((lat, lng))

        return points

    def generate_circular_route(
        self,
        center: Tuple[float, float],
        radius_km: float,
        num_points: int
    ) -> List[Tuple[float, float]]:
        """
        Generate a circular route around a center point

        Args:
            center: Center (lat, lng)
            radius_km: Radius in kilometers
            num_points: Number of points in circle

        Returns:
            List of (lat, lng) tuples
        """
        lat, lng = center
        points = []

        # Convert radius to degrees (approximate)
        radius_deg = radius_km / 111.32  # 1 degree ≈ 111.32 km

        for i in range(num_points + 1):
            angle = (2 * math.pi * i) / num_points

            lat_offset = radius_deg * math.cos(angle)
            lng_offset = radius_deg * math.sin(angle) / math.cos(math.radians(lat))

            points.append((lat + lat_offset, lng + lng_offset))

        return points

    def generate_random_walk(
        self,
        start: Tuple[float, float],
        num_points: int,
        max_distance_km: float = 0.5
    ) -> List[Tuple[float, float]]:
        """
        Generate a random walk route

        Args:
            start: Starting (lat, lng)
            num_points: Number of points
            max_distance_km: Maximum distance per step

        Returns:
            List of (lat, lng) tuples
        """
        points = [start]
        current_lat, current_lng = start

        for _ in range(num_points):
            # Random direction and distance
            angle = 2 * math.pi * hash(str(time.time())) % 1
            distance = (hash(str(time.time())) % 100 / 100) * max_distance_km

            # Convert to degrees
            distance_deg = distance / 111.32

            lat_offset = distance_deg * math.cos(angle)
            lng_offset = distance_deg * math.sin(angle) / math.cos(math.radians(current_lat))

            current_lat += lat_offset
            current_lng += lng_offset

            points.append((current_lat, current_lng))

        return points

    def simulate_movement(
        self,
        route: List[Tuple[float, float]],
        speed_kmh: float = 5.0,
        update_interval: int = 2,
        progress_callback: Optional[callable] = None
    ) -> bool:
        """
        Simulate movement along a route

        Args:
            route: List of (lat, lng) tuples
            speed_kmh: Speed in km/h
            update_interval: Seconds between location updates
            progress_callback: Optional callback for progress updates

        Returns:
            True if completed successfully
        """
        self.running = True
        total_points = len(route) - 1
        completed_points = 0

        logger.info(f"Starting movement simulation: {len(route)} points at {speed_kmh} km/h")

        for i in range(len(route) - 1):
            if not self.running:
                logger.info("Simulation stopped")
                break

            start = route[i]
            end = route[i + 1]

            # Calculate distance and time
            distance = self.calculate_distance(
                start[0], start[1],
                end[0], end[1]
            )

            # Time = distance / speed (in hours)
            time_hours = distance / speed_kmh if speed_kmh > 0 else 0.5
            time_seconds = time_hours * 3600

            # Number of updates for this segment
            num_updates = max(1, int(time_seconds / update_interval))

            # Generate intermediate points
            points = self.interpolate_route(start, end, num_updates)

            # Send location updates
            for point in points:
                if not self.running:
                    break

                success = self.controller.set_location(point[0], point[1])

                if not success:
                    logger.error(f"Failed to set location: {point}")
                    # Try to continue

                time.sleep(update_interval)

            completed_points += 1
            progress = int((completed_points / total_points) * 100)

            if progress_callback:
                progress_callback(progress, f"Simulating movement... {progress}%")

            logger.debug(f"Progress: {progress}% - Point {i+1}/{total_points}")

        self.running = False
        logger.info("Movement simulation completed")

        return True

    def simulate_circular_movement(
        self,
        center: Tuple[float, float],
        radius_km: float,
        speed_kmh: float = 5.0,
        duration_hours: float = 1.0,
        update_interval: int = 2,
        progress_callback: Optional[callable] = None
    ) -> bool:
        """
        Simulate circular movement around a center point

        Args:
            center: Center (lat, lng)
            radius_km: Circle radius in kilometers
            speed_kmh: Speed in km/h
            duration_hours: Duration in hours
            update_interval: Seconds between location updates
            progress_callback: Optional callback for progress updates

        Returns:
            True if completed successfully
        """
        # Calculate circle parameters
        circumference = 2 * math.pi * radius_km
        total_distance = speed_kmh * duration_hours

        # Number of complete circles
        num_circles = total_distance / circumference if circumference > 0 else 1

        # Points per circle (more for smoother movement)
        points_per_circle = max(36, int(duration_hours * 3600 / update_interval))

        logger.info(f"Simulating {num_circles:.1f} circles at radius {radius_km}km")

        # Generate circular route
        route = self.generate_circular_route(
            center,
            radius_km,
            int(points_per_circle * num_circles)
        )

        return self.simulate_movement(
            route,
            speed_kmh,
            update_interval,
            progress_callback
        )

    def simulate_route_between_locations(
        self,
        start: Tuple[float, float],
        end: Tuple[float, float],
        speed_kmh: float = 5.0,
        update_interval: int = 2,
        progress_callback: Optional[callable] = None
    ) -> bool:
        """
        Simulate movement between two locations

        Args:
            start: Starting (lat, lng)
            end: Ending (lat, lng)
            speed_kmh: Speed in km/h
            update_interval: Seconds between location updates
            progress_callback: Optional callback for progress updates

        Returns:
            True if completed successfully
        """
        # Calculate distance
        distance = self.calculate_distance(start[0], start[1], end[0], end[1])

        # Calculate duration
        duration_hours = distance / speed_kmh if speed_kmh > 0 else 1.0

        # Number of updates
        num_updates = max(10, int(duration_hours * 3600 / update_interval))

        logger.info(f"Simulating route: {distance:.2f}km in {duration_hours:.1f}h")

        # Generate route
        route = self.interpolate_route(start, end, num_updates)

        return self.simulate_movement(
            route,
            speed_kmh,
            update_interval,
            progress_callback
        )

    def stop(self):
        """Stop simulation"""
        logger.info("Stopping simulation")
        self.running = False


# Predefined routes for common locations
PREDEFINED_ROUTES = {
    "amsterdam_center": [
        (52.3676, 4.9041),  # Central Station
        (52.3702, 4.8952),  # Dam Square
        (52.3667, 4.8917),  # Leidseplein
        (52.3633, 4.8800),  # Vondelpark
        (52.3676, 4.9041),  # Back to Central
    ],
    "london_center": [
        (51.5074, -0.1278),  # Westminster
        (51.5300, -0.1000),  # Camden
        (51.5200, -0.0700),  # Shoreditch
        (51.5000, -0.1300),  # South Bank
        (51.5074, -0.1278),  # Back to Westminster
    ],
    "new_york_center": [
        (40.7580, -73.9855),  # Times Square
        (40.7484, -73.9857),  # Empire State
        (40.7614, -73.9776),  # Central Park South
        (40.7829, -73.9654),  # Central Park North
        (40.7580, -73.9855),  # Back to Times Square
    ]
}


def get_predefined_route(name: str) -> Optional[List[Tuple[float, float]]]:
    """
    Get a predefined route by name

    Args:
        name: Route name

    Returns:
        List of coordinates or None
    """
    return PREDEFINED_ROUTES.get(name)
