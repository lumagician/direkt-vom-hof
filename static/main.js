async function getData() {
    const url = "https://raw.githubusercontent.com/lumagician/direkt-vom-hof-db/refs/heads/main/shops.geojson";
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

function populateFilterDialog(features) {
    const dialog = document.getElementById('filter-dialog');
    dialog.innerHTML = ''; // Clear existing content

    // Define two static filter options
    const staticFilters = ['payment:twint', 'payment:cash'];

    staticFilters.forEach(type => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${type}" checked> ${type}<br>`;
        dialog.appendChild(label);
    });

    // Add apply button
    const btn = document.createElement('button');
    btn.textContent = 'Apply Filter';
    btn.onclick = () => applyFilter();
    dialog.appendChild(btn);
}


function applyFilter() {
    const checkboxes = document.querySelectorAll('#filter-dialog input[type="checkbox"]');
    const activeTypes = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    markers.clearLayers(); // Clear old markers

    const filtered = geojsonFeatures.features.filter(f => activeTypes.includes(f.properties.type));

    const filteredLayer = L.geoJson(filtered, {
        onEachFeature: function (feature, layer) {
            layer.bindPopup(`<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`);
        }
    });

    markers.addLayer(filteredLayer);
    map.addLayer(markers);
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
            position: 'topright'
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
                const dialog = document.getElementById('filter-dialog');
                dialog.style.display = dialog.style.display === 'none' ? 'block' : 'none';
            };

            return container;
        }
    });



    map.addControl(new customControl());

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


    const geojsonFeatures = await getData();
    populateFilterDialog(geojsonFeatures.features);

    var markers = L.markerClusterGroup();

    var geoJsonLayer = L.geoJson(geojsonFeatures, {
        onEachFeature: function (feature, layer) {

            layer.bindPopup(`<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`);
        }
    });
    markers.addLayer(geoJsonLayer);

    map.addLayer(markers);
    map.fitBounds(markers.getBounds());

})();