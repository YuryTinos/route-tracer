$(document).ready(function () {

    var map;

    $("form").submit(function (e) {

        e.preventDefault();

        if(map != undefined || map != null) {
            map.off();
            map.remove();
        }

        var url = $("#coord-info").val();
        var files = $("#the-file").prop('files');

        if (url != "" && url.indexOf("http") !== -1) {

            $.ajax({
                url: $("#coord-info").val(),
                type: "GET",
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                success: function (data) {
                    onSuccess(Array.from(data.split('\n'), x => x.replace(' ', '').split(',')));
                },
                error: function (e) {
                    console.log(e);
                }
            });

        }
        else if (files.length > 0) {

            var formData = new FormData();
            formData.append("the_file", files[0]);

            $.ajax({
                url: "/upload",
                type: "POST",
                enctype: 'multipart/form-data',
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                success: function (data) {
                    onSuccess(JSON.parse(data).map(function (x) {
                        return [x.latitude, x.longitude];
                    }));
                },
                error: function (e) {
                    console.log(e);
                }
            });
        }
        else {
            alert("Choose a file or paste a URL on the field Coordinates!");
        }
    });

    function onSuccess(coordinates) {

        var time = getTimeInSeconds($("#span-time").val()) * 1000 / coordinates.length;

        if (time <= 20) {
            alert("Tempo minimo excedido");
            return;
        }

        createElementCoordinates(0, coordinates, time);
    }

    function createElementCoordinates(i, coordinates, time) {

        coordinate = coordinates[i];

        if (i >= coordinates.length) {
            return;
        }

        if (i == 0) {
            map = L.map('map').setView([coordinate[0], coordinate[1]], 10);
            map.invalidateSize();

            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                maxZoom: 18,
                id: 'mapbox.streets',
                accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
            }).addTo(map);

            L.marker([coordinate[0], coordinate[1]]).addTo(map);
        }

        if(map == undefined || map == null) {
            return;
        }

        if (i > 0) {
            previous_coordinate = coordinates[i - 1];
            var pointA = new L.LatLng(previous_coordinate[0], previous_coordinate[1]);
            var pointB = new L.LatLng(coordinate[0], coordinate[1]);
            var pointList = [pointA, pointB];
            var polyline = L.polyline(pointList, { color: 'blue', weight: 3, opacity: 0.8, smoothFactor: 1 });
            polyline.addTo(map);
        }
        map.setView([coordinate[0], coordinate[1]], 15);

        if (i == (coordinates.length - 1)) {
            L.marker([coordinate[0], coordinate[1]]).addTo(map);
            middle_coordinate = coordinates[Math.round(length / 2)];
            map.fitBounds(coordinates);
        }

        setTimeout(function () {
            createElementCoordinates(++i, coordinates, time);
        }, time);
    }

    function getTimeInSeconds(strTime) {

        try {
            arrTime = strTime.split(':');
            var hour = new Number(arrTime[0]);
            var minute = new Number(arrTime[1]);
            var second = new Number(arrTime[2]);

            return ((hour * 3600) + (minute * 60) + second);
        }
        catch (e) {
            console.log(e);
            return 0;
        }
    }
});