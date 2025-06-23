async function getData() {
    const url = "data/shops.geojson";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        return await response.json()
    } catch (error) {
        console.error(error.message);
    }
}

(async function initMap() {
    var map = L.map('map', {
        maxZoom: 20,
        minZoom: 6,
        zoomControl: false
    }).setView([46.79854945818969, 8.23148166597295], 12);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    var customControl = L.Control.extend({
        options: {
            position: 'topright' // 'topleft', 'topright', 'bottomleft', or 'bottomright'
        },

        onAdd: function (map) {
            // Create a container div with a class
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

            // Style the button (or use an icon/image)
            container.style.backgroundColor = 'white';
            container.style.width = '30px';
            container.style.height = '30px';
            container.style.cursor = 'pointer';
            container.innerHTML = '<img src="static/img/filter.svg"/>'; // You can use an icon instead

            // Prevent map click events when interacting with the control
            L.DomEvent.disableClickPropagation(container);

            // Add your button click behavior
            container.onclick = function () {
                alert('Button clicked!');
                // Or: map.zoomIn();
                // Or: trigger a custom function
            };

            return container;
        }
    });


    map.addControl(new customControl());
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


    const geojsonFeature = await getData();

    var markers = L.markerClusterGroup();

    var geoJsonLayer = L.geoJson(geojsonFeature, {
        onEachFeature: function (feature, layer) {

            layer.bindPopup(`<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`);
        }
    });
    markers.addLayer(geoJsonLayer);

    map.addLayer(markers);
    map.fitBounds(markers.getBounds());

})();