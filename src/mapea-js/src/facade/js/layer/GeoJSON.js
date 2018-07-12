import LayerVector from './Vector';
import Utils from '../util/Utils';
import Exception from '../exception/exception';
import GeoJSONImpl from '../../../impl/ol/js/layer/GeoJSON';
import StyleCluster from '../style/Cluster';
import LayerType from './Type';
import GeomGeojson from '../geom/GeoJSON';
import EvtManager from "../event/Manager";

export default class GeoJSON extends LayerVector {
  /**
   * @classdesc
   * Main constructor of the class. Creates a WMS layer
   * with parameters specified by the user
   *
   * @constructor
   * @extends {M.layer.Vector}
   * @param {string|Mx.parameters.GeoJSON} userParameters parameters
   * @param {Mx.parameters.LayerOptions} options provided by the user
   * @api stable
   */
  constructor(parameters, options = {}) {

    /**
     * Implementation of this layer
     * @public
     * @type {M.impl.layer.GeoJSON}
     */
    let impl = new GeoJSONImpl(parameters, options);

    // calls the super constructor
    super(options, impl);

    // checks if the implementation can create KML layers
    if (Utils.isUndefined(GeoJSONImpl)) {
      Exception('La implementación usada no puede crear capas GeoJSON');
    }

    // checks if the param is null or empty
    if (Utils.isNullOrEmpty(parameters)) {
      Exception('No ha especificado ningún parámetro');
    }

    if (Utils.isString(parameters)) {
      this.url = parameters;
    }
    else if (Utils.isArray(parameters)) {
      this.source = parameters;
    }
    else {
      // url
      this.url = parameters.url;

      // name
      this.name = parameters.name;

      // source
      this.source = parameters.source;

      // extract
      this.extract = parameters.extract;
      //crs
      if (!Utils.isNullOrEmpty(parameters.crs)) {
        if (Utils.isNullOrEmpty(this.source)) {
          this.source = {
            "type": "FeatureCollection",
            "features": []
          };
        }
        this.source['crs'] = {
          "type": "EPSG",
          "properties": {
            "code": parameters.crs
          }
        };
      }
    }

    if (Utils.isNullOrEmpty(this.extract)) {
      this.extract = true; // by default
    }

    // options
    this.options = options;
  }

  /**
   * 'type' This property indicates if
   * the layer was selected
   */
  get type() {
    return LayerType.GeoJSON;
  }

  set type(newType) {
    if (!Utils.isUndefined(newType) &&
      !Utils.isNullOrEmpty(newType) && (newType !== LayerType.GeoJSON)) {
      Exception('El tipo de capa debe ser \''.concat(LayerType.GeoJSON).concat('\' pero se ha especificado \'').concat(newType).concat('\''));
    }
  }

  /**
   * 'extract' the features properties
   */
  get source() {
    return this.impl.source;
  }

  set source(newSource) {
    this.getImpl().source = newSource;
  }

  /**
   * 'extract' the features properties
   */
  get extract() {
    return this.getImpl().extract;
  }

  set extract(newExtract) {
    if (!Utils.isNullOrEmpty(newExtract)) {
      if (Utils.isString(newExtract)) {
        this.getImpl().extract = (Utils.normalize(newExtract) === 'true');
      }
      else {
        this.getImpl().extract = newExtract;
      }
    }
    else {
      this.getImpl().extract = true;
    }
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

    if (obj instanceof GeoJSON) {
      equals = this.name === obj.name;
      equals = equals && (this.extract === obj.extract);
    }

    return equals;
  }

  /**
   * This function checks if an object is equals
   * to this layer
   *
   * @function
   * @api stable
   */
  setSource(source) {
    this.source = source;
    this.getImpl().refresh(source);
  }

  setStyle(style, applyToFeature = false) {
    let isNullStyle = false;
    if (style === null) {
      isNullStyle = true;
    }
    const applyStyleFn = () => {
      if (Utils.isNullOrEmpty(style)) {
        style = Utils.generateStyleLayer(GeoJSON.DEFAULT_OPTIONS_STYLE, this);
      }
      let isCluster = style instanceof StyleCluster;
      let isPoint = [GeomGeojson.type.POINT, GeomGeojson.type.MULTI_POINT].includes(Utils.getGeometryType(this));
      if (style instanceof Style && (!isCluster || isPoint)) {
        if (!Utils.isNullOrEmpty(this.style_)) {
          this.style_.unapply(this);
        }
        style.apply(this, applyToFeature, isNullStyle);
        this.style_ = style;
      }
      if (!Utils.isNullOrEmpty(this.getImpl().getMap())) {
        let layerswitcher = this.getImpl().getMap().getControls('layerswitcher')[0];
        if (!Utils.isNullOrEmpty(layerswitcher)) {
          layerswitcher.render();
        }
      }
      this.fire(EvtManager.CHANGE_STYLE, [style, this]);
    };

    if (this.getImpl().isLoaded()) {
      applyStyleFn.bind(this)();
    }
    else {
      this.once(EvtManager.LOAD, applyStyleFn, this);
    }
  }

}

/**
 * Options style by default
 * @const
 * @type {object}
 * @public
 * @api stable
 */
GeoJSON.DEFAULT_OPTIONS_STYLE = {
  fill: {
    color: 'rgba(255, 255, 255, 0.4)',
    opacity: 0.4
  },
  stroke: {
    color: "#3399CC",
    width: 1.5
  },
  radius: 5,
};