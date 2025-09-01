const axios = require('axios');
const config = require('../config/config');

/**
 * PSC 119 Integration Service
 * This service handles integration with Indonesia's Public Safety Center 119
 * for emergency medical services coordination
 */

class PSC119Service {
  constructor() {
    this.baseURL = config.psc119.baseURL || 'https://api.psc119.kemkes.go.id';
    this.apiKey = config.psc119.apiKey;
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Create emergency ticket with PSC 119
   */
  async createEmergencyTicket(emergency) {
    try {
      const payload = {
        // Emergency details
        emergency_type: this.mapEmergencyType(emergency.type),
        severity_level: this.mapSeverityLevel(emergency.severity),
        priority: emergency.priority,
        description: emergency.description,
        
        // Location information
        location: {
          latitude: emergency.location.coordinates[1],
          longitude: emergency.location.coordinates[0],
          address: emergency.location.address,
          landmark: emergency.location.landmark
        },
        
        // Patient information
        patient: {
          age: emergency.medicalInfo?.patientAge,
          gender: emergency.medicalInfo?.patientGender,
          consciousness_level: emergency.medicalInfo?.consciousness,
          breathing_status: emergency.medicalInfo?.breathing,
          pulse_status: emergency.medicalInfo?.pulse,
          symptoms: emergency.medicalInfo?.symptoms,
          allergies: emergency.medicalInfo?.allergies,
          medications: emergency.medicalInfo?.medications,
          medical_history: emergency.medicalInfo?.medicalHistory
        },
        
        // Contact information
        contact: {
          primary_phone: emergency.contactNumber,
          alternate_phone: emergency.alternateContact
        },
        
        // Requester information
        requester: {
          user_id: emergency.userId,
          timestamp: emergency.createdAt
        },
        
        // System information
        source_system: 'nakes_link',
        integration_version: '1.0'
      };

      const response = await axios.post(
        `${this.baseURL}/api/v1/emergency/create`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Source-System': 'nakes-link'
          },
          timeout: this.timeout
        }
      );

      if (response.data.success) {
        return {
          success: true,
          ticketId: response.data.data.ticket_id,
          dispatchTime: new Date(response.data.data.dispatch_time),
          estimatedArrival: new Date(response.data.data.estimated_arrival),
          assignedUnit: response.data.data.assigned_unit,
          responderInfo: response.data.data.responder_info,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Failed to create PSC 119 ticket');
      }
    } catch (error) {
      console.error('PSC 119 integration error:', error.message);
      
      // Return mock response for development/testing
      if (process.env.NODE_ENV === 'development') {
        return this.getMockResponse(emergency);
      }
      
      throw new Error(`PSC 119 integration failed: ${error.message}`);
    }
  }

  /**
   * Update emergency status with PSC 119
   */
  async updateEmergencyStatus(ticketId, status, notes) {
    try {
      const payload = {
        ticket_id: ticketId,
        status: this.mapStatusToPSC119(status),
        notes: notes,
        timestamp: new Date().toISOString()
      };

      const response = await axios.put(
        `${this.baseURL}/api/v1/emergency/${ticketId}/status`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('PSC 119 status update error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return { success: true, message: 'Status updated (mock)' };
      }
      
      throw new Error(`Failed to update PSC 119 status: ${error.message}`);
    }
  }

  /**
   * Get emergency status from PSC 119
   */
  async getEmergencyStatus(ticketId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/emergency/${ticketId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: this.timeout
        }
      );

      if (response.data.success) {
        return {
          success: true,
          status: this.mapStatusFromPSC119(response.data.data.status),
          location: response.data.data.current_location,
          estimatedArrival: response.data.data.estimated_arrival,
          actualArrival: response.data.data.actual_arrival,
          responderInfo: response.data.data.responder_info,
          updates: response.data.data.status_updates
        };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('PSC 119 status check error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return this.getMockStatusResponse();
      }
      
      throw new Error(`Failed to get PSC 119 status: ${error.message}`);
    }
  }

  /**
   * Cancel emergency with PSC 119
   */
  async cancelEmergency(ticketId, reason) {
    try {
      const payload = {
        ticket_id: ticketId,
        cancellation_reason: reason,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.baseURL}/api/v1/emergency/${ticketId}/cancel`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('PSC 119 cancellation error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return { success: true, message: 'Emergency cancelled (mock)' };
      }
      
      throw new Error(`Failed to cancel PSC 119 emergency: ${error.message}`);
    }
  }

  /**
   * Get available ambulances near location
   */
  async getAvailableAmbulances(latitude, longitude, radius = 10) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/ambulances/available`,
        {
          params: {
            latitude,
            longitude,
            radius_km: radius
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: this.timeout
        }
      );

      if (response.data.success) {
        return {
          success: true,
          ambulances: response.data.data.ambulances.map(ambulance => ({
            id: ambulance.id,
            callSign: ambulance.call_sign,
            type: ambulance.type,
            location: ambulance.current_location,
            distance: ambulance.distance_km,
            estimatedArrival: ambulance.estimated_arrival,
            crew: ambulance.crew_info
          }))
        };
      }
      
      return { success: false, ambulances: [] };
    } catch (error) {
      console.error('PSC 119 ambulance check error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return this.getMockAmbulanceResponse(latitude, longitude);
      }
      
      return { success: false, ambulances: [] };
    }
  }

  // Helper methods for mapping data
  mapEmergencyType(type) {
    const typeMap = {
      'medical': 'MEDICAL_EMERGENCY',
      'accident': 'TRAFFIC_ACCIDENT',
      'fire': 'FIRE_EMERGENCY',
      'crime': 'SECURITY_INCIDENT',
      'natural_disaster': 'NATURAL_DISASTER',
      'other': 'OTHER_EMERGENCY'
    };
    return typeMap[type] || 'OTHER_EMERGENCY';
  }

  mapSeverityLevel(severity) {
    const severityMap = {
      'low': 'GREEN',
      'medium': 'YELLOW',
      'high': 'ORANGE',
      'critical': 'RED'
    };
    return severityMap[severity] || 'YELLOW';
  }

  mapStatusToPSC119(status) {
    const statusMap = {
      'pending': 'RECEIVED',
      'dispatched': 'DISPATCHED',
      'en_route': 'EN_ROUTE',
      'on_scene': 'ON_SCENE',
      'resolved': 'COMPLETED',
      'cancelled': 'CANCELLED'
    };
    return statusMap[status] || 'RECEIVED';
  }

  mapStatusFromPSC119(pscStatus) {
    const statusMap = {
      'RECEIVED': 'pending',
      'DISPATCHED': 'dispatched',
      'EN_ROUTE': 'en_route',
      'ON_SCENE': 'on_scene',
      'COMPLETED': 'resolved',
      'CANCELLED': 'cancelled'
    };
    return statusMap[pscStatus] || 'pending';
  }

  // Mock responses for development/testing
  getMockResponse(emergency) {
    const mockTicketId = `PSC119-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dispatchTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    const estimatedArrival = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    return {
      success: true,
      ticketId: mockTicketId,
      dispatchTime,
      estimatedArrival,
      assignedUnit: 'AMB-JKT-001',
      responderInfo: {
        name: 'Tim Medis PSC 119',
        contact: '+62-119',
        vehicleNumber: 'B 1234 PSC'
      },
      message: 'Emergency ticket created successfully (mock)'
    };
  }

  getMockStatusResponse() {
    return {
      success: true,
      status: 'en_route',
      location: {
        latitude: -6.2088,
        longitude: 106.8456
      },
      estimatedArrival: new Date(Date.now() + 10 * 60 * 1000),
      responderInfo: {
        name: 'Tim Medis PSC 119',
        contact: '+62-119',
        vehicleNumber: 'B 1234 PSC'
      },
      updates: [
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          status: 'dispatched',
          message: 'Unit dispatched'
        },
        {
          timestamp: new Date(),
          status: 'en_route',
          message: 'Unit en route to location'
        }
      ]
    };
  }

  getMockAmbulanceResponse(latitude, longitude) {
    return {
      success: true,
      ambulances: [
        {
          id: 'AMB-001',
          callSign: 'AMB-JKT-001',
          type: 'Advanced Life Support',
          location: {
            latitude: latitude + 0.01,
            longitude: longitude + 0.01
          },
          distance: 2.5,
          estimatedArrival: new Date(Date.now() + 8 * 60 * 1000),
          crew: {
            paramedic: 'Dr. Ahmad',
            driver: 'Budi Santoso'
          }
        },
        {
          id: 'AMB-002',
          callSign: 'AMB-JKT-002',
          type: 'Basic Life Support',
          location: {
            latitude: latitude - 0.02,
            longitude: longitude + 0.015
          },
          distance: 4.1,
          estimatedArrival: new Date(Date.now() + 12 * 60 * 1000),
          crew: {
            paramedic: 'Siti Nurhaliza',
            driver: 'Andi Wijaya'
          }
        }
      ]
    };
  }
}

// Export singleton instance
const psc119Service = new PSC119Service();

// Main integration function
const integrateWithPSC119 = async (emergency) => {
  return await psc119Service.createEmergencyTicket(emergency);
};

module.exports = {
  PSC119Service,
  integrateWithPSC119,
  psc119Service
};