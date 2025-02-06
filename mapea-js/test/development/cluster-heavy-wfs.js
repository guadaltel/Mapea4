import { map } from 'M/mapea';
import WFS from 'M/layer/WFS';
import StylePolygon from 'M/style/Polygon';
import Generic from 'M/style/Generic';
import StylePoint from 'M/style/Point';
import Cluster from 'M/style/Cluster';
import Category from 'M/style/Category';
import { SELECT_FEATURES as SelectFeaturesEvt } from 'M/event/eventtype';


const mapjs = map({
  container: 'map',
  controls: ['layerswitcher'],
});

const diagrama_circular = new WFS({
  url: 'https://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_Mapa_inversiones_Andalucia?',
  legend: 'Grafico inversiones por provincia',
  name: 'diagrama_circular_importe',
  geometry: 'POINT'
}, {
  getFeatureOutputFormat: 'geojson',
  describeFeatureTypeOutputFormat: 'geojson'
});

mapjs.addWFS(diagrama_circular);

const cluster_inversion = new WFS({
	url: 'https://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_Mapa_inversiones_Andalucia?',
	legend: 'Mapa Cluster Inversiones Andalucía',
	name: 'inversiones_puntual',
	geometry: 'MPOINT',
	}, {
    visibility: false,
    getFeatureOutputFormat: 'geojson',
	describeFeatureTypeOutputFormat: 'geojson'
});	

cluster_inversion.on(SelectFeaturesEvt, function (features, evt) {
	if (features[0] instanceof M.ClusteredFeature) {
    console.log("Es un cluster:", features[0].getAttribute("features"));
	} else {
			console.log("NO es un cluster:", features);
		}
	});

mapjs.addLayers(cluster_inversion);

   //Estilos para categorización
   let Inv_uso_publico = new Generic({
    point: {
    icon: {
      src: 'http://localhost:8080/test/development/headshot.png',
      scale: 1
    },
  }});

  let Inv_medio_natural = new Generic({
    point: {
    icon: {
      src: 'http://localhost:8080/test/development/headshot.png',
      scale: 1
    },
  }});

  let Inv_educac_sostenibilidad = new Generic({
    point: {
    icon: {
      src: 'http://localhost:8080/test/development/headshot.png',
      scale: 1
    },
  }});

  let Inv_econ_circular = new Generic({
    point: {
    icon: {
      src: 'http://localhost:8080/test/development/headshot.png',
      scale: 1
    },
  }});
  
  let categoryStyle = new Category('area_temat', {
  'USO PÚBLICO': Inv_uso_publico,
    'MEDIO NATURAL': Inv_medio_natural,
    'EDUCACIÓN AMBIENTAL': Inv_educac_sostenibilidad, 
    'ECONOMÍA CIRCULAR': Inv_econ_circular
  });

  //Estilo para cluster
  let clusterOptions = {
    ranges: [{
      min: 2,
      max: 5,
  style: new Generic({
        point: {
        stroke: {
          color: '#0a443b'
        },
        fill: {
          color: '#91f162',
        },
        radius: 20
      }})
    }, {
      min: 6,
      max: 9,		
  style: new Generic({
        point: {
        stroke: {
          color: '#0a443b'
        },
        fill: {
          color: '#0adb3b',
        },  
        radius: 25
      }})
    }, {
      min: 10,
      max: 14,
     style: new Generic({
        point: {
        stroke: {
          color: '#0a443b'
        },
        fill: {
          color: '#0aae3b',
        },
        radius: 30
      }})
    },{
      min: 15,
      max: 20,
      style: new Generic({
        point: {
        stroke: {
          color: '#0a443b'
        },
        fill: {
          color: '#0A793B',
        },
        radius: 40
      }})
    }],
    animated: true,
    hoverInteraction: true,
    displayAmount: true,
    distance: 30,
    maxFeaturesToSelect: 8
  };
  let vendorParameters = {
    distanceSelectFeatures: 35,
    convexHullStyle: {
      fill: {
        color: '#000000',
        opacity: 0.5,
      },
      stroke: {
        color: '#000000',
        width: 1,
      },
    },
  };
let clusterStyle = new Cluster(clusterOptions, vendorParameters);
cluster_inversion.setStyle(categoryStyle);
cluster_inversion.setStyle(clusterStyle);