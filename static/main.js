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
    var map = L.map('map').setView([47.0, 7.5], 10);
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