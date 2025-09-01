const axios = require('axios');
const crypto = require('crypto');
const { User } = require('../models');

class SatuSehatService {
  constructor() {
    this.baseURL = process.env.SATUSEHAT_BASE_URL || 'https://api-satusehat.kemkes.go.id';
    this.clientId = process.env.SATUSEHAT_CLIENT_ID;
    this.clientSecret = process.env.SATUSEHAT_CLIENT_SECRET;
    this.organizationId = process.env.SATUSEHAT_ORGANIZATION_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth2 access token from SatuSehat
   */
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(`${this.baseURL}/oauth2/v1/accesstoken`, {
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting SatuSehat access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with SatuSehat');
    }
  }

  /**
   * Verify healthcare professional by NIK
   */
  async verifyNakesByNIK(nik) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/fhir-r4/v1/Practitioner`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          identifier: `https://fhir.kemkes.go.id/id/nik|${nik}`
        }
      });

      if (response.data.total === 0) {
        return {
          verified: false,
          message: 'NIK tidak ditemukan dalam database SatuSehat'
        };
      }

      const practitioner = response.data.entry[0].resource;
      
      return {
        verified: true,
        data: {
          satusehat_id: practitioner.id,
          name: this.extractName(practitioner.name),
          gender: practitioner.gender,
          birthDate: practitioner.birthDate,
          qualification: practitioner.qualification || [],
          active: practitioner.active
        }
      };
    } catch (error) {
      console.error('Error verifying NIK with SatuSehat:', error.response?.data || error.message);
      throw new Error('Failed to verify NIK with SatuSehat');
    }
  }

  /**
   * Verify STR (Surat Tanda Registrasi) status
   */
  async verifySTR(strNumber, practitionerId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/fhir-r4/v1/PractitionerRole`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          practitioner: practitionerId,
          identifier: `https://fhir.kemkes.go.id/id/str|${strNumber}`
        }
      });

      if (response.data.total === 0) {
        return {
          verified: false,
          message: 'STR tidak ditemukan atau tidak valid'
        };
      }

      const practitionerRole = response.data.entry[0].resource;
      
      return {
        verified: true,
        data: {
          str_number: strNumber,
          specialty: practitionerRole.specialty || [],
          organization: practitionerRole.organization,
          period: practitionerRole.period,
          active: practitionerRole.active
        }
      };
    } catch (error) {
      console.error('Error verifying STR with SatuSehat:', error.response?.data || error.message);
      throw new Error('Failed to verify STR with SatuSehat');
    }
  }

  /**
   * Get practitioner qualifications and certifications
   */
  async getPractitionerQualifications(practitionerId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/fhir-r4/v1/Practitioner/${practitionerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const practitioner = response.data;
      
      return {
        qualifications: practitioner.qualification || [],
        communication: practitioner.communication || [],
        photo: practitioner.photo || []
      };
    } catch (error) {
      console.error('Error getting practitioner qualifications:', error.response?.data || error.message);
      throw new Error('Failed to get practitioner qualifications');
    }
  }

  /**
   * Sync user data with SatuSehat
   */
  async syncUserWithSatuSehat(userId, nik, strNumber = null) {
    try {
      // Verify NIK first
      const nikVerification = await this.verifyNakesByNIK(nik);
      
      if (!nikVerification.verified) {
        return {
          success: false,
          message: nikVerification.message
        };
      }

      const practitionerData = nikVerification.data;
      let strData = null;

      // Verify STR if provided
      if (strNumber) {
        const strVerification = await this.verifySTR(strNumber, practitionerData.satusehat_id);
        if (strVerification.verified) {
          strData = strVerification.data;
        }
      }

      // Get additional qualifications
      const qualifications = await this.getPractitionerQualifications(practitionerData.satusehat_id);

      // Update user in database
      await User.update({
        satusehat_id: practitionerData.satusehat_id,
        satusehat_verified: true,
        satusehat_last_sync: new Date(),
        // Update other fields if needed
        gender: practitionerData.gender,
        birth_date: practitionerData.birthDate
      }, {
        where: { id: userId }
      });

      return {
        success: true,
        data: {
          practitioner: practitionerData,
          str: strData,
          qualifications: qualifications
        }
      };
    } catch (error) {
      console.error('Error syncing user with SatuSehat:', error.message);
      return {
        success: false,
        message: 'Failed to sync with SatuSehat: ' + error.message
      };
    }
  }

  /**
   * Check if practitioner is still active
   */
  async checkPractitionerStatus(satusehatId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/fhir-r4/v1/Practitioner/${satusehatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        active: response.data.active,
        lastUpdated: response.data.meta?.lastUpdated
      };
    } catch (error) {
      console.error('Error checking practitioner status:', error.response?.data || error.message);
      throw new Error('Failed to check practitioner status');
    }
  }

  /**
   * Extract name from FHIR name array
   */
  extractName(nameArray) {
    if (!nameArray || nameArray.length === 0) return null;
    
    const name = nameArray[0];
    const given = name.given ? name.given.join(' ') : '';
    const family = name.family || '';
    
    return `${given} ${family}`.trim();
  }

  /**
   * Validate SatuSehat configuration
   */
  validateConfiguration() {
    const requiredEnvVars = [
      'SATUSEHAT_CLIENT_ID',
      'SATUSEHAT_CLIENT_SECRET',
      'SATUSEHAT_ORGANIZATION_ID'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required SatuSehat environment variables: ${missing.join(', ')}`);
    }

    return true;
  }
}

module.exports = new SatuSehatService();