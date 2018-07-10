import Control from "facade/js/controls/controlbase";
import Utils from "facade/js/utils/utils";
import Exception from "facade/js/exception/exception";
import SearchstreetImpl from "../../impl/ol/js/searchstreetcontrol";
import Config from "../../../configuration";
import Template from "facade/js/utils/template";
import EventsManager from "facade/js/event/eventsmanager";
import Remote from "facade/js/utils/remote";
import Dialog from "facade/js/dialog";
import Window from "facade/js/utils/window";

export default class SearchstreetControl extends Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a Searchstreet control that allows searches of streets
   *
   * @constructor
   * @extends {M.Control}
   * @param {string} url - Service URL
   * @param {number} locality - INE code to specify the search
   * @api stable
   */
  constructor(url, locality) {

    // implementation of this control
    let impl = new SearchstreetImpl();

    super(impl);

    if (Utils.isUndefined(SearchstreetImpl)) {
      Exception('La implementación usada no puede crear controles Searchstreet');
    }

    /**
     * Input Searchstreet
     *
     * @private
     * @type {HTMLElement}
     */
    this.input_ = null;

    /**
     * Button Searchstreet
     *
     * @private
     * @type {HTMLElement}
     */
    this.button_ = null;

    /**
     * Container Searchstreet
     *
     * @private
     * @type {HTMLElement}
     */
    this.element_ = null;

    /**
     * Results panel Searchstreet
     *
     * @private
     * @type {HTMLElement}
     */
    this.resultsContainer_ = null;

    /**
     * Timestamp of the search to abort old requests
     *
     * @private
     * @type {number}
     */
    this.searchTime_ = 0;

    /**
     * Control name
     *
     * @private
     * @type {string}
     */
    this.name_ = "searchstreet";

    /**
     * Search URL
     *
     * @private
     * @type {string}
     */
    this.searchUrl_ = url;

    /**
     * Municipality to search
     *
     * @private
     * @type {string}
     */
    this.municipio_ = null;

    /**
     * Province to search
     *
     * @private
     * @type {string}
     */
    this.provincia_ = null;

    /**
     * All provinces
     *
     * @private
     * @type {array}
     */
    this.provincias_ = ["huelva", "sevilla", "córdoba", "jaén", "cádiz", "málaga", "granada", "almería"];

    // checks if you receive the locality parameter, if so create two attributes.
    if (!Utils.isUndefined(locality)) {
      /**
       * INE code
       *
       * @private
       * @type {number}
       */
      this.codIne_ = locality;
      /**
       * Service check INE code
       *
       * @private
       * @type {string}
       */
      this.searchCodIne_ = Config.SEARCHSTREET_URLCOMPROBARINE;
    }

    /**
     * Minimum number of characters to start autocomplete
     *
     * @private
     * @type {number}
     */
    this.minAutocomplete_ = Config.AUTOCOMPLETE_MINLENGTH;

    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.facadeMap_ = null;

    /**
     * HTML element for container of the results (Autocomplete)
     *
     * @private
     * @type {HTMLElement}
     */
    this.resultsAutocomplete_ = null;

    /**
     * State consultation
     *
     * @public
     * @type {boolean}
     * @api stable
     */
    this.completed = false;

    /**
     * Stores the answers of the query when the province isn't indicated
     *
     * @private
     * @type {array}
     */
    this.respuestasProvincias_ = [];

    /**
     * Counter consulted provinces
     *
     * @public
     * @type {number}
     * @api stable
     */
    this.contadorProvincias = 0;

    /**
     * Container of the results to scroll
     * @private
     * @type {HTMLElement}
     */
    this.resultsScrollContainer_ = null;

  }

  /**
   * This function creates the view to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map - Map to add the control
   * @returns {Promise} HTML template
   * @api stable
   */
  createView(map) {
    this.facadeMap_ = map;
    let promise = new Promise((success, fail) => {
      Template.compile(SearchstreetControl.TEMPLATE, {
        'jsonp': true
      }).then(
        (html) => {
          this.addEvents(html);
          success(html);
        });
    });
    return promise;
  }

  /**
   * This function add events to HTML elements
   *
   * @public
   * @function
   * @param {HTMLElement} html - HTML to add events
   * @api stable
   */
  addEvents(html) {
    this.element_ = html;

    this.on(EventsManager.COMPLETED, () => {
      this.element_.classlist.add("shown");
    }, this);

    // searchs
    this.input_ = this.element_.getElementsByTagName("input")["m-searchstreet-search-input"];
    this.button_ = this.element_.getElementsByTagName("button")["m-searchstreet-search-btn"];
    this.clear_ = this.element_.getElementsByTagName("button")["m-searchstreet-clear-btn"];

    // events
    //JGL20170816: traslado gestión evento a autocomplete
    //goog.events.listen(this.input_, goog.events.EventType.KEYUP, this.searchClick_, false, this);
    this.button_.addEventListener("click", this.searchClick_);
    this.clear_.addEventListener("click", this.clearSearchs_);
    // results container
    this.resultsContainer_ = this.element_.getElementsByTagName('div')["m-searchstreet-results"];
    this.resultsAutocomplete_ = this.element_.getElementsByTagName('div')["m-autocomplete-results"];
    this.searchingResult_ = this.element_.querySelector('div#m-searchstreet-results > div#m-searching-result-searchstreet');

    if (!Utils.isUndefined(this.codIne_) && !Utils.isNullOrEmpty(this.codIne_)) {
      let searchCodIne = Utils.addParameters(this.searchCodIne_, {
        codigo: this.codIne_
      });
      Remote.get(searchCodIne).then(
        (response) => {
          let results;
          try {
            if (!Utils.isNullOrEmpty(response.text)) {
              results = JSON.parse(response.text);
              if (Utils.isNullOrEmpty(results.comprobarCodIneResponse.comprobarCodIneReturn)) {
                Dialog.error("El código del municipio '" + this.codIne_ + "' no es válido");
              } else {
                this.getMunProv_(results);
                this.element_.getElementsByTagName("span")["codIne"].innerHTML = "Búsquedas en " + this.municipio_ + "  (" + this.provincia_ + ")";
              }
            }
          } catch (err) {
            Exception('La respuesta no es un JSON válido: ' + err);
          }
        });
    }
    this.resultsContainer_.removeChildren(this.searchingResult_);
  }

  /**
   * Specifies the value of the municipality and province
   *
   * @param {object} results - Query results
   * @private
   * @function
   */
  getMunProv_(results) {
    this.provincia_ = results.comprobarCodIneResponse.comprobarCodIneReturn.comprobarCodIneReturn.nombreProvincia;
    this.municipio_ = results.comprobarCodIneResponse.comprobarCodIneReturn.comprobarCodIneReturn.nombreMunicipio;
  }

  /**
   * This function checks the query field is not empty, if it is not
   * sending the query to the search function
   *
   * @private
   * @function
   * @param {goog.events.BrowserEvent} evt - Keypress event
   */
  searchClick_(evt) {
    evt.preventDefault();

    if ((evt.type !== "keyup") || (evt.keyCode === 13)) {
      this.resultsAutocomplete_.classList.remove(SearchstreetControl.MINIMUM);
      this.resultsAutocomplete_.removeChildren(this.resultsAutocomplete_.querySelector("div#m-searching-result-autocomplete"));
      // gets the query
      let query = this.input_.value;
      if (Utils.isNullOrEmpty(query)) {
        Dialog.error('Debe introducir una búsqueda.');
      } else {
        if (query.length < this.minAutocomplete_) {
          this.completed = false;
        } else {
          this.completed = true;
        }
        if (!Utils.isUndefined(this.codIne_) && !Utils.isNullOrEmpty(this.codIne_)) {
          // It does not take into account the municipality if indicated
          var pos = query.indexOf(",");
          if (query.indexOf(",") > -1) {
            query = query.substring(0, pos);
          }
          this.search_(query + ", " + this.municipio_ + " (" + this.provincia_ + ")", this.showResults_);
        } else {
          this.search_(query, this.showResults_);
        }
      }
    }
  }

  /**
   * This function performs the query
   *
   * @private
   * @function
   * @param {string} query - Query to search
   * @param {function} processor - Calls function
   */
  search_(query, processor) {
    let searchUrl = null;
    this.provincia_ = null;
    this.municipio_ = null;
    this.resultsContainer_.appendChild(this.searchingResult_);
    // adds the class
    this.element_.classList.add(SearchstreetControl.SEARCHING_CLASS);
    this.resultsContainer_.classList.add(SearchstreetControl.MINIMUM);
    let normalizar = Utils.addParameters(Config.SEARCHSTREET_NORMALIZAR, {
      cadena: query
    });

    Remote.get(normalizar).then(response => {
      let results = JSON.parse(response.text).normalizarResponse.normalizarReturn;
      this.provincia_ = Utils.beautifyString(results.provincia);
      this.municipio_ = Utils.beautifyString(results.municipio);
      if (!Utils.isNullOrEmpty(this.provincia_)) {
        searchUrl = Utils.addParameters(this.searchUrl_, {
          streetname: results.nombreVia,
          streetNumber: results.numeroPortal,
          streetType: results.tipoVia,
          municipio: this.municipio_,
          provincia: this.provincia_,
          srs: this.facadeMap_.getProjection().code
        });
        this.searchTime_ = Date.now();
        this.querySearch_(searchUrl, this.provincia_, processor);
      } else if (Utils.isNullOrEmpty(this.provincia_) && !Utils.isNullOrEmpty(this.municipio_)) {
        this.searchTime_ = Date.now();
        this.respuestasProvincias_ = [];
        this.contadorProvincias = 0;
        for (var i = 0, ilen = this.provincias_.length; i < ilen; i++) {
          searchUrl = Utils.addParameters(this.searchUrl_, {
            streetname: results.nombreVia,
            streetNumber: results.numeroPortal,
            streetType: results.tipoVia,
            municipio: this.municipio_,
            provincia: this.provincias_[i],
            srs: this.facadeMap_.getProjection().code
          });
          this.querySearchProvinces(searchUrl, this.provincias_[i], processor);
        }
      } else {
        searchUrl = Utils.addParameters(this.searchUrl_, {
          streetname: results.direccionSinNormalizar,
          streetNumber: null,
          streetType: null,
          municipio: null,
          provincia: null,
          srs: this.facadeMap_.getProjection().code
        });
        this.searchTime_ = Date.now();
        this.querySearch_(searchUrl, null, processor);
      }
    });
  }

  /**
   * This function performs the query if the town and province have value
   *
   * @private
   * @function
   * @param {string} searchUrl - Search URL
   * @param {string} provincia - Province
   * @param {string} processor - Calls function
   */
  querySearch_(searchUrl, provincia, processor) {
    (searchTime => {
      Remote.get(searchUrl).then(response => {
        if (searchTime === this.searchTime_) {
          let results;
          try {
            if (!Utils.isNullOrEmpty(response.text) && response.text.indexOf("No se ha podido obtener el codigoINE") == -1) {
              results = JSON.parse(response.text);
            } else {
              results = null;
            }
          } catch (err) {
            Exception('La respuesta no es un JSON válido: ' + err);
          }
          if (!Utils.isNullOrEmpty(results)) {
            this.provincia_ = Utils.beautifyString(provincia);
            processor.call(this, results);
            this.element_.classList.remove(SearchstreetControl.SEARCHING_CLASS);
            this.resultsContainer_.classList.remove(SearchstreetControl.MINIMUM);
          } else {
            processor.call(this, results);
            this.element_.classList.remove(SearchstreetControl.SEARCHING_CLASS);
            this.resultsContainer_.classList.remove(SearchstreetControl.MINIMUM);
          }
        }
      });
    })(this.searchTime_);
  }

  /**
   * This function performs the query if the town and province haven't value
   *
   * @public
   * @function
   * @param {string} searchUrl - Search URL
   * @param {string} provincia - Province
   * @param {string} processor - Calls function
   * @api stable
   */
  querySearchProvinces(searchUrl, provincia, processor) {
    (searchTime => {
      Remote.get(searchUrl).then(response => {
        this.respuestasProvincias_.push(response);
        this.contadorProvincias++;
        if (this.contadorProvincias == 8) {
          for (var i = 0, ilen = this.respuestasProvincias_.length; i < ilen; i++) {
            if (searchTime === this.searchTime_) {
              let results;
              try {
                let item = this.respuestasProvincias_[i].text;
                if (!Utils.isNullOrEmpty(item) && item.indexOf("No se ha podido obtener el codigoINE") == -1) {
                  results = JSON.parse(item);
                } else {
                  results = null;
                }
              } catch (err) {
                Exception('La respuesta no es un JSON válido: ' + err);
              }
              if (!Utils.isNullOrEmpty(results) && results.geocoderMunProvSrsResponse.geocoderMunProvSrsReturn.geocoderMunProvSrsReturn.coordinateX !== 0) {
                this.provincia_ = Utils.beautifyString(provincia);
                processor.call(this, results);
                this.element_.classList.remove(SearchstreetControl.SEARCHING_CLASS);
                this.resultsContainer_.classList.remove(SearchstreetControl.MINIMUM);
              }
            }
          }
        }
      });
    })(this.searchTime_);
  }

  /**
   * This function displays the results of the consultation
   *
   * @private
   * @function
   * @param {object} results - Query results
   */
  showResults_(results) {
    let resultsTemplateVars = this.parseResultsForTemplate_(results);
    if (!Utils.isUndefined(this.codIne_)) {
      for (var i = 0, ilen = resultsTemplateVars.docs.length; i < ilen; i++) {
        if (!Utils.isUndefined(resultsTemplateVars.docs[i])) {
          if (resultsTemplateVars.docs[i].coordinateX === undefined) {
            resultsTemplateVars.docs.splice(i, 1);
            ilen--;
            i--;
          }
        }
      }
    }
    Template.compile(SearchstreetControl.RESULTS_TEMPLATE, {
      'jsonp': true,
      'vars': resultsTemplateVars
    }).then(html => {
      this.resultsContainer_.classList.remove(SearchstreetControl.HIDDEN_RESULTS_CLASS);
      this.resultsContainer_.innerHTML = html.innerHTML;
      this.resultsScrollContainer_ = this.resultsContainer_.querySelector("div#m-searchstreet-results-scroll");
      if (!Utils.isNullOrEmpty(this.resultsScrollContainer_)) {
        Utils.enableTouchScroll(this.resultsScrollContainer_);
      }

      this.facadeMap_.removePopup();
      if (this.getImpl().listPoints.length > 0) {
        this.getImpl().removePoints_();
      }
      if (!Utils.isUndefined(resultsTemplateVars.docs[0])) {
        this.getImpl().drawPoints(resultsTemplateVars.docs);
        this.eventList_(resultsTemplateVars.docs);
      }
      this.element_.classlist.remove(SearchstreetControl.SEARCHING_CLASS);
      this.resultsContainer_.classlist.remove(SearchstreetControl.MINIMUM);

      // results buntton
      let btnResults = this.resultsContainer_.querySelector('div.page > div.g-cartografia-flecha-arriba');
      btnResults.addEventListener("click", this.resultsClick_);

      this.fire(EventsManager.COMPLETED);
    });
    this.element_.getElementsByTagName('div')["m-autocomplete-results"].innerHTML = "";
  }

  /**
   * This function parse query results for template
   *
   * @private
   * @function
   * @param {object} results - Query results
   * @returns {object} resultsTemplateVar - Parse results
   */
  parseResultsForTemplate_(results) {
    let resultsTemplateVar = null;
    let containtResult = null;
    let resultado = results;
    let search = this.input_.value;
    if (!Utils.isNullOrEmpty(resultado)) {
      let docs = resultado.geocoderMunProvSrsResponse.geocoderMunProvSrsReturn;
      containtResult = !Utils.isNullOrEmpty(docs);
      if (docs.geocoderMunProvSrsReturn instanceof Array) {
        if (!Utils.isUndefined(docs.geocoderMunProvSrsReturn[0].coordinateX)) {
          for (var i = 0, ilen = docs.geocoderMunProvSrsReturn.length; i < ilen; i++) {
            docs.geocoderMunProvSrsReturn[i].localityName = this.municipio_;
            docs.geocoderMunProvSrsReturn[i].cityName = this.provincia_;
            docs.geocoderMunProvSrsReturn[i].streetType = Utils.beautifyString(docs.geocoderMunProvSrsReturn[i].streetType);
            docs.geocoderMunProvSrsReturn[i].streetName = Utils.beautifyString(docs.geocoderMunProvSrsReturn[i].streetName);
          }
          resultsTemplateVar = {
            'docs': docs.geocoderMunProvSrsReturn,
            'containtResult': containtResult,
            'search': search
          };
        } else {
          resultsTemplateVar = {
            'docs': [undefined],
            'containtResult': false,
            'search': search
          };
        }
      } else {
        if (Utils.isNullOrEmpty(docs)) {
          resultsTemplateVar = {
            'docs': [undefined],
            'containtResult': containtResult,
            'search': search
          };
        } else if (docs.geocoderMunProvSrsReturn.coordinateX === 0) {
          resultsTemplateVar = {
            'docs': [undefined],
            'containtResult': false,
            'search': search
          };
        } else {
          docs.geocoderMunProvSrsReturn.localityName = this.municipio_;
          docs.geocoderMunProvSrsReturn.cityName = this.provincia_;
          docs.geocoderMunProvSrsReturn.streetType = Utils.beautifyString(docs.geocoderMunProvSrsReturn.streetType);
          docs.geocoderMunProvSrsReturn.streetName = Utils.beautifyString(docs.geocoderMunProvSrsReturn.streetName);
          resultsTemplateVar = {
            'docs': [docs.geocoderMunProvSrsReturn],
            'containtResult': containtResult,
            'search': search
          };
        }
      }
    } else {
      resultsTemplateVar = {
        'docs': [undefined],
        'containtResult': containtResult,
        'search': search
      };
    }
    return resultsTemplateVar;
  }

  /**
   * This function adds a click event to the elements of the list
   *
   * @private
   * @function
   * @param {array} results - Query results
   */
  eventList_(results) {
    let rows = this.resultsContainer_.getElementsByClassName("result");
    for (var i = 0, ilen = rows.length; i < ilen; i++) {
      this.addEventClickList_(rows[i], results[i]);
    }
  }

  /**
   * This function adds a click event to the element
   *
   * @private
   * @function
   * @param {HTMLElement} element - Specific item in the list
   * @param {object} result - Specific query result
   */
  addEventClickList_(element,
    result) {
    element.listen("click", e => {
      // hidden results on click for mobile devices
      if (Window.WIDTH <= Config.MOBILE_WIDTH) {
        e.target = this.resultsContainer_.querySelector('div.page > div.g-cartografia-flecha-arriba');
        this.resultsClick_(e);
      }
      this.getImpl().addEventClickFeature(result);
    }, false, this);
  }

  /**
   * This function checks if an object is equals to this control
   *
   * @function
   * @api stable
   * @param {*} obj - Object to compare
   * @returns {boolean} equals - Returns if they are equal or not
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof SearchstreetControl) {
      equals = (this.name === obj.name);
    }
    return equals;
  }

  /**
   * This query returns the input Searchstreet
   *
   * @public
   * @function
   * @returns {HTMLElement} Input Searchstreet
   * @api stable
   */
  getInput() {
    return this.input_;
  }

  /**
   * This function return HTML template
   *
   * @public
   * @function
   * @returns {HTMLElement} HTML template
   * @api stable
   */
  getHtml() {
    return this.element_;
  }

  /**
   * Clear results and searchs
   *
   * @private
   * @function
   */
  clearSearchs_() {
    this.element_.classList.remove("shown");
    this.facadeMap_.removePopup();
    this.getImpl().removePoints_();
    this.input_.value = "";
    this.resultsContainer_.innerHTML = "";
    this.resultsAutocomplete_.innerHTML = "";
  }

  /**
   * This function hides/shows the list
   *
   * @private
   * @function
   * @param {goog.events.BrowserEvent} evt - Keypress event
   */
  resultsClick_(evt) {
    this.facadeMap_._areasContainer.getElementsByClassName("m-top m-right")[0].classlist.add("top-extra-search");
    evt.target.classList.toggle('g-cartografia-flecha-arriba');
    evt.target.classList.toggle('g-cartografia-flecha-abajo');
    this.resultsContainer_.classList.toggle(SearchstreetControl.HIDDEN_RESULTS_CLASS);
  }

}


/**
 * Template for this controls
 *
 * @const
 * @type {string}
 * @public
 * @api stable
 */
SearchstreetControl.TEMPLATE = 'searchstreet.html';

/**
 * Template for show results
 *
 * @const
 * @type {string}
 * @public
 * @api stable
 */
SearchstreetControl.RESULTS_TEMPLATE = 'searchstreetresults.html';

/**
 * Class 'searching'
 *
 * @const
 * @type {string}
 * @public
 * @api stable
 */
SearchstreetControl.SEARCHING_CLASS = 'm-searching';

/**
 * Class 'hidden'
 * @const
 * @type {string}
 * @public
 * @api stable
 */
SearchstreetControl.HIDDEN_RESULTS_CLASS = 'hidden';

/**
 * Class 'minimum'
 * @const
 * @type {string}
 * @public
 * @api stable
 */
SearchstreetControl.MINIMUM = 'minimum';
