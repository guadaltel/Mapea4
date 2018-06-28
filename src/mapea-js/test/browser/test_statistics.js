
const getRandom = () => Math.round(Math.random() * 100);

const defaultStyles = {
  polygon: new M.style.Polygon({
    fill: {
      color: '#33AA21'
    },
    stroke: {
      color: '#FFF',
      width: 3
    }
  }),
  multipolygon: new M.style.Polygon({
    fill: {
      color: '#224ACB'
    },
    stroke: {
      color: '#FFF',
      width: 3
    }
  })
};

const initializeMap = () => {
  window.map = new M.map({
    container: 'map',
    projection: 'EPSG:4326*d',
    controls: ['layerswitcher'],
    layers: ['OSM']
  });

  provideGeoJSON(GeoJSONTypes.worldpt).then((data) => {
    window.features = new M.format.GeoJSON().read(data, ol.proj.get('EPSG:4326'));

    features.map(feature => {
      feature.setAttribute('data', [getRandom(), getRandom(), getRandom(), getRandom()]);
      feature.setAttribute('numX', getRandom());
      feature.setAttribute('numY', getRandom());
      feature.setAttribute('numZ', getRandom());
      return feature;
    })

    let geometryTypes = features
      .map(f => f.getImpl().getOLFeature().getGeometry().getType())
      .reduce((tot, curr, i) => {
        if (!(tot instanceof Array)) {
          tot = [tot];
        }
        return tot.indexOf(curr) === -1 ? tot.concat([curr]) : tot;
      });

    console.log('features', features);
    console.log('geometry types', geometryTypes)

    window.multiLayer = new M.layer.Vector();
    window.poLayer = new M.layer.Vector();

    multiLayer.addFeatures(features.filter(f => f.getImpl().getOLFeature().getGeometry().getType() === geometryTypes[0]));
    poLayer.addFeatures(features.filter(f => f.getImpl().getOLFeature().getGeometry().getType() === geometryTypes[1]));

    map.addLayers(multiLayer);
    map.addLayers(poLayer);

    /*multiLayer.setStyle(defaultStyles.multipolygon)
    poLayer.setStyle(defaultStyles.polygon)*/
  }, (error) => {
    console.log('error getting json', error)
  });
};

const domEls = {
  builder: document.querySelector('#style-builder'),
  toggleHandler: document.querySelector('#style-builder > .display-handler'),
  showButtonText: document.querySelector('#style-builder > .display-handler > span[data-role="show"]'),
  hideButtonText: document.querySelector('#style-builder > .display-handler > span[data-role="hide"]'),
  variablesContainer: document.querySelector('.chart-variable').parentNode,
  addVariableButton: document.querySelector('#add-var')
};

const eventHandlers = {
  toggleStyleBuilder: function() {
    if (domEls.builder.hasAttribute('opened')) {
      domEls.builder.removeAttribute('opened');
      domEls.showButtonText.className = '';
      domEls.hideButtonText.className = 'hidden';
    } else {
      domEls.builder.setAttribute('opened', true);
      domEls.hideButtonText.className = '';
      domEls.showButtonText.className = 'hidden';
    }
  },
  createVariable: function() {
    let tmpEl = document.createElement('div');
    tmpEl.innerHTML = chartVarTemplate;
    domEls.variablesContainer.insertBefore(tmpEl.childNodes[0], domEls.addVariableButton);
  },
  deleteVariable: function(target) {
    let targetEl = target.parentNode;
    if (targetEl) {
      targetEl.remove();
    }
  },
  setStyle: function() {
    let chartOptions = {
      type: M.style.chart.types[getValue('type', defaultChartOptions.type)],
      radius: getValue('radius', defaultChartOptions.type),
      donutRatio: getValue('donutRatio', defaultChartOptions.donutRatio),
      offsetX: getValue('offsetX', defaultChartOptions.offsetX),
      offsetY: getValue('offsetY', defaultChartOptions.offsetY),
      fill3DColor: getValue('fill3DColor', defaultChartOptions.fill3DColor),
      scheme: M.style.chart.schemes[getValue('scheme', defaultChartOptions.scheme)],
      rotateWithView: getValue('rotateWithView', defaultChartOptions.rotateWithView),
      animation: getValue('animation', defaultChartOptions.animation),
      stroke: {
        color: getValue('stroke.color', undefined),
        width: getValue('stroke.width', undefined)
      }
    };
    let variables = [];
    document.querySelectorAll('.chart-variable').forEach(variable => {
      let varOpts = {
        attribute: getValue('attribute', defaultChartOptions.variables.attribute, variable),
        label: {
          text: getValue('label.text', defaultChartOptions.variables.label.text, variable),
          radiusIncrement: getValue('radiusIncrement', defaultChartOptions.variables.label.radiusIncrement, variable),
          stroke: {
            color: getValue('label.stroke.color', defaultChartOptions.variables.label.stroke.color, variable),
            width: getValue('label.stroke.width', defaultChartOptions.variables.label.stroke.width, variable)
          },
          fill: getValue('fill', defaultChartOptions.variables.label.fill, variable),
          font: getValue('font', defaultChartOptions.variables.label.font, variable),
          scale: getValue('scale', defaultChartOptions.variables.label.scale, variable)
        },
        legend: getValue('legend', defaultChartOptions.variables.legend, variable),
        fill: getValue('fillColor', undefined, variable)
      };
      variables.push(varOpts);
    })

    if (variables.length == 0) {
      alert('You must input at least one variable');
      return false;
    }

    chartOptions.variables = variables;
    console.log('chartOptions', chartOptions);
    setChartStyle(chartOptions);
    this.toggleStyleBuilder();
  }
};

const getValue = (propName, defaultValue, rootElement) => {
  if (rootElement == null) {
    rootElement = document;
  }
  let element = rootElement.querySelector(`*[name="${propName}"]`);
  if (element == null) {
    return defaultValue;
  }
  let value;
  switch (element.tagName) {
    case 'SELECT':
      value = element.querySelectorAll('option')[element.selectedIndex]['value'];
      break;
    case 'INPUT':
      value = element.type === 'checkbox' ? element.checked : element.value;
      if (element.type === 'number') {
        try {
          value = parseFloat(value);
        } catch (ex) {
          value = -1;
        }
      }
      if (!element.hasAttribute('novalidate')) {
        element.style.border = '';
        if (typeof value === 'string' && (value.startsWith('#') && value.length !== 4 && value.length !== 7)) {
          element.style.border = '1px solid red';
          value = defaultValue;
        } else if (typeof value === 'number' && value < 0) {
          element.style.border = '1px solid red';
          value = defaultValue;
        }
      } else if (value.trim() === '') {
        value = undefined;
      }
      break;
    case 'TEXTAREA':
      value = element.value;
      if (value.trim().startsWith('fn:{') && value.trim().endsWith('}')) {
        value = new Function('dataValue', 'data', 'feature', value.trim().replace('fn:{', '').replace('}', ''));
      }
      break;
    default:
      value = null;
  }
  return value;
};


const setChartStyle = (chartOptions) => {
  if (chartOptions == null) {
    chartOptions = defaultChartOptions;
  }
  let chartStyle = new M.style.Chart(chartOptions);
  //layer.setStyle(chartStyle);
  const buildMultiPolygonStyles = (f) => {
    let styles = [];
    [defaultStyles.multipolygon, chartStyle].forEach(style => styles = styles.concat(style.getImpl().olStyleFn_(f)));
    return styles;
  };
  const buildPolygonStyles = (f) => {
    let styles = [];
    [defaultStyles.polygon, chartStyle].forEach(style => styles = styles.concat(style.getImpl().olStyleFn_(f)));
    return styles;
  }
  //poLayer.getImpl().getOL3Layer().setStyle(buildPolygonStyles);
  //multiLayer.getImpl().getOL3Layer().setStyle(buildMultiPolygonStyles);
  poLayer.setStyle(chartStyle)
  //multiLayer.setStyle(chartStyle)
};

const defaultChartOptions = {
  type: 'PIE',
  donutRatio: 0.5,
  radius: 25,
  offsetX: 0,
  offsetY: 0,
  variables: {
    attribute: 'data',
    label: {
      text: function(value, values, feature) {
        return new String(value).toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#000',
        width: 2
      },
      fill: '#FFF',
      font: 'Comic Sans MS',
      scale: 1.25
    },
    legend: 'Datos recogidos en 2016'
  },
  fill3DColor: '#CC33DD',
  scheme: M.style.chart.schemes.Pale,
  rotateWithView: true,
  animation: true,
  stroke: {
    color: "#000",
    width: 1
  }
};

const chartVarTemplate = `<div class="chart-variable"><div class="form-field"><label>Attribute</label><input type="text" name="attribute" value="data"></div><div class="form-field"><label>Label text</label><textarea type="text" name="label.text">fn:{return new String(dataValue).toString()}</textarea></div><div class="form-field"><label>Label radius increment</label><input type="number" name="label.radiusIncrement" value="5"></div><div class="form-field"><label>Label stroke color</label><input type="text" name="label.stroke.color" value="#000"></div><div class="form-field"><label>Label stroke width</label><input type="number" name="label.stroke.width" value="2"></div><div class="form-field"><label>Label fill color</label><input type="text" name="label.fill" value="#FFF"></div><div class="form-field"><label>Label font size</label><input type="text" name="label.font" value="Comic Sans MS"></div><div class="form-field"><label>Label scale</label><input type="number" name="label.scale" value="1.25"></div><div class="form-field"><label>Legend name</label><input type="text" name="legend" value="data" novalidate></div><div class="form-field"><label>Fill color</label><input type="text" name="fillColor"></div><button class="del-var" onclick="eventHandlers.deleteVariable(this)">X</button></div>`;


window.onload = initializeMap;

const testVariables = () => {
  new M.style.Chart({variables: ['edad', 'numhab']});
  // [{"attributeName_":"edad","label_":"edad","fillColor_":null},{"attributeName_":"numhab","label_":"numhab","fillColor_":null}]

  new M.style.Chart({variables: 'edad'});
  // [{"attributeName_":"edad","label_":"edad","fillColor_":null}]

  new M.style.Chart({variables: {
    attribute: 'age',
    label: 'Edad'
  }});
  // [{"attributeName_":"age","label_":"Edad","fillColor_":null}]

  new M.style.Chart({variables: [new M.style.chart.Variable({
    attribute: 'age',
    label: 'Edad',
    fillColor: '#123'
  })]});
  // [{"attributeName_":"age","label_":"Edad","fillColor_":"#123"}]
};

const testSchemes = () => {
  var variablesWithNullFill = ["edad", "numHab"];
  var variablesWithFill = [{
    attribute: "edad",
    label: "Edad",
    fill: '#123'
  }, {
    attribute: "numHab",
    label: "Número Habitantes",
    fill: '#321'
  }];

  // DEFAULT THEME IS Classic : ["#ffa500", "blue", "red", "green", "cyan", "magenta", "yellow", "#0f0"]
  new M.style.Chart({
    variables: variablesWithNullFill
  });
  // DEFAULT

  new M.style.Chart({
    variables: variablesWithNullFill,
    scheme: M.style.chart.scheme.Custom
  });
  // DEFAULT

  new M.style.Chart({
    variables: variablesWithFill,
    scheme: M.style.chart.scheme.Custom
  });
  // ["#123", "#321"]

  new M.style.Chart({
    variables: variablesWithNullFill,
    scheme: 'non-existing-scheme-name'
  });
  // DEFAULT

  new M.style.Chart({
    variables: variablesWithNullFill,
    scheme: 'Neon'
  });
  // ["#ff0", "#0ff", "#0f0", "#f0f", "#f00", "#00f"]

  new M.style.Chart({
    variables: variablesWithNullFill,
    scheme: ['#ff0013', '#123456', '#43216A']
  });
  // ["#ff0013", "#123456", "#43216A"]

  new M.style.Chart({
    variables: variablesWithNullFill,
    scheme: [{sample:'test'}, '#123456', '#43216A']
  });
  // DEFAULT
};