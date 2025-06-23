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
            position: 'bottomright'
        },

        onAdd: function (map) {
            // Create a container div
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

            // Apply flexbox styling for centering
            container.style.display = 'flex';
            container.style.alignItems = 'center';   // vertical centering
            container.style.justifyContent = 'center'; // horizontal centering
            container.style.backgroundColor = 'white';
            container.style.width = '30px';
            container.style.height = '30px';
            container.style.cursor = 'pointer';
            container.style.padding = '0';

            // Add the icon
            container.innerHTML = '<img src="static/img/filter.svg" style="width:16px; height:16px;">';

            // Prevent map click events
            L.DomEvent.disableClickPropagation(container);

            // Click behavior
            container.onclick = function () {
                alert('Button clicked!');
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