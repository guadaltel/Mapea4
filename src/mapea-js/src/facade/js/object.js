import EventsManager from './event/eventsmanager';
import Utils from './utils/utils';

/**
 * @classdesc
 * Main mapea Object. This class creates a Object
 * which manages events
 *
 * @constructor
 * @api stable
 */
export default class Object {

  constructor() {
    /**
     * Callback for events managed by the
     * facade object
     *
     * @private
     * @type {M.evt.EventsManager}
     */
    this.eventsManager_ = new EventsManager();
  }

  /**
   * Sets the callback when the instace is loaded
   *
   * @public
   * @function
   * @api stable
   */
  on(eventType, listener, optThis) {
    return this.eventsManager_.add(eventType, listener, optThis);
  }

  /**
   * Sets the callback when the instace is loaded
   *
   * @public
   * @function
   * @api stable
   */
  once(eventType, listener, optThis) {
    return this.eventsManager_.add(eventType, listener, optThis, true);
  }

  /**
   * Sets the callback when the instace is loaded
   *
   * @public
   * @function
   * @api stable
   */
  once(eventType, listener, optThis) {
    return this.eventsManager_.add(eventType, listener, optThis, true);
  }

  /**
   * Sets the callback when the instace is loaded
   *
   * @public
   * @function
   * @api stable
   */
  un(eventType, listener, optThis) {
    this.eventsManager_.remove(eventType, listener, optThis);
  }

  /**
   * Sets the callback when the instace is loaded
   *
   * @public
   * @function
   * @api stable
   */
  fire(eventType, args) {
    if (Utils.isNullOrEmpty(args)) {
      args = [this];
    }
    this.eventsManager_.fire(eventType, args);
  }
}
