import PrinterControlImpl from '../../impl/ol/js/printercontrol';
import printerHTML from '../../templates/printer';

/**
 * Esta función determina cuándo ha terminado la impresión del mapa
 * Se hace la comprobación cada 1 segundo con la petición get
 * @param {*} url
 * @param {*} callback
 */
const getStatus = (url, callback) => {
  M.remote.get(url).then((response) => {
    const statusJson = JSON.parse(response.text);
    const { status } = statusJson;
    if (status === 'finished') {
      callback();
    } else if (status === 'error' || status === 'cancelled') {
      callback();
      M.dialog.error('Se ha producido un error en la impresión');
    } else {
      setTimeout(() => getStatus(url, callback), 1000);
    }
  });
};

export default class PrinterControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a WMCSelector
   * control to provides a way to select an specific WMC
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(url, params, options) {
    // implementation of this control
    const impl = new PrinterControlImpl();

    super(impl, PrinterControl.NAME);

    // checks if the implementation can manage this control
    if (M.utils.isUndefined(PrinterControlImpl)) {
      M.exception('La implementación usada no puede crear controles Printer');
    }

    if (M.utils.isUndefined(PrinterControlImpl.prototype.encodeLayer)) {
      M.exception('La implementación usada no posee el método encodeLayer');
    }

    if (M.utils.isUndefined(PrinterControlImpl.prototype.encodeLegend)) {
      M.exception('La implementación usada no posee el método encodeLegend');
    }

    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.url_ = url;

    /**
     * Facade of the map
     * @private
     * @type {HTMLElement}
     */
    this.inputTitle_ = null;

    /**
     * Facade of the map
     * @private
     * @type {HTMLElement}
     */
    this.areaDescription_ = null;

    /**
     * Facade of the map
     * @private
     * @type {HTMLElement}
     */
    this.layout_ = null;

    /**
     * Facade of the map
     * @private
     * @type {HTMLElement}
     */
    this.format_ = null;

    /**
     * Facade of the map
     * @private
     * @type {HTMLElement}
     */
    this.dpi_ = null;

    /**
     * Facade of the map
     * @private
     * @type {HTMLElement}
     */
    this.forceScale_ = null;

    /**
     * Facade of the map
     * @private
     * @type {Promise}
     */
    this.params_ = params || {};

    /**
     * Facade of the map
     * @private
     * @type {HTMLElement}
     */
    this.queueContainer_ = null;

    /**
     * Facade of the map
     * @private
     * @type {Promise}
     */
    this.capabilitiesPromise_ = null;

    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.options_ = options || {};
    // gets default values
    // layout
    if (M.utils.isNullOrEmpty(this.options_.layout)) {
      this.options_.layout = M.config.geoprint.TEMPLATE;
    }
    // dpi
    if (M.utils.isNullOrEmpty(this.options_.dpi)) {
      this.options_.dpi = M.config.geoprint.DPI;
    }
    // format
    if (M.utils.isNullOrEmpty(this.options_.format)) {
      this.options_.format = M.config.geoprint.FORMAT;
    }
    // force scale
    if (M.utils.isNullOrEmpty(this.options_.forceScale)) {
      this.options_.forceScale = M.config.geoprint.FORCE_SCALE;
    }
    // legend
    if (M.utils.isNullOrEmpty(this.options_.legend)) {
      this.options_.legend = M.config.geoprint.LEGEND;
    }
  }

  /**
   * This function creates the view to the specified map. Igual que el render de react.
   * Es la función más importante.
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stabletrue
   */
  createView(map) {
    const promise = new Promise((success, fail) => {
      this.getCapabilities().then((capabilitiesParam) => {
        const capabilities = capabilitiesParam;
        let i = 0;
        let ilen;
        // default layout
        for (i = 0, ilen = capabilities.layouts.length; i < ilen; i += 1) {
          const layout = capabilities.layouts[i];
          if (layout.name === this.options_.layout) {
            layout.default = true;
            break;
          }
        }
        capabilities.dpis = [];
        let attribute;
        // default dpi
        // este for busca qué atributo tiene la lista de los DPI recomendados
        for (i = 0, ilen = capabilities.layouts[0].attributes.length; i < ilen; i += 1) {
          if (capabilities.layouts[0].attributes[i].clientInfo != null) {
            attribute = capabilities.layouts[0].attributes[i];
          }
        }
        for (i = 0, ilen = attribute.clientInfo.dpiSuggestions.length; i < ilen; i += 1) {
          const dpi = attribute.clientInfo.dpiSuggestions[i];

          if (parseInt(dpi, 10) === this.options_.dpi) {
            dpi.default = true;
            break;
          }
          const object = { value: dpi };
          capabilities.dpis.push(object);
        }
        capabilities.format = [];
        // default outputFormat
        for (i = 0, ilen = capabilities.formats.length; i < ilen; i += 1) {
          const outputFormat = capabilities.formats[i];
          if (outputFormat.name === this.options_.format) {
            outputFormat.default = true;
            break;
          }
          const object = { name: outputFormat };
          capabilities.format.push(object);
        }
        // forceScale
        capabilities.forceScale = this.options_.forceScale;
        const html = M.template.compileSync(printerHTML, { jsonp: true, vars: capabilities });
        this.addEvents(html);
        success(html);
      });
    });
    return promise;
  }

  /**
   * This function creates the view to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  addEvents(html) {
    this.element_ = html;

    // title
    this.inputTitle_ = this.element_.querySelector('.form div.title > input');

    // description
    this.areaDescription_ = this.element_.querySelector('.form div.description > textarea');

    // layout
    const selectLayout = this.element_.querySelector('.form div.layout > select');
    selectLayout.addEventListener('change', (event) => {
      const layoutValue = selectLayout.value;
      this.setLayout({
        value: layoutValue,
        name: layoutValue,
      });
    });

    const layoutValue = selectLayout.value;
    this.setLayout({
      value: layoutValue,
      name: layoutValue,
    });

    // dpi
    const selectDpi = this.element_.querySelector('.form div.dpi > select');
    selectDpi.addEventListener('change', (event) => {
      const dpiValue = selectDpi.value;
      this.setDpi({
        value: dpiValue,
        name: dpiValue,
      });
    });

    const dpiValue = selectDpi.value;
    this.setDpi({
      value: dpiValue,
      name: dpiValue,
    });

    // format
    const selectFormat = this.element_.querySelector('.form div.format > select');
    selectFormat.addEventListener('change', (event) => {
      this.setFormat(selectFormat.value);
    });
    this.setFormat(selectFormat.value);

    // force scale
    const checkboxForceScale = this.element_.querySelector('.form div.forcescale > input');
    checkboxForceScale.addEventListener('click', (event) => {
      this.setForceScale(checkboxForceScale.checked === true);
    });
    this.setForceScale(checkboxForceScale.checked === true);

    // print button
    const printBtn = this.element_.querySelector('.button > button.print');
    printBtn.addEventListener('click', this.printClick_.bind(this));

    // clean button
    const cleanBtn = this.element_.querySelector('.button > button.remove');
    cleanBtn.addEventListener('click', (event) => {
      event.preventDefault();

      // resets values
      this.inputTitle_.value = '';
      this.areaDescription_.value = '';
      selectLayout.value = this.options_.layout;
      selectDpi.value = this.options_.dpi;
      selectFormat.value = this.options_.format;
      checkboxForceScale.checked = this.options_.forceScale;

      // Create events and init
      const changeEvent = document.createEvent('HTMLEvents');
      changeEvent.initEvent('change');
      const clickEvent = document.createEvent('HTMLEvents');
      // Fire listeners
      clickEvent.initEvent('click');
      selectLayout.dispatchEvent(changeEvent);
      selectDpi.dispatchEvent(changeEvent);
      selectFormat.dispatchEvent(changeEvent);
      checkboxForceScale.dispatchEvent(clickEvent);


      // clean queue
      Array.prototype.forEach.apply(this.queueContainer_.children, [(child) => {
        // unlisten events
        child.removeEventListener('click', this.dowloadPrint);
      }, this]);

      while (this.queueContainer_.fistChild) {
        this.queueContainer_(this.queueContainer_.firsChild);
      }
    });

    // queue
    this.queueContainer_ = this.element_.querySelector('.queue > ul.queue-container');
    M.utils.enableTouchScroll(this.queueContainer_);
  }


  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  setLayout(layout) {
    this.layout_ = layout;
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  setFormat(format) {
    this.format_ = format;
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  setDpi(dpi) {
    this.dpi_ = dpi;
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  setForceScale(forceScale) {
    this.forceScale_ = forceScale;
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  printClick_(evt) {
    evt.preventDefault();

    // this.getCapabilities().then((capabilities) => {
    this.getPrintData().then((printData) => {
      let printUrl = M.utils.concatUrlPaths([this.url_, `report.${printData.outputFormat}`]);

      // append child
      const queueEl = this.createQueueElement();
      this.queueContainer_.appendChild(queueEl);
      queueEl.classList.add(PrinterControl.LOADING_CLASS);
      printUrl = M.utils.addParameters(printUrl, 'mapeaop=geoprint');
      M.remote.post(printUrl, printData).then((responseParam) => {
        let response = responseParam;
        const responseStatusURL = JSON.parse(response.text);
        const ref = responseStatusURL.ref;
        const statusURL = M.utils.concatUrlPaths(['https://geoprint.desarrollo.guadaltel.es/print/print/status', `${ref}.json`]);
        // Borra el símbolo loading cuando ha terminado la impresión del mapa
        getStatus(statusURL, () => queueEl.classList.remove(PrinterControl.LOADING_CLASS));

        if (response.error !== true) {
          let downloadUrl;
          try {
            // const textParse = JSON.stringify(response.text);
            response = JSON.parse(response.text);
            // poner la url en una variable
            downloadUrl = M.utils.concatUrlPaths(['https://geoprint.desarrollo.guadaltel.es', response.downloadURL]);
          } catch (err) {
            M.exception(err);
          }
          // sets the download URL
          queueEl.setAttribute(PrinterControl.DOWNLOAD_ATTR_NAME, downloadUrl);
          queueEl.addEventListener('click', this.dowloadPrint);
        } else {
          M.dialog.error('Se ha producido un error en la impresión');
        }
      });
    });
    // });
  }

  /**
   * Obtiene el capabilities (.yaml)
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  getCapabilities() {
    if (M.utils.isNullOrEmpty(this.capabilitiesPromise_)) {
      this.capabilitiesPromise_ = new Promise((success, fail) => {
        const capabilitiesUrl = M.utils.concatUrlPaths([this.url_, 'capabilities.json']);
        M.remote.get(capabilitiesUrl).then((response) => {
          let capabilities = {};
          try {
            capabilities = JSON.parse(response.text);
          } catch (err) {
            M.exception(err);
          }
          success(capabilities);
        });
      });
    }
    return this.capabilitiesPromise_;
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  getPrintData() {
    const title = this.inputTitle_.value;
    const description = this.areaDescription_.value;
    const projection = this.map_.getProjection().code;
    const layout = this.layout_.name;
    const dpi = this.dpi_.value;
    const outputFormat = this.format_;
    const scale = this.map_.getScale();
    const center = this.map_.getCenter();
    const parameters = this.params_.parameters;

    const printData = M.utils.extend({
      layout,
      outputFormat,
      attributes: {
        title,
        description,
        epsg: projection,
        escala: `1:${scale}`,
        map: {
          projection,
          dpi,
        },
      },
    }, this.params_.layout);

    return this.encodeLayers().then((encodedLayers) => {
      // metemos los styles adecuadamente en el JSON
      const layersParsedStyles = [];
      for (let i = 0, ilen = encodedLayers.length; i < ilen; i += 1) {
        const layer = encodedLayers[i];
        const typeGeom = layer.geoJson && layer.geoJson.features.length > 0 ?
          layer.geoJson.features[0].geometry.type :
          '';
        const stylesWithType = [];
        const keysStyle = Object.keys(layer.styles);
        keysStyle.forEach((k) => {
          const style = layer.styles[k];
          if (!M.utils.isNullOrEmpty(style)) {
            style.type = typeGeom;
            stylesWithType.push(style);
          }
        });

        const objectStyle = {
          '*': {
            symbolizers: stylesWithType,
          },
        };
        layer.styles = objectStyle;
        layersParsedStyles.push(layer);
      }

      printData.attributes.map.layers = layersParsedStyles;
      printData.attributes = Object.assign(printData.attributes, parameters);
      printData.legends = this.encodeLegends();
      if (this.options_.legend === true) {
        for (let i = 0, ilen = printData.legends.length; i < ilen; i += 1) {
          if (printData.legends[i] !== undefined) {
            printData.attributes[`leyenda${i}`] = printData.legends[i].name;

            if (printData.legends[i].classes[0] !== undefined &&
              printData.legends[i].classes[0].icons !== undefined) {
              printData.attributes[`imagenLeyenda${i}`] = printData.legends[i].classes[0].icons[0];
            }
          }
        }
      }
      if (projection.code !== 'EPSG:3857' && this.map_.getLayers().some(layer => (layer.type === M.layer.type.OSM || layer.type === M.layer.type.Mapbox))) {
        printData.attributes.map.projection = 'EPSG:3857';
      }
      if (this.forceScale_ === false) {
        const bbox = this.map_.getBbox();
        printData.attributes.map.bbox = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
        if (projection.code !== 'EPSG:3857' && this.map_.getLayers().some(layer => (layer.type === M.layer.type.OSM || layer.type === M.layer.type.Mapbox))) {
          printData.attributes.map.bbox = ol.proj.transformExtent(printData.attributes.map.bbox, projection.code, 'EPSG:3857');
        }
      } else if (this.forceScale_ === true) {
        printData.attributes.map.center = [center.x, center.y];
        printData.attributes.map.scale = this.map_.getScale();
      }
      return printData;
    });
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  encodeLayers() {
    const layers = this.map_.getLayers().filter((layer) => {
      return ((layer.isVisible() === true) && (layer.inRange() === true) && layer.name !== 'cluster_cover');
    });
    let numLayersToProc = layers.length;

    return (new Promise((success, fail) => {
      const encodedLayers = [];
      layers.forEach((layer) => {
        this.getImpl().encodeLayer(layer).then((encodedLayer) => {
          if (!M.utils.isNullOrEmpty(encodedLayer)) {
            encodedLayers.push(encodedLayer);
          }
          numLayersToProc -= 1;
          if (numLayersToProc === 0) {
            // se usa reverse() para invertir el orden de las capas, así la capa base queda abajo
            // y se visualiza el mapa correctamente.
            success(encodedLayers.reverse());
          }
        });
      });
    }));
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  encodeLegends() {
    // TODO
    const encodedLegends = [];

    const layers = this.map_.getLayers();
    layers.forEach((layer) => {
      if ((layer.isVisible() === true) && (layer.inRange() === true)) {
        const encodedLegend = this.getImpl().encodeLegend(layer);
        if (encodedLegend !== null) {
          encodedLegends.push(encodedLegend);
        }
      }
    }, this);
    return encodedLegends;
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @public
   * @function
   * @api stable
   */
  createQueueElement() {
    const queueElem = document.createElement('li');
    let title = this.inputTitle_.value;
    if (M.utils.isNullOrEmpty(title)) {
      title = PrinterControl.NO_TITLE;
    }
    queueElem.innerHTML = title;
    return queueElem;
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @public
   * @function
   * @api stable
   */
  dowloadPrint(event) {
    event.preventDefault();

    const downloadUrl = this.getAttribute(PrinterControl.DOWNLOAD_ATTR_NAME);
    if (!M.utils.isNullOrEmpty(downloadUrl)) {
      window.open(downloadUrl, '_blank');
    }
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @function
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof PrinterControl) {
      equals = (this.name === obj.name);
    }
    return equals;
  }
}

/**
 * Name for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterControl.NAME = 'printercontrol';

/**
 * M.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterControl.TEMPLATE = 'printer.html';

/**
 * M.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterControl.LOADING_CLASS = 'printing';

/**
 * M.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterControl.DOWNLOAD_ATTR_NAME = 'data-donwload-url-print';

/**
 * M.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterControl.NO_TITLE = '(Sin título)';
