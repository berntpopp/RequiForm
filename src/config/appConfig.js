/**
 * @fileoverview Application configuration.
 * Reads the version from package.json and exposes it to the application.
 */

import packageInfo from '../../package.json';

const appConfig = {
  /** Application version */
  version: packageInfo.version,
};

export default appConfig;
