import Utils from "facade/js/util/Utils";
import ImplUtils from "../util/Utils";
import EventsManager from "facade/js/event/Manager";
import StyleCluster from "facade/js/style/Cluster";
import Style from "facade/js/style/Style";
import Feature from "../feature/Feature";

export default class Vector extends LayerBase {
  /**
   * @classdesc
   * Main constructor of the class. Creates a Vector layer
   * with parameters specified by the user
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options - custom options for this layer
   * @api stable
   */
  constructor(options) {

    super(options);

    /**
     * The facade layer instance
     * @private
     * @type {M.layer.Vector}
     * @expose
     */
    this.facadeVector_ = null;

    /**
     * Features of this layer
     * @private
     * @type {Array<M.Feature>}
     * @expose
     */
    this.features_ = [];

    /**
     * Postcompose event key
     * @private
     * @type {string}
     */
    this.postComposeEvtKey_ = null;

    /**
     * Property that sets if the
     * layer is loaded
     *
     * @private
     * @type {bool}
     */
    this.load_ = false;

    /**
     * TODO
     */
    this.loaded_ = false;

    // [WARN]
    //applyOLLayerSetStyleHook();
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
    map.on(EventsManager.CHANGE_PROJ, this.setProjection_, this);

    this.ol3Layer = new ol.layer.Vector();
    this.updateSource_();

    this.setVisible(this.visibility);

    // if (this.zIndex_ !== null) {
    //   this.setZIndex(this.zIndex_);
    // }
    // this.setZIndex(999999);

    let olMap = this.map.getMapImpl();
    olMap.addLayer(this.ol3Layer);
  }
  /**
   * This function sets the map object of the layer
   *
   * @private
   * @function
   */
  updateSource_() {
    if (Utils.isNullOrEmpty(this.ol3Layer.getSource())) {
      this.ol3Layer.setSource(new ol.source.Vector());
    }
    this.redraw();
    this.loaded_ = true;
    this.fire(EventsManager.LOAD, [this.features_]);
  }

  /**
   * This function indicates if the layer is in range
   *
   * @function
   * @api stable
   * @expose
   */
  inRange() {
    // vectors are always in range
    return true;
  }


  /**
   * This function add features to layer
   *
   * @function
   * @public
   * @param {Array<M.feature>} features - Features to add
   * @api stable
   */
  addFeatures(features, update) {
    features.forEach(newFeature => {
      let feature = this.features_.find(feature => feature.equals(newFeature));
      if (Utils.isNullOrEmpty(feature)) {
        this.features_.push(newFeature);
      }
    });
    if (update) {
      this.updateLayer_();
    }
    let style = this.facadeVector_.getStyle();
    if (style instanceof StyleCluster) {
      style.getImpl().deactivateTemporarilyChangeEvent(this.redraw.bind(this));
      style.refresh();
    }
    else {
      this.redraw();
    }
  }


  /**
   * This function add features to layer and redraw with a layer style
   * @function
   * @private
   * @api stable
   */
  updateLayer_() {
    let style = this.facadeVector_.getStyle();
    if (!Utils.isNullOrEmpty(style)) {
      if (style instanceof Style) {
        this.facadeVector_.setStyle(style);
      }
      else if (style instanceof StyleCluster) {
        let cluster = this.facadeVector_.getStyle();
        cluster.unapply(this.facadeVector_);
        cluster.getOldStyle().apply(this.facadeVector_);
        cluster.apply(this.facadeVector_);
      }
      else {
        style.apply(this.facadeVector_);
      }
    }
  }


  /**
   * This function returns all features or discriminating by the filter
   *
   * @function
   * @public
   * @param {boolean} skipFilter - Indicates whether skyp filter
   * @param {M.Filter} filter - Filter to execute
   * @return {Array<M.Feature>} returns all features or discriminating by the filter
   * @api stable
   */
  getFeatures(skipFilter, filter) {
    let features = this.features_;
    if (!skipFilter) features = filter.execute(features);
    return features;
  }

  /**
   * This function returns the feature with this id
   *
   * @function
   * @public
   * @param {string|number} id - Id feature
   * @return {null|M.feature} feature - Returns the feature with that id if it is found, in case it is not found or does not indicate the id returns null
   * @api stable
   */
  getFeatureById(id) {
    return this.features_.filter(feature => feature.getId() === id)[0];
  }

  /**
   * This function remove the features indicated
   *
   * @function
   * @public
   * @param {Array<M.feature>} features - Features to remove
   * @api stable
   */
  removeFeatures(features) {
    this.features_ = this.features_.filter(f => !(features.includes(f)));
    let style = this.facadeVector_.getStyle();
    if (style instanceof StyleCluster) {
      style.getImpl().deactivateTemporarilyChangeEvent(this.redraw.bind(this));
      style.refresh();
    }
    else {
      this.redraw();
    }
  }

  /**
   * This function redraw layer
   *
   * @function
   * @public
   * @api stable
   */
  redraw() {
    let olLayer = this.getOL3Layer();
    if (!Utils.isNullOrEmpty(olLayer)) {
      let style = this.facadeVector_.getStyle();
      let olSource = olLayer.getSource();
      if (olSource instanceof ol.source.Cluster) {
        olSource = olSource.getSource();
      }

      if (style instanceof StyleCluster) {
        style.getImpl().deactivateChangeEvent();
      }

      // remove all features from ol vector
      let olFeatures = [...olSource.getFeatures()];
      olFeatures.forEach(olSource.removeFeature, olSource);

      let features = this.facadeVector_.getFeatures();
      olSource.addFeatures(features.map(Feature.facade2OLFeature));

      if (style instanceof StyleCluster) {
        style.getImpl().activateChangeEvent();
      }
    }
  }

  /**
   * This function return extent of all features or discriminating by the filter
   *
   * @function
   * @param {boolean} skipFilter - Indicates whether skip filter
   * @param {M.Filter} filter - Filter to execute
   * @return {Array<number>} Extent of features
   * @api stable
   */
  getFeaturesExtent(skipFilter, filter) {
    let features = this.getFeatures(skipFilter, filter);
    return ImplUtils.getFeaturesExtent(features);
  }

  /**
   * TODO
   * @public
   * @function
   * @param {ol.Feature} feature
   * @api stable
   */
  selectFeatures(features, coord, evt) {
    let feature = features[0];
    if (!Utils.isNullOrEmpty(feature)) {
      let clickFn = feature.getAttribute('vendor.mapea.click');
      if (Utils.isFunction(clickFn)) {
        clickFn(evt, feature);
      }
    }
  }

  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  unselectFeatures() {
    this.map.removePopup();
  }

  /**
   * This function set facade class vector
   *
   * @function
   * @param {object} obj - Facade vector
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeVector_ = obj;
  }

  /**
   * This function sets the map object of the layer
   *
   * @private
   * @function
   */
  setProjection_(oldProj, newProj) {
    if (oldProj.code !== newProj.code) {
      let srcProj = ol.proj.get(oldProj.code);
      let dstProj = ol.proj.get(newProj.code);

      let style = this.facadeVector_.getStyle();
      if (style instanceof StyleCluster) {
        style.getImpl().deactivateChangeEvent();
      }

      this.facadeVector_.getFeatures()
        .forEach(feature => feature.getImpl().getOLFeature().getGeometry().transform(srcProj, dstProj));

      if (style instanceof StyleCluster) {
        style.getImpl().activateChangeEvent();
      }
    }
  }

  /**
   * This function checks if an object is equals
   * to this layer
   *
   * @function
   * @param {object} obj - Object to compare
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof Vector) {
      equals = true;
    }
    return equals;
  }

  /**
   * This function refresh layer
   * @function
   * @api stable
   */
  refresh() {
    this.getOL3Layer().getSource().clear();
  }

  /**
   * TODO
   * @function
   * @api stable
   */
  isLoaded() {
    return this.loaded_;
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
}