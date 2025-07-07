import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import crypto from 'crypto';

export interface APSAuth {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface APSBucket {
  bucketKey: string;
  bucketOwner: string;
  createdDate: number;
  permissions: any[];
  policyKey: string;
}

export interface APSUploadResult {
  bucketKey: string;
  objectId: string;
  objectKey: string;
  size: number;
  contentType: string;
  location: string;
}

export interface APSJob {
  urn: string;
  result: string;
  type: string;
  region: string;
  version: string;
  progress: string;
  status: string;
  success: string;
  hasThumbnail: string;
  startedAt: string;
  registerTime: string;
}

export class APSService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://developer.api.autodesk.com';
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor() {
    this.clientId = process.env.APS_CLIENT_ID!;
    this.clientSecret = process.env.APS_CLIENT_SECRET!;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('APS_CLIENT_ID and APS_CLIENT_SECRET environment variables are required');
    }
  }

  async authenticate(): Promise<APSAuth> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return {
        access_token: this.accessToken,
        expires_in: Math.floor((this.tokenExpiry.getTime() - Date.now()) / 1000),
        token_type: 'Bearer'
      };
    }

    const response = await axios.post(
      `${this.baseUrl}/authentication/v2/token`,
      'grant_type=client_credentials&scope=data:read data:write data:create bucket:create bucket:read',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        }
      }
    );

    const auth: APSAuth = response.data;
    this.accessToken = auth.access_token;
    this.tokenExpiry = new Date(Date.now() + (auth.expires_in * 1000));
    
    return auth;
  }

  async createBucket(bucketKey: string): Promise<APSBucket> {
    const auth = await this.authenticate();
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/oss/v2/buckets`,
        {
          bucketKey,
          policyKey: 'temporary'
        },
        {
          headers: {
            'Authorization': `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Bucket already exists, get bucket details
        const response = await axios.get(
          `${this.baseUrl}/oss/v2/buckets/${bucketKey}/details`,
          {
            headers: {
              'Authorization': `Bearer ${auth.access_token}`
            }
          }
        );
        return response.data;
      }
      throw error;
    }
  }

  async uploadFile(bucketKey: string, objectKey: string, filePath: string): Promise<APSUploadResult> {
    const auth = await this.authenticate();
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    // Use Direct-to-S3 upload approach
    // Step 1: Get signed S3 URLs
    const response = await axios.get(
      `${this.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
      {
        params: {
          firstPart: 1,
          parts: 1 // Single part upload for simplicity
        },
        headers: {
          'Authorization': `Bearer ${auth.access_token}`
        }
      }
    );

    const uploadData = response.data;
    const uploadKey = uploadData.uploadKey;
    const urls = uploadData.urls;

    // Step 2: Upload file to S3 using the signed URL
    const fileBuffer = fs.readFileSync(filePath);
    
    await axios.put(urls[0], fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });

    // Step 3: Finalize the upload
    const finalizeResponse = await axios.post(
      `${this.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
      {
        uploadKey: uploadKey,
        parts: [
          {
            PartNumber: 1,
            ETag: '"' + crypto.createHash('md5').update(fileBuffer).digest('hex') + '"'
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Return standardized result
    return {
      bucketKey: bucketKey,
      objectId: `urn:adsk.objects:os.object:${bucketKey}/${objectKey}`,
      objectKey: objectKey,
      size: fileSize,
      contentType: 'application/octet-stream',
      location: finalizeResponse.data.location || `${this.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectKey}`
    };
  }

  async translateFile(urn: string): Promise<APSJob> {
    const auth = await this.authenticate();
    
    const response = await axios.post(
      `${this.baseUrl}/modelderivative/v2/designdata/job`,
      {
        input: {
          urn: urn
        },
        output: {
          formats: [
            {
              type: 'svf2',
              views: ['2d', '3d']
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  async getTranslationStatus(urn: string): Promise<APSJob> {
    const auth = await this.authenticate();
    
    const response = await axios.get(
      `${this.baseUrl}/modelderivative/v2/designdata/${urn}/manifest`,
      {
        headers: {
          'Authorization': `Bearer ${auth.access_token}`
        }
      }
    );

    return response.data;
  }

  async getViewerToken(): Promise<string> {
    const auth = await this.authenticate();
    return auth.access_token;
  }

  encodeBase64Url(text: string): string {
    return Buffer.from(text).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export const apsService = new APSService();