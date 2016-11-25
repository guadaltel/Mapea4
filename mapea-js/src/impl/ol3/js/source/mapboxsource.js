goog.provide('M.impl.source.Mapbox');

goog.require('ol.Attribution');
goog.require('ol.source.OSM');



/**
 * @classdesc
 * Layer source for the OpenStreetMap tile server.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.OSMOptions=} opt_options Open Street Map options.
 * @api stable
 */
M.impl.source.Mapbox = function (opt_options) {

  var options = opt_options || {};

  var attributions;
  if (options.attributions !== undefined) {
    attributions = options.attributions;
  }
  else {
    attributions = [M.impl.source.Mapbox.ATTRIBUTION];
  }

  var url = options.url !== undefined ?
    options.url : M.config.MAPBOX_URL;

  url += options.name;
  url += '/{z}/{x}/{y}.';
  url += options.extension !== undefined ?
    options.extension : M.config.MAPBOX_EXTENSION;

  // appends
  goog.base(this, {
    attributions: attributions,
    url: url
  });

};
goog.inherits(M.impl.source.Mapbox, ol.source.OSM);


/**
 * Set the URL to use for requests.
 * @param {string} url URL.
 * @api stable
 */
M.impl.source.Mapbox.prototype.setUrl = function (url) {
  let urlFunction = ol.TileUrlFunction.createFromTemplates(
    ol.TileUrlFunction.expandUrl(url), this.tileGrid);
  this.setTileUrlFunction(function () {
    let urlResolved = urlFunction.apply(this, arguments);
    let tokenParam = {};
    tokenParam[M.config.MAPBOX_TOKEN_NAME] = M.config.MAPBOX_TOKEN_VALUE;
    return M.utils.addParameters(urlResolved, tokenParam);
  });
  this.urls = [url];
};

/**
 * The attribution containing a link to the OpenStreetMap Copyright and License
 * page.
 * @const
 * @type {ol.Attribution}
 * @api
 */
M.impl.source.Mapbox.ATTRIBUTION = new ol.Attribution({
  html: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
});
