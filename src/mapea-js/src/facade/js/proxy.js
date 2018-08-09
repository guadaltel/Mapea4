/**
 * @module M
 */
import { isBoolean } from './util/Utils';

/**
 * Flag that indicates if the proxy is
 * enabled to use
 * @type {boolean}
 * @api
 */
export let proxy_ = true;

/**
 * This function enables/disables the proxy
 *
 * @public
 * @function
 * @param {boolean} enable
 * @api stable
 */
export const proxy = (enable) => {
  if (isBoolean(enable)) {
    proxy_ = enable;
  }
};
