goog.provide('M.style.Proportional');

goog.require('M.Style');
/**
 * @namespace M.style.Proportional
 */
(function() {


  /**
   * @classdesc
   * Main constructor of the class. Creates a style Proportional
   * with parameters specified by the user
   *
   * @constructor
   * @extends {M.Style}
   * @param {String}
   * @param {Array<Style>}
   * @param {M.style.quantification}
   * @param {object}
   * @api stable
   */
  M.style.Proportional = (function(attributeName, minRadius = 5, maxRadius = 15, style = new M.style.Point({}), options = {}) {
    if (M.utils.isNullOrEmpty(attributeName)) {
      M.Exception('El attribute name no puede ser nulo o vacío');
    }
    this.attributeName_ = attributeName;
    this.minRadius_ = minRadius < 1 ? 1 : minRadius;
    this.maxRadius_ = maxRadius < minRadius ? minRadius + 10 : maxRadius;
    this.style_ = style;
    this.layer_ = null;

    goog.base(this, options, {});
  });
  goog.inherits(M.style.Proportional, M.Style);

  /**
   * This function apply the style to specified layer
   * @function
   * @public
   * @param {M.Layer.Vector} layer - Layer where to apply choropleth style
   * @api stable
   */
  M.style.Proportional.prototype.apply = function(layer) {
    this.layer_ = layer;
    this.update_();
  };

  /**
   * This function returns the attribute name defined by user
   * @function
   * @public
   * @return {String} attribute name of Style
   * @api stable
   */
  M.style.Proportional.prototype.getAttributeName = function() {
    return this.attributeName_;
  };

  /**
   * This function set the attribute name defined by user
   * @function
   * @public
   * @param {String} attributeName - attribute name to set
   * @api stable
   */
  M.style.Proportional.prototype.setAttributeName = function(attributeName) {
    this.attributeName_ = attributeName;
    this.update_();
    return this;
  };

  /**
   * This function returns the style point defined by user
   * @function
   * @public
   * @return {M.style.Point} style point of each feature
   */
  M.style.Proportional.prototype.getStyle = function() {
    return this.style_;
  };

  /**
   * This function set the style point defined by user
   * @function
   * @public
   * @param {M.style.Point} style - style point to set
   * @api stable
   */
  M.style.Proportional.prototype.setStyle = function(style) {
    this.style_ = style;
    this.update_();
    return this;
  };

  /**
   * This function get the minimum radius of the style point
   * @function
   * @public
   * @return {number} minimum radius of style point
   * @api stable
   */
  M.style.Proportional.prototype.getMinRadius = function() {
    return this.minRadius_;
  };

  /**
   * This function set the minimum radius of the style point
   * @function
   * @public
   * @param {number} minRadius - minimum radius of style point
   * @api stable
   */
  M.style.Proportional.prototype.setMinRadius = function(minRadius) {
    this.minRadius_ = minRadius;
    this.update_();
    return this;
  };

  /**
   * This function get the maximum radius of the style point
   * @function
   * @public
   * @return {number} maximum radius of style point
   * @api stable
   */
  M.style.Proportional.prototype.getMaxRadius = function() {
    return this.maxRadius_;
  };

  /**
   * This function set the maximum radius of the style point
   * @function
   * @public
   * @param {number} minRadius - maximum radius of style point
   * @api stable
   */
  M.style.Proportional.prototype.setMaxRadius = function(maxRadius) {
    this.maxRadius_ = maxRadius;
    this.update_();
    return this;
  };

  /**
   * This function updates the style
   * @function
   * @public
   * @api stable
   */
  M.style.Proportional.prototype.update_ = function() {
    let features = this.layer_.getFeatures();
    let [minRadius, maxRadius] = [this.minRadius_, this.maxRadius_];
    let attributeName = this.attributeName_;
    let [minValue, maxValue] = M.style.Proportional.getMinMaxValues_(features, attributeName);
    let style = this.style_;
    style.set('radius', function(feature) {
      let value = feature.getAttribute(attributeName);
      return M.style.Proportional.calcProportion(value, minValue, maxValue, minRadius, maxRadius);
    });
    this.layer_.setStyle(style);
  };

  /**
   * This function gets the min value of feature's atributte.
   * @function
   * @public
   * @api stable
   */
  M.style.Proportional.getMinMaxValues_ = function(features, attributeName) {
    // Remodelar este despropósito
    let [minValue, maxValue] = [undefined, undefined];
    let filteredFeatures = features.filter(feature => !isNaN(feature.getAttribute(attributeName))).map(f => parseInt(f.getAttribute(attributeName)));
    let index = 1;
    if (!M.utils.isNullOrEmpty(filteredFeatures)) {
      minValue = filteredFeatures[0];
      maxValue = filteredFeatures[0];
      while (index < filteredFeatures.length - 1) {
        let posteriorValue = filteredFeatures[index + 1];
        minValue = minValue < posteriorValue ? minValue : posteriorValue;
        maxValue = maxValue < posteriorValue ? posteriorValue : maxValue;
        index++;
      }
    };
    return [minValue, maxValue];
  };

  /**
   * This function calculates the proportion of value using minimum value, maximum value,
   * minimum radius, maximum value.
   * @function
   * @public
   * @api stable
   */
  M.style.Proportional.calcProportion = function(value, minValue, maxValue, minRadius, maxRadius) {
    return (((value - minValue) * (maxRadius - minRadius)) / (maxValue - minValue)) + minRadius;
  };
})();
