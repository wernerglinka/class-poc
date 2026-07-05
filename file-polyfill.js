/**
 * File API Polyfill for Node.js environments where it's not available
 * This is needed for compatibility with undici in certain environments
 */

import { Blob } from 'node:buffer';

if (typeof globalThis.File === 'undefined') {
  class File extends Blob {
    constructor(fileBits, fileName, options = {}) {
      const { lastModified = Date.now(), ...blobOptions } = options;
      super(fileBits, blobOptions);
      this.name = String(fileName);
      this.lastModified = lastModified;
    }
  }

  globalThis.File = File;

  console.log('File API polyfill applied');
}
