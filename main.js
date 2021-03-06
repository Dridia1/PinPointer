var vars = {};
var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
});

var allPoints = vars['points']
var accessToken = vars['token']

var res = allPoints.split(",")

for(var i = 0; i < res.length; i++){
  res[i] = res[i].split("+")
}

mapboxgl.accessToken = accessToken;

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  center:[11.993714, 57.704610],
  zoom:vars['z']
});

var size = 200;

var pulsingDot = {
  width: size,
  height: size,
  data: new Uint8Array(size * size * 4),

  // get rendering context for the map canvas when layer is added to the map
  onAdd: function() {
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    this.context = canvas.getContext('2d');
  },

  // called once before every frame where the icon will be used
  render: function() {
    var duration = 1000;
    var t = (performance.now() % duration) / duration;

    var radius = (size / 2) * 0.3;
    var outerRadius = (size / 2) * 0.7 * t + radius;
    var context = this.context;

    // draw outer circle
    context.clearRect(0, 0, this.width, this.height);
    context.beginPath();
    context.arc(
      this.width / 2,
      this.height / 2,
      outerRadius,
      0,
      Math.PI * 2
    );
    context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
    context.fill();

    // draw inner circle
    context.beginPath();
    context.arc(
      this.width / 2,
      this.height / 2,
      radius,
      0,
      Math.PI * 2
    );
    context.fillStyle = 'rgba(255, 100, 100, 1)';
    context.strokeStyle = 'white';
    context.lineWidth = 2 + 4 * (1 - t);
    context.fill();
    context.stroke();

    // update this image's data with data from the canvas
    this.data = context.getImageData(
      0,
      0,
      this.width,
      this.height
    ).data;

    // continuously repaint the map, resulting in the smooth animation of the dot
    map.triggerRepaint();

    // return `true` to let the map know that the image was updated
    return true;
  }
};

map.on('load', function() {
  map.addImage('pulsing-dot', pulsingDot, {
    pixelRatio: 2
  });

  jsonData = {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': []
    }
  }
  for(var i = 0; i < res.length; i++){
    json = {'type': 'Feature', 'geometry': {'type': 'Point','coordinates': []}}
    json['geometry']['coordinates'][0] = parseFloat(res[i][1])
    json['geometry']['coordinates'][1] = parseFloat(res[i][0])
    jsonData['data']['features'].push(json)
  }

  map.addSource('points', jsonData);
  map.addLayer({
    'id': 'points',
    'type': 'symbol',
    'source': 'points',
    'layout': {
      'icon-image': 'pulsing-dot'
    }
  });
});
