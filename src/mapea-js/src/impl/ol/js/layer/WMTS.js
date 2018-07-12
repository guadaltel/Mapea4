import Utils from "facade/js/util/Utils";
import LayerBase from "./Layer";
import Config from "configuration";
import GetCapabilities from "../util/WMSCapabilities";
import Remote from "facade/js/util/Remote";

export default class WMTS extends LayerBase {
  /**
   * @classdesc
   * Main constructor of the class. Creates a WMTS layer
   * with parameters specified by the user
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options custom options for this layer
   * @api stable
   */
  constructor(options = {}) {

    // calls the super constructor
    super(options);

    /**
     * Options from the GetCapabilities
     * @private
     * @type {M.impl.format.WMTSCapabilities}
     */
    this.capabilitiesOptions = null;
  }

  /**
   * This function sets the map object of the layer
   *
   * @public
   * @function
   * @param {M.impl.Map} map
   * @api stable
   */
  addTo(map) {
    this.map = map;

    // calculates the resolutions from scales
    if (!Utils.isNull(this.options) && !Utils.isNull(this.options.minScale) && !Utils.isNull(this.options.maxScale)) {
      let units = this.map.getMapImpl().getView().getProjection().getUnits();
      this.options.minResolution = Utils.getResolutionFromScale(this.options.minScale, units);
      this.options.maxResolution = Utils.getResolutionFromScale(this.options.maxScale, units);
    }

    // adds layer from capabilities
    this.getCapabilitiesOptions_().then(capabilitiesOptions => this.addLayer_(capabilitiesOptions));
  }

  /**
   * This function sets the resolutions for this layer
   *
   * @public
   * @function
   * @param {Array<Number>} resolutions
   * @api stable
   */
  setResolutions(resolutions) {
    // gets the projection
    let projection = ol.proj.get(this.map.getProjection().code);

    // gets the extent
    let extent = this.map.getMaxExtent();
    let olExtent;
    if (!Utils.isNullOrEmpty(extent)) {
      olExtent = [extent.x.min, extent.y.min, extent.x.max, extent.y.max];
    }
    else {
      olExtent = projection.getExtent();
    }

    if (!Utils.isNull(this.capabilitiesParser)) {
      // gets matrix
      let matrixSet = this.capabilitiesParser.getMatrixSet(this.name);
      let matrixIds = this.capabilitiesParser.getMatrixIds(this.name);

      // gets format
      let format = this.capabilitiesParser.getFormat(this.name);

      let newSource = new ol.source.WMTS({
        url: this.url,
        layer: this.name,
        matrixSet: matrixSet,
        format: format,
        projection: projection,
        tileGrid: new ol.tilegrid.WMTS({
          origin: ol.extent.getBottomLeft(olExtent),
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        extent: olExtent
      });
      this.ol3Layer.setSource(newSource);
    }
    else {
      // adds layer from capabilities
      this.getCapabilities_().then(capabilitiesParser => {
        this.capabilitiesParser = capabilitiesParser;

        // gets matrix
        let matrixSet = this.capabilitiesParser.getMatrixSet(this.name);
        let matrixIds = this.capabilitiesParser.getMatrixIds(this.name);

        // gets format
        let format = this.capabilitiesParser.getFormat(this.name);

        let newSource = new ol.source.WMTS({
          url: this.url,
          layer: this.name,
          matrixSet: matrixSet,
          format: format,
          projection: projection,
          tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getBottomLeft(olExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
          }),
          extent: olExtent
        });
        this.ol3Layer.setSource(newSource);
      });
    }
  }

  /**
   * This function sets the visibility of this layer
   *
   * @function
   * @api stable
   */
  setVisible(visibility) {
    this.visibility = visibility;
    if (this.inRange() === true) {
      // if this layer is base then it hides all base layers
      if ((visibility === true) && (this.transparent !== true)) {
        // hides all base layers
        this.map.getBaseLayers()
          .filter(layer => !layer.equals(this) && layer.isVisible())
          .forEach(layer => layer.setVisible(false));

        // set this layer visible
        if (!Utils.isNullOrEmpty(this.ol3Layer)) {
          this.ol3Layer.setVisible(visibility);
        }

        // updates resolutions and keep the bbox
        let oldBbox = this.map.getBbox();
        this.map.getImpl().updateResolutionsFromBaseLayer();
        if (!Utils.isNullOrEmpty(oldBbox)) {
          this.map.setBbox(oldBbox);
        }
      }
      else if (!Utils.isNullOrEmpty(this.ol3Layer)) {
        this.ol3Layer.setVisible(visibility);
      }
    }
  }

  /**
   * This function add this layer as unique layer
   *
   * @private
   * @function
   */
  addLayer_(capabilitiesOptions) {
    // gets resolutions from defined min/max resolutions
    let minResolution = this.options.minResolution;
    let maxResolution = this.options.maxResolution;
    capabilitiesOptions.format = this.options.format || capabilitiesOptions.format;

    this.ol3Layer = new ol.layer.Tile({
      visible: this.options.visibility,
      source: new ol.source.WMTS(capabilitiesOptions),
      minResolution: minResolution,
      maxResolution: maxResolution
    });

    // keeps z-index values before ol resets
    let zIndex = this.zIndex_;
    this.map.getMapImpl().addLayer(this.ol3Layer);

    // sets its z-index
    if (zIndex !== null) {
      this.setZIndex(zIndex);
    }

    // activates animation always for WMTS layers
    this.ol3Layer.set("animated", true);

    this.fire(EventsManager.ADDED_TO_MAP, this);
  }

  /**
   * This function gets the capabilities
   * of the WMTS service
   *
   * @private
   * @function
   */
  getCapabilitiesOptions_() {
    // name
    let layerName = this.name;
    // matrix set
    let matrixSet = this.matrixSet;
    if (Utils.isNullOrEmpty(matrixSet)) {
      /* if no matrix set was specified then
         it supposes the matrix set has the name
         of the projection*/
      matrixSet = this.map.getProjection().code;
    }
    return this.getCapabilities().then(parsedCapabilities => {
      return ol.source.WMTS.optionsFromCapabilities(parsedCapabilities, {
        'layer': layerName,
        'matrixSet': matrixSet
      });
    });
  }

  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  getCapabilities() {
    let getCapabilitiesUrl = Utils.getWMTSGetCapabilitiesUrl(this.url);
    let parser = new ol.format.WMTSCapabilities();
    return new Promise((success, fail) => {
      Remote.get(getCapabilitiesUrl).then(response => {
        let getCapabilitiesDocument = response.xml;
        let parsedCapabilities = parser.read(getCapabilitiesDocument);
        success.call(this, parsedCapabilities);
      });
    });
  }

  /**
   * This function gets the min resolution for
   * this WMTS
   *
   * @public
   * @function
   * @api stable
   */
  getMinResolution() {
    return this.options.minResolution;
  }

  /**
   * This function gets the max resolution for
   * this WMTS
   *
   * @public
   * @function
   * @api stable
   */
  getMaxResolution() {
    return this.options.maxResolution;
  }

  /**
   * This function destroys this layer, cleaning the HTML
   * and unregistering all events
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    let olMap = this.map.getMapImpl();
    if (!Utils.isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
    }
    this.map = null;
  }

  /**
   * This function checks if an object is equals
   * to this layer
   *
   * @function
   * @api stable
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof WMTS) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.matrixSet === obj.matrixSet);
    }

    return equals;
  }
}