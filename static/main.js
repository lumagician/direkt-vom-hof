// Declare these as global variables
let map;
let markers;
let geojsonFeatures;

const filterTagMap = {
    'TWINT': 'payment:twint',
    'Bargeld': 'payment:cash'
};

function showModal(dialogId) {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById(dialogId).style.display = 'block';
}

function closeModal(dialogId) {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById(dialogId).style.display = 'none';
}

function createPopupContent(feature) {
    const tags = feature.properties.tags || {};

    const name = tags.name || 'Unbenannt';
    const website = tags.website
        ? `<a href="${tags.website}" target="_blank">${tags.website}</a>`
        : 'Keine Website';

    const street = tags['addr:street'] || '';
    const housenumber = tags['addr:housenumber'] || '';
    const postcode = tags['addr:postcode'] || '';
    const city = tags['addr:city'] || '';

    const address = [street, housenumber].filter(Boolean).join(' ') + '<br>' +
        [postcode, city].filter(Boolean).join(' ');

    const payment = Object.entries(tags)
        .filter(([key, value]) => key.startsWith('payment:') && value === 'yes')
        .map(([key]) => key.replace('payment:', '').toUpperCase())
        .join(', ') || 'Keine Angaben';

    const produce = tags.produce ? tags.produce : "keine Angaben";

    return `
        <div class="popup-content">
            <h3>${name}</h3>
            <p><strong>Adresse:</strong><br>${address}</p>
            <p><strong>Website:</strong> ${website}</p>
            <p><strong>Zahlungsarten:</strong> ${payment}</p>
            <p><strong>Produkte:</strong> ${produce}</p>
        </div>
    `;
}


function showInfoDialog(dataset) {
    const totalItems = dataset.length;
    const categories = [...new Set(dataset.map(item => item.category || 'Unbekannt'))];
    const lastUpdated = new Date().toLocaleDateString();

    const html = `
        <h3>Allgemeine Informationen</h3>
        <p>Diese Karte zeigt Direktvermarkter in deiner Umgebung.</p>
        <p>Du kannst nach verschiedenen Kriterien filtern oder direkt auf der Karte stöbern.</p>

        <h3>Geladene Daten</h3>
        <ul>
            <li><strong>Einträge:</strong> ${totalItems}</li>
            <li><strong>Kategorien:</strong> ${categories.join(', ')}</li>
            <li><strong>Letztes Update:</strong> ${lastUpdated}</li>
        </ul>
    `;

    document.getElementById('info-content').innerHTML = html;
}

async function getData() {
    const url = "https://raw.githubusercontent.com/lumagician/direkt-vom-hof-db/refs/heads/main/shops.geojson";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error.message);
    }
}

function populateFilterDialog(features) {
    const dialog = document.getElementById('filter-content');
    dialog.innerHTML = '';

    Object.entries(filterTagMap).forEach(([labelText, tagKey]) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = tagKey;
        checkbox.checked = false;

        // Trigger filter on change
        checkbox.addEventListener('change', applyFilter);

        label.appendChild(checkbox);
        label.append(` ${labelText}`);
        label.appendChild(document.createElement('br'));

        dialog.appendChild(label);
    });
}

function populateInfo(features) {
    const dialog = document.getElementById('info-content');
    dialog.innerHTML = '';

    // Display total number of features
    const totalCount = document.createElement('p');
    totalCount.textContent = `Total features: ${features.length}`;
    dialog.appendChild(totalCount);
}



function applyFilter() {
    const checkboxes = document.querySelectorAll('#filter-dialog input[type="checkbox"]');
    const activeKeys = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value); // e.g. ['payment:twint', 'payment:cash']

    markers.clearLayers();

    const filtered = geojsonFeatures.features.filter(f => {
        return activeKeys.every(key => {
            return f.properties.tags[key] === 'yes';
        });
    });

    const filteredLayer = L.geoJson(filtered, {
        onEachFeature: function (feature, layer) {
    layer.bindPopup(createPopupContent(feature));
}

    });


    markers.addLayer(filteredLayer);
    map.addLayer(markers);
}


(async function initMap() {
    map = L.map('map', {
        maxZoom: 20,
        minZoom: 6,
        zoomControl: false
    }).setView([46.79854945818969, 8.23148166597295], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.locate({ position: 'topright', maxZoom: 20, minZoom: 6 }).addTo(map);


    const customFilterControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: white;
                width: 30px;
                height: 30px;
                cursor: pointer;
                padding: 0;
            `;
            container.innerHTML = '<img src="static/img/filter.svg" style="width:16px; height:16px;" alt="filter icon">';
            L.DomEvent.disableClickPropagation(container);
            container.onclick = function () {
                showModal('filter-dialog');
            };
            return container;
        }
    });

    const customInfoControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: white;
                width: 30px;
                height: 30px;
                cursor: pointer;
                padding: 0;
            `;
            container.innerHTML = '<img src="static/img/info.svg" style="width:16px; height:16px;" alt="info icon">';
            L.DomEvent.disableClickPropagation(container);
            container.onclick = function () {
                showModal('info-dialog');
            };
            return container;
        }
    });

    map.addControl(new customInfoControl());
    map.addControl(new customFilterControl());


    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    geojsonFeatures = await getData(); // assigned globally
    populateFilterDialog(geojsonFeatures.features);
    populateInfo(geojsonFeatures.features);
    showInfoDialog(geojsonFeatures.features)

    markers = L.markerClusterGroup(); // declared globally

    const geoJsonLayer = L.geoJson(geojsonFeatures, {
    onEachFeature: function (feature, layer) {
        layer.bindPopup(createPopupContent(feature));
    }
});


    markers.addLayer(geoJsonLayer);
    map.addLayer(markers);
    map.fitBounds(markers.getBounds());

})();
