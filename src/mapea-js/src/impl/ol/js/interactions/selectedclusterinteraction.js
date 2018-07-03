import OLSelect from "ol/interaction/Select";
import OLSourceVector from "ol/source/Vector";
import OLLayerVector from "ol/layer/Vector";
import OLCollection from "ol/Collection";
import OLFeature from "ol/Feature";
import OLPoint from "ol/geom/Point";
import OLLineString from "ol/geom/LineString";
import OLObservable from "ol/Observable";
import Utils from "../utils/utils";
import { easeOut } from "ol/easing";

export default class SelectCluster extends OLSelect {

  /**
   * @classdesc
   * Main constructor of the class. Creates interaction SelectCluster
   * control
   *
   * @constructor
   * @param {Object} options - ranges defined by user
   * @api stable
   */
  constructor(options) {
    options = options || {};

    this.map = options.map;
    this.pointRadius = options.pointRadius || 12;
    this.circleMaxObjects = options.circleMaxObjects || 10;
    this.maxObjects = options.maxObjects || 60;
    this.spiral = (options.spiral !== false);
    this.animate = options.animate;
    this.animationDuration = options.animationDuration || 500;
    this.selectCluster_ = (options.selectCluster !== false);
    this.maxFeaturesToSelect = options.maxFeaturesToSelect;
    this.facadeLayer_ = options.fLayer;
    this.style_ = options.style;

    // Create a new overlay layer for
    this.overlayLayer_ = new OLLayerVector({
      source: new OLSourceVector({
        features: new OLCollection(),
        useSpatialIndex: true
      }),
      name: 'Cluster overlay',
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      displayInLayerSwitcher: false,
      style: options.featureStyle
    });
    let overlay = this.overlayLayer_;

    // Add the overlay to selection
    if (options.layers) {
      if (typeof(options.layers) == "function") {
        let fn = options.layers;
        options.layers = (layer) => {
          return (layer === overlay || fn(layer));
        };
      }
      else if (options.layers.push) {
        options.layers.push(this.overlayLayer_);
      }
    }

    // Don't select links
    if (options.filter) {
      let fn = options.filter;
      options.filter = (f, l) => {
        if (!l && f.get("selectclusterlink")) return false;
        else return fn(f, l);
      };
    }
    else options.filter = (f, l) => {;
      if (!l && f.get("selectclusterlink")) return false;
      else return true;
    };
    this.filter_ = options.filter;

    OLSelect.call(this, options);
    this.on("select", this.selectCluster, this);
  }



  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  setMap(map) {
    if (this.getMap()) {
      if (this.getMap().getView()) {
        this.getMap().getView().un('change:resolution', this.clear, this);
      }
      this.getMap().removeLayer(this.overlayLayer_);
    }

    OLSelect.prototype.setMap.call(this, map);
    this.overlayLayer_.setMap(map);
    // map.addLayer(this.overlayLayer_);

    if (map && map.getView()) {
      map.getView().on('change:resolution', this.clear, this);
    }
  };

  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  clear() {
    this.getFeatures().clear();
    this.overlayLayer_.getSource().clear();
  };

  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  getLayer() {
    return this.overlayLayer_;
  };

  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  refreshViewEvents() {
    if (this.getMap() && this.getMap().getView()) {
      this.getMap().getView().on('change:resolution', this.clear, this);
    }
  };

  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  selectCluster(e) {
    // Nothing selected
    if (!e.selected.length) {
      this.clear();
      return;
    }
    // Get selection
    let feature = e.selected[0];
    // It's one of ours
    if (feature.get('selectclusterfeature')) return;

    let cluster = feature.get('features');
    // Not a cluster (or just one feature)
    if (!cluster || cluster.length == 1) {
      return;
    }

    if (!cluster || cluster.length > this.maxFeaturesToSelect) {
      if (this.facadeLayer_.getImpl().getNumZoomLevels() - this.map.getZoom() !== 1) {
        let extend = Utils.getFeaturesExtent(cluster);
        this.map.setBbox(extend);
        return;
      }
    }

    // Clic out of the cluster => close it
    let source = this.overlayLayer_.getSource();
    source.clear();

    // Remove cluster from selection
    if (!this.selectCluster_) {
      this.getFeatures().clear();
    }

    let center = feature.getGeometry().getCoordinates();
    let resolution = this.getMap().getView().getResolution();
    let radiusInPixels = resolution * this.pointRadius * (0.5 + cluster.length / 4);

    if (!this.spiral || cluster.length <= this.circleMaxObjects) {
      this.drawFeaturesAndLinsInCircle_(cluster, resolution, radiusInPixels, center);
    }
    else { // Start angle
      this.drawFeaturesAndLinsInSpiral_(cluster, resolution, center);
    }
    if (this.animate) {
      this.animateCluster_(center, () => this.overlayLayer_.getSource().refresh());
    }
  };


  /**
   * TODO
   *
   * @private
   * @function
   */
  drawFeaturesAndLinsInCircle_(cluster, resolution, radiusInPixels, center) {
    let max = Math.min(cluster.length, this.circleMaxObjects);
    for (let i = 0; i < max; i++) {
      let a = 2 * Math.PI * i / max;
      if (max == 2 || max == 4) a += Math.PI / 4;
      let newPoint = [center[0] + radiusInPixels * Math.sin(a), center[1] + radiusInPixels * Math.cos(a)];
      this.drawAnimatedFeatureAndLink_(cluster[i], resolution, center, newPoint);
    }
  };

  /**
   * TODO
   *
   * @private
   * @function
   */
  drawFeaturesAndLinsInSpiral_(cluster, resolution, center) {
    let a = 0;
    let r;
    let d = 2 * this.pointRadius;
    let max = Math.min(this.maxObjects, cluster.length);
    // Feature on a spiral
    for (let i = 0; i < max; i++) { // New radius => increase d in one turn
      r = d / 2 + d * a / (2 * Math.PI);
      // Angle
      a = a + (d + 0.1) / r;
      let dx = resolution * r * Math.sin(a);
      let dy = resolution * r * Math.cos(a);
      let newPoint = [center[0] + dx, center[1] + dy];
      this.drawAnimatedFeatureAndLink_(cluster[i], resolution, center, newPoint);
    }
  };

  /**
   * TODO
   *
   * @private
   * @function
   */
  drawAnimatedFeatureAndLink_(clusterFeature, resolution, center, newPoint) {
    let cf = new OLFeature();
    clusterFeature.getKeys().forEach(attr => {
      cf.set(attr, clusterFeature.get(attr));
    });

    let clusterStyleFn = clusterFeature.getStyle();
    if (!clusterStyleFn) {
      clusterStyleFn = this.facadeLayer_.getStyle().getImpl().oldOLLayer_.getStyle();
    }
    let olClusterStyles = clusterStyleFn(clusterFeature, resolution);
    let clonedStyles = olClusterStyles.map ? olClusterStyles.map(s => s.clone()) : [olClusterStyles.clone()];

    cf.setId(clusterFeature.getId());
    cf.setStyle(clonedStyles);
    cf.set('features', [clusterFeature]);
    cf.set('geometry', new OLPoint(newPoint));
    this.overlayLayer_.getSource().addFeature(cf);

    let lk = new OLFeature({
      'selectclusterlink': true,
      geometry: new OLLineString([center, newPoint])
    });
    this.overlayLayer_.getSource().addFeature(lk);
  };

  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  animateCluster_(center, callbackFn) {
    // Stop animation (if one is running)
    if (this.listenerKey_) {
      this.overlayLayer_.setVisible(true);
      OLObservable.unByKey(this.listenerKey_);
    }

    // Features to animate
    let features = this.overlayLayer_.getSource().getFeatures();
    if (!features.length) return;

    this.overlayLayer_.setVisible(false);
    let duration = this.animationDuration || 500;
    let start = new Date().getTime();

    // Animate function
    const animate = (event) => {
      let vectorContext = event.vectorContext;
      // Retina device
      // let ratio = event.frameState.pixelRatio;
      let res = event.target.getView().getResolution();
      let e = easeOut((event.frameState.time - start) / duration);
      for (let i = 0; i < features.length; i++)
        if (features[i].get('features')) {
          let feature = features[i];
          let mFeature = feature.get('features')[0];
          let pt = feature.getGeometry().getCoordinates();
          pt[0] = center[0] + e * (pt[0] - center[0]);
          pt[1] = center[1] + e * (pt[1] - center[1]);
          let geo = new OLPoint(pt);

          // draw links
          let st2 = this.overlayLayer_.getStyle()(mFeature, res).map(s => s.clone());
          for (let s = 0; s < st2.length; s++) {
            let style = st2[s];
            if (!style.getImage().size_) {
              style.getImage().size_ = [42, 42];
            }
            let imgs = style.getImage();
            // let sc;
            if (imgs) {
              // sc = imgs.getScale();
              // imgs.setScale(ratio); // setImageStyle don't check retina
            }
            vectorContext.setStyle(style);
            vectorContext.drawLineString(new OLLineString([center, pt]));
          }

          // Image style
          let clusterStyleFn = mFeature.getStyle();
          if (!clusterStyleFn) {
            clusterStyleFn = this.facadeLayer_.getStyle().getImpl().oldOLLayer_.getStyle();
          }
          let olClusterStyles = clusterStyleFn(mFeature, res);
          let st = olClusterStyles.map ? olClusterStyles.map(s => s.clone()) : [olClusterStyles.clone()];
          for (let s = 0; s < st.length; s++) {
            let style = st[s];
            let imgs = style.getImage();

            // let sc;
            if (imgs) {
              // sc = imgs.getScale();
              // imgs.setScale(ratio); // setImageStyle don't check retina
              if (imgs.getOrigin() == null) {
                imgs.origin_ = [];
              }
              if (imgs.getAnchor() == null) {
                imgs.normalizedAnchor_ = [];
              }
              if (imgs.getSize() == null) {
                imgs.size_ = [42, 42];
              }
            }
            // OL3 > v3.14
            // if (vectorContext.setStyle) {
            vectorContext.setStyle(style);
            vectorContext.drawGeometry(geo);
            // }
            // if (imgs) imgs.setScale(sc);
          }
        }
      // Stop animation and restore cluster visibility
      if (e > 1.0) {
        OLObservable.unByKey(this.listenerKey_);
        this.overlayLayer_.setVisible(true);
        callbackFn();
        // text on chart style not show
        // this.overlayLayer_.changed();
        return;
      }
      // tell OL3 to continue postcompose animation
      event.frameState.animate = true;
    }

    // Start a new postcompose animation
    this.listenerKey_ = this.getMap().on('postcompose', animate, this);
    //select.getMap().renderSync();
  };
}
