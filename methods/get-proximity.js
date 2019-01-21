const degreesToRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

const haversineFormula = (shipment, driver) => {
    const R = 6371000; // meters
    let lat1 = shipment.coordinates.latitude;
    let lat2 = driver.coordinates.latitude;
    let lon1 = shipment.coordinates.longitude;
    let lon2 = driver.coordinates.longitude;
    let Δlat = degreesToRadians(lat2 - lat1);
    let Δlon = degreesToRadians(lon2 - lon1);

    let a = Math.sin(Δlat / 2) * Math.sin(Δlat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(Δlon / 2) * Math.sin(Δlon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    let dist = R * c;

    return dist;
}

const metersToMiles = (meters) => {
    return meters * 0.00062137
}

const getProximity = (shipment, driver) => { // haversine formula
    return metersToMiles(haversineFormula(shipment, driver));
};

module.exports = {
    getProximity: getProximity,
}
