let map = M.map({
  container: 'map',
  layers: ["OSM"],
  projection: "EPSG:4326*d",
  controls: ['layerswitcher', "getfeatureinfo", "scaleline", "location", "mouse"],
  center: [-6, 38],
  zoom: 5
});

let ayuntamientos = new M.layer.WFS({
  name: "assda_sv10_ayuntamiento_point_indicadores",
  url: "https://clientes.guadaltel.es/desarrollo/geossigc/wfs?",
  namespace: "mapea",
  name: "assda_sv10_ayuntamiento_point_indicadores",
  legend: "Prestaciones - Ámbito municipal",
  getfeatureinfo: "plain",
  geometry: 'POINT',
});

map.addLayers(ayuntamientos);

let styleproportional = new M.style.Proportional("ogc_fid");
let stylecategory = new M.style.Category("cod_mun", {
  "04015": new M.style.Point({
    fill: {
      color: 'yellow'
    },
    radius: 50
  }),
  "other": new M.style.Point({
    fill: {
      color: 'black'
    },
    radius: 15
  })
});
let stylechoropleth = new M.style.Choropleth("ogc_fid", null, M.style.quantification.JENKS(2));;
let stylecluster = new M.style.Cluster();
let stylesimple = new M.style.Point({
  fill: {
    color: 'red'
  },
  radius: 15
});
let stylechart = new M.style.Chart({
  type: 'pie',
  donutRatio: 0.5,
  radius: 25,
  offsetX: 0,
  offsetY: 0,
  stroke: {
    color: 'white',
    width: 1
  },
  animation: true,
  scheme: M.style.chart.schemes.Custom,
  rotateWithView: true,
  fill3DColor: '#CC33DD',
  variables: [{
    attribute: 's0303',
    legend: 'Prestaciones PEAP',
    fill: 'cyan',
    label: {
      text: function(value, values, feature) {
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#000',
        width: 2
      },
      fill: 'cyan',
      font: 'Comic Sans MS',
      scale: 1.25
    }
  }, {
    attribute: 's0304',
    legend: 'Prestaciones PECEF',
    fill: 'blue',
    label: {
      text: function(value, values, feature) {
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#000',
        width: 2
      },
      fill: 'cyan',
      font: 'Comic Sans MS',
      scale: 1.25
    }
  }, {
    attribute: 's0305',
    legend: 'Prestaciones PEVS',
    fill: 'pink',
    label: {
      text: function(value, values, feature) {
        // return new String(value).toString();
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#000',
        width: 2
      },
      fill: 'cyan',
      font: 'Comic Sans MS',
      scale: 1.25
    }
  }, {
    attribute: 's0306',
    legend: 'Prestaciones SAD',
    fill: 'red',
    label: {
      text: function(value, values, feature) {
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#000',
        width: 2
      },
      fill: 'cyan',
      font: 'Comic Sans MS',
      scale: 1.25
    }
  }, {
    attribute: 's0307',
    legend: 'Prestaciones SAR',

    fill: 'yellow',
    label: {
      text: function(value, values, feature) {
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#000',
        width: 2
      },
      fill: 'cyan',
      font: 'Comic Sans MS',
      scale: 1.25
    }
  }, {
    attribute: 's0308',
    legend: 'Prestaciones SAT',
    fill: 'orange',
    label: {
      text: function(value, values, feature) {
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#000',
        width: 2
      },
      fill: 'cyan',
      font: 'Comic Sans MS',
      scale: 1.25
    }
  }, {
    attribute: 's0309',
    legend: 'Prestaciones UED',
    fill: 'brown',
    label: {
      text: function(value, values, feature) {
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#000',
        width: 2
      },
      fill: 'cyan',
      font: 'Comic Sans MS',
      scale: 1.25
    }
  }]
});

let gato = new M.style.Point({
  icon: {
    src: 'https://cdn3.iconfinder.com/data/icons/free-icons-3/128/cat_6.png',
    rotation: 0.5,
    opacity: 0.8,
    anchororigin: 'top-left',
    anchororigin: 'top-left',
    anchorxunits: 'fraction',
    anchoryunits: 'fraction',
    rotate: false,
    // offset: [10, 0],
    crossorigin: null,
    snaptopixel: true,
    offsetorigin: 'bottom-left',
    scale: 1
  }
});

// cluster + choropleth
// let stylecomposite = stylecluster.add(stylechoropleth);
function addproportional() {
  let style = ayuntamientos.getStyle();
  if (M.utils.isNullOrEmpty(style) || !(style instanceof M.style.Composite) || !(style instanceof M.style.Composite)) {
    ayuntamientos.setStyle(styleproportional);
  }
  else {
    style.add(styleproportional);
  }
}

function removeproportional() {
  let style = ayuntamientos.getStyle();
  if (!(style instanceof M.style.Proportional) && (style instanceof M.style.Composite)) {
    style.remove(styleproportional);
  }
  else {
    ayuntamientos.setStyle(null, true);
  }
}

function addcategory() {
  let style = ayuntamientos.getStyle();
  if (M.utils.isNullOrEmpty(style) || !(style instanceof M.style.Composite)) {
    ayuntamientos.setStyle(stylecategory);
  }
  else {
    style.add(stylecategory);
  }
}

function removecategory() {
  let style = ayuntamientos.getStyle();
  if (!(style instanceof M.style.Category) && (style instanceof M.style.Composite)) {
    style.remove(stylecategory);
  }
  else {
    ayuntamientos.setStyle(null, true);
  }
}

function addchoropleth() {
  let style = ayuntamientos.getStyle();
  if (M.utils.isNullOrEmpty(style) || !(style instanceof M.style.Composite)) {
    ayuntamientos.setStyle(stylechoropleth);
  }
  else {
    style.add(stylechoropleth);
  }
}

function removechoropleth() {
  let style = ayuntamientos.getStyle();
  if (!(style instanceof M.style.Choropleth) && (style instanceof M.style.Composite)) {
    style.remove(stylechoropleth);
  }
  else {
    ayuntamientos.setStyle(null, true);
  }
}

function addcluster() {
  let style = ayuntamientos.getStyle();
  if (M.utils.isNullOrEmpty(style) || !(style instanceof M.style.Composite)) {
    ayuntamientos.setStyle(stylecluster);
  }
  else {
    style.add(stylecluster);
  }
}

function removecluster() {
  let style = ayuntamientos.getStyle();
  if (!(style instanceof M.style.Cluster) && (style instanceof M.style.Composite)) {
    style.remove(stylecluster);
  }
  else {
    ayuntamientos.setStyle(null, true);
  }
}

function addsimple() {
  let style = ayuntamientos.getStyle();
  if (M.utils.isNullOrEmpty(style) || !(style instanceof M.style.Composite)) {
    ayuntamientos.setStyle(stylesimple, true);
  }
  else {
    style.add(stylesimple);
  }
}

function removesimple() {
  let style = ayuntamientos.getStyle();
  if (!(style instanceof M.style.Simple) && (style instanceof M.style.Composite)) {
    style.remove(stylesimple);
  }
  else {
    ayuntamientos.setStyle(null, true);
  }
}

function addchart() {
  let style = ayuntamientos.getStyle();
  if (M.utils.isNullOrEmpty(style) || !(style instanceof M.style.Composite)) {
    ayuntamientos.setStyle(stylechart);
  }
  else {
    style.add(stylechart);
  }
}

function removechart() {
  let style = ayuntamientos.getStyle();
  if (!(style instanceof M.style.Chart) && (style instanceof M.style.Composite)) {
    style.remove(stylechart);
  }
  else {
    ayuntamientos.setStyle(null, true);
  }
}