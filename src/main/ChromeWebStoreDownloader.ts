import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as unzipper from 'unzipper';
import { app } from 'electron';

export class ChromeWebStoreDownloader {
  private extensionsDir: string;

  constructor() {
    this.extensionsDir = path.join(app.getPath('userData'), 'extensions');
    if (!fs.existsSync(this.extensionsDir)) {
      fs.mkdirSync(this.extensionsDir, { recursive: true });
    }
  }

  /**
   * Extract extension ID from Chrome Web Store URL
   * Example: https://chrome.google.com/webstore/detail/extension-name/abcdefghijklmnopqrstuvwxyz
   */
  extractExtensionId(webStoreUrl: string): string | null {
    const match = webStoreUrl.match(/\/detail\/[^\/]+\/([a-z]{32})/i);
    return match ? match[1] : null;
  }

  /**
   * Download extension from Chrome Web Store
   */
  async downloadExtension(extensionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Chrome Web Store download URL
      const downloadUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=98.0&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc`;
      
      const crxPath = path.join(this.extensionsDir, `${extensionId}.crx`);
      const file = fs.createWriteStream(crxPath);

      https.get(downloadUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            https.get(redirectUrl, (redirectResponse) => {
              redirectResponse.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve(crxPath);
              });
            }).on('error', (err) => {
              fs.unlink(crxPath, () => {});
              reject(err);
            });
          } else {
            reject(new Error('No redirect location'));
          }
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(crxPath);
          });
        }
      }).on('error', (err) => {
        fs.unlink(crxPath, () => {});
        reject(err);
      });
    });
  }

  /**
   * Extract .crx file to a folder
   */
  async extractCrx(crxPath: string, extensionId: string): Promise<string> {
    const extractPath = path.join(this.extensionsDir, extensionId);

    // Remove existing folder if it exists
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }

    return new Promise((resolve, reject) => {
      // Read the CRX file
      const crxData = fs.readFileSync(crxPath);
      
      // CRX3 format: Skip the header and extract the ZIP
      // CRX3 header structure:
      // - 4 bytes: "Cr24" magic number
      // - 4 bytes: version (3)
      // - 4 bytes: header size
      // - Then the actual ZIP data
      
      let zipStart = 0;
      const magic = crxData.toString('utf8', 0, 4);
      
      if (magic === 'Cr24') {
        const version = crxData.readUInt32LE(4);
        if (version === 3) {
          const headerSize = crxData.readUInt32LE(8);
          zipStart = 12 + headerSize;
        } else if (version === 2) {
          // CRX2 format: different header
          const publicKeyLength = crxData.readUInt32LE(8);
          const signatureLength = crxData.readUInt32LE(12);
          zipStart = 16 + publicKeyLength + signatureLength;
        }
      }

      // Extract the ZIP portion
      const zipData = crxData.slice(zipStart);
      const zipPath = path.join(this.extensionsDir, `${extensionId}.zip`);
      fs.writeFileSync(zipPath, zipData);

      // Extract ZIP
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .on('close', () => {
          // Clean up temporary files
          fs.unlinkSync(zipPath);
          fs.unlinkSync(crxPath);
          resolve(extractPath);
        })
        .on('error', reject);
    });
  }

  /**
   * Download and install extension from Chrome Web Store URL
   */
  async installFromWebStore(webStoreUrl: string): Promise<string> {
    const extensionId = this.extractExtensionId(webStoreUrl);
    if (!extensionId) {
      throw new Error('Invalid Chrome Web Store URL');
    }

    console.log(`Downloading extension ${extensionId}...`);
    const crxPath = await this.downloadExtension(extensionId);
    
    console.log(`Extracting extension ${extensionId}...`);
    const extractPath = await this.extractCrx(crxPath, extensionId);
    
    console.log(`Extension installed to: ${extractPath}`);
    return extractPath;
  }
}
