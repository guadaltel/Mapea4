import { map } from 'facade/js/mapea';

window.map = map({
  container: 'map',
  controls: ['scale', 'scaleline', 'panzoombar', 'panzoom', 'layerswitcher', 'mouse', 'overviewmap', 'location'],
  getfeatureinfo: 'plain',
  layers: ['OSM'],
  projection: 'EPSG:3857*m',
});