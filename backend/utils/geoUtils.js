/**
 * Geographical utility functions
 * Used for calculating distances, finding nearby locations, etc.
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {number} radians 
 * @returns {number} Degrees
 */
const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees (0-360)
 */
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return Math.round(bearing);
};

/**
 * Get compass direction from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
const getCompassDirection = (bearing) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Calculate destination point given start point, bearing and distance
 * @param {number} lat - Starting latitude
 * @param {number} lon - Starting longitude
 * @param {number} bearing - Bearing in degrees
 * @param {number} distance - Distance in kilometers
 * @returns {object} Destination coordinates {lat, lon}
 */
const calculateDestination = (lat, lon, bearing, distance) => {
  const R = 6371; // Earth's radius in kilometers
  const bearingRad = toRadians(bearing);
  const latRad = toRadians(lat);
  const lonRad = toRadians(lon);
  
  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distance / R) +
    Math.cos(latRad) * Math.sin(distance / R) * Math.cos(bearingRad)
  );
  
  const destLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(latRad),
    Math.cos(distance / R) - Math.sin(latRad) * Math.sin(destLatRad)
  );
  
  return {
    lat: toDegrees(destLatRad),
    lon: toDegrees(destLonRad)
  };
};

/**
 * Check if a point is within a circular area
 * @param {number} pointLat - Point latitude
 * @param {number} pointLon - Point longitude
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if point is within the area
 */
const isWithinRadius = (pointLat, pointLon, centerLat, centerLon, radiusKm) => {
  const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radiusKm;
};

/**
 * Calculate bounding box for a given center point and radius
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {object} Bounding box {north, south, east, west}
 */
const getBoundingBox = (lat, lon, radiusKm) => {
  const R = 6371; // Earth's radius in kilometers
  const latRad = toRadians(lat);
  const lonRad = toRadians(lon);
  
  // Calculate angular distance
  const angularDistance = radiusKm / R;
  
  const minLat = latRad - angularDistance;
  const maxLat = latRad + angularDistance;
  
  let minLon, maxLon;
  
  if (minLat > toRadians(-90) && maxLat < toRadians(90)) {
    const deltaLon = Math.asin(Math.sin(angularDistance) / Math.cos(latRad));
    minLon = lonRad - deltaLon;
    maxLon = lonRad + deltaLon;
    
    if (minLon < toRadians(-180)) minLon += 2 * Math.PI;
    if (maxLon > toRadians(180)) maxLon -= 2 * Math.PI;
  } else {
    // Polar case
    minLat = Math.max(minLat, toRadians(-90));
    maxLat = Math.min(maxLat, toRadians(90));
    minLon = toRadians(-180);
    maxLon = toRadians(180);
  }
  
  return {
    north: toDegrees(maxLat),
    south: toDegrees(minLat),
    east: toDegrees(maxLon),
    west: toDegrees(minLon)
  };
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if coordinates are valid
 */
const isValidCoordinates = (lat, lon) => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180 &&
    !isNaN(lat) && !isNaN(lon)
  );
};

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} precision - Decimal places (default: 6)
 * @returns {string} Formatted coordinates
 */
const formatCoordinates = (lat, lon, precision = 6) => {
  if (!isValidCoordinates(lat, lon)) {
    return 'Invalid coordinates';
  }
  
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(precision)}°${latDir}, ${Math.abs(lon).toFixed(precision)}°${lonDir}`;
};

/**
 * Convert decimal degrees to degrees, minutes, seconds
 * @param {number} decimal - Decimal degrees
 * @returns {object} {degrees, minutes, seconds}
 */
const decimalToDMS = (decimal) => {
  const degrees = Math.floor(Math.abs(decimal));
  const minutesFloat = (Math.abs(decimal) - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  
  return {
    degrees,
    minutes,
    seconds: Math.round(seconds * 100) / 100
  };
};

/**
 * Convert degrees, minutes, seconds to decimal degrees
 * @param {number} degrees 
 * @param {number} minutes 
 * @param {number} seconds 
 * @param {string} direction - 'N', 'S', 'E', or 'W'
 * @returns {number} Decimal degrees
 */
const dmsToDecimal = (degrees, minutes, seconds, direction) => {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
};

/**
 * Get center point of multiple coordinates
 * @param {Array} coordinates - Array of {lat, lon} objects
 * @returns {object} Center point {lat, lon}
 */
const getCenterPoint = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }
  
  if (coordinates.length === 1) {
    return coordinates[0];
  }
  
  let x = 0, y = 0, z = 0;
  
  coordinates.forEach(coord => {
    const latRad = toRadians(coord.lat);
    const lonRad = toRadians(coord.lon);
    
    x += Math.cos(latRad) * Math.cos(lonRad);
    y += Math.cos(latRad) * Math.sin(lonRad);
    z += Math.sin(latRad);
  });
  
  const total = coordinates.length;
  x = x / total;
  y = y / total;
  z = z / total;
  
  const centralLon = Math.atan2(y, x);
  const centralSquareRoot = Math.sqrt(x * x + y * y);
  const centralLat = Math.atan2(z, centralSquareRoot);
  
  return {
    lat: toDegrees(centralLat),
    lon: toDegrees(centralLon)
  };
};

/**
 * Calculate area of polygon using coordinates
 * @param {Array} coordinates - Array of {lat, lon} objects forming a polygon
 * @returns {number} Area in square kilometers
 */
const calculatePolygonArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) {
    return 0;
  }
  
  const R = 6371; // Earth's radius in kilometers
  let area = 0;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lat1 = toRadians(coordinates[i].lat);
    const lat2 = toRadians(coordinates[j].lat);
    const deltaLon = toRadians(coordinates[j].lon - coordinates[i].lon);
    
    area += deltaLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs(area * R * R / 2);
  return Math.round(area * 100) / 100;
};

/**
 * Find nearest point from a list of points
 * @param {object} targetPoint - {lat, lon}
 * @param {Array} points - Array of {lat, lon} objects
 * @returns {object} Nearest point with distance
 */
const findNearestPoint = (targetPoint, points) => {
  if (!points || points.length === 0) {
    return null;
  }
  
  let nearest = null;
  let minDistance = Infinity;
  
  points.forEach((point, index) => {
    const distance = calculateDistance(
      targetPoint.lat, targetPoint.lon,
      point.lat, point.lon
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        ...point,
        index,
        distance
      };
    }
  });
  
  return nearest;
};

module.exports = {
  calculateDistance,
  calculateBearing,
  getCompassDirection,
  calculateDestination,
  isWithinRadius,
  getBoundingBox,
  isValidCoordinates,
  formatCoordinates,
  decimalToDMS,
  dmsToDecimal,
  getCenterPoint,
  calculatePolygonArea,
  findNearestPoint,
  toRadians,
  toDegrees
};