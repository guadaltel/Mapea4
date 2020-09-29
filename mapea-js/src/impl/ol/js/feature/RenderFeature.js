import FacadeRenderFeature from 'M/feature/RenderFeature';
import { isNullOrEmpty } from 'M/util/Utils';

/**
 * @module M/impl/RenderFeature
 */
class RenderFeature {
  /**
   * @classdesc
   * Main constructor of the class. Create a RenderFeature
   * @constructor
   */
  constructor() {
    /**
     * OL Feature
     * @private
     * @type {ol/render/Feature}
     */
    this.olFeature_ = null;
  }

  /**
   * This function returns the openlayers object of the features
   * @public
   * @function
   * @return {OLFeature} returns the openlayers object of the features
   * @api stable
   */
  getOLFeature() {
    return this.olFeature_;
  }

  /**
   * This function set the openlayers object of the features
   * @public
   * @param {OLFeature} olFeature - ol Feature to feature
   * @function
   * @api stable
   */
  setOLFeature(olFeature) {
    if (!isNullOrEmpty(olFeature)) {
      this.olFeature_ = olFeature;
    }
  }

  /**
   * This function return attributes feature
   * @public
   * @return {Object} Attributes feature
   * @function
   * @api stable
   */
  getAttributes() {
    const properties = this.olFeature_.getProperties();
    return properties;
  }

  /**
   * This funcion transform OLFeature to M.Feature
   *
   * @public
   * @function
   * @param {OLFeature} olFeature - OLFeature
   * @param {boolean} canBeModified
   * @return {M.Feature}  facadeFeature - M.Feature
   * @api stable
   */
  static olFeature2Facade(olFeature, canBeModified) {
    let facadeFeature = null;
    if (!isNullOrEmpty(olFeature)) {
      facadeFeature = new FacadeRenderFeature();
      facadeFeature.getImpl().setOLFeature(olFeature);
    }
    return facadeFeature;
  }

  /**
   * This funcion transform M.Feature to OLFeature
   *
   * @public
   * @function
   * @param {M.Feature}  facadeFeature - M.Feature
   * @return {OLFeature} olFeature - OLFeature
   * @api stable
   */
  static facade2OLFeature(feature) {
    return feature.getImpl().getOLFeature();
  }

  /**
   * This function returns the value of the indicated attribute
   *
   * @public
   * @function
   * @param {string} attribute - Name attribute
   * @return  {string|number|object} returns the value of the indicated attribute
   * @api stable
   */
  getAttribute(attribute) {
    return this.olFeature_.get(attribute);
  }

  /**
   * This function set facade class vector
   *
   * @function
   * @param {object} obj - Facade vector
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeFeature_ = obj;
  }

  /**
   * This function returns de centroid of feature
   *
   * @public
   * @function
   * @return {Array<number>}
   * @api stable
   */
  getCentroid() {}
}

export default RenderFeature;
