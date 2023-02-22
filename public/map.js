var map;
DG.then(function () {
    map = DG.map('map', {
        center: [51.09049142184456, 71.41802084488441],
        zoom: 11
    });

    DG.marker([51.09049142184456, 71.41802084488441]).addTo(map).bindPopup('html-контент');
});
