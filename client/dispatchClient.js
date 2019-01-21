'use strict';

const axios = require('axios');
const { CronJob }  = require('cron');
const { getProximity } = require('../methods/get-proximity.js');

class DispatchClient {
    constructor(shipments, drivers) {
        this.shipments = shipments;
        this.drivers = drivers;

        this.currentShipmentIndex = 0;
        this.shipmentIds = Object.keys(this.shipments);
        this.numShipments = this.shipmentIds.length;
        this.currentShipment = this.shipments[this.shipmentIds[this.currentShipmentIndex]];
        this.shipmentId = this.shipmentIds[this.currentShipmentIndex];

        this.driverResponses = new Array(3);
        this.driverIds = Object.keys(this.drivers);
        this.numDrivers = this.driverIds.length;
        this.nearestDrivers = [0, 1, 2];
        this.driverDistances = new Array(this.numDrivers);
        this.sortedDriverDistances = [];
        this._getDriverDistances();

        this.numDenies = 0;

        this.interval;
        this.completedDispatch = false;
        this.shipmentAccepted = false;

        this._start();
    }


// -------------------------------------------------------------------------------------------------------------- //

    _start() {
        this.job = new CronJob({
            cronTime: '*/10 * * * * *', // every 10 seconds
            onComplete: this._onComplete,
            onTick: this._offerShipment.bind(this),
            runOnInit: true,
            start: true,
            timeZone: 'America/Los_Angeles',
        })
    }

    _stop() {
        this.job.stop();
    }

    _onComplete() {
        console.log('\nDispatch completed.');
    }

    _getDriverDistances() {
        for (let i = 0; i < this.numDrivers; i++) {
            this.driverDistances[i] = getProximity(this.currentShipment, this.drivers[i + 1]);
        }

        this.sortedDriverDistances = [...this.driverDistances];
        this.sortedDriverDistances.sort((a, b) => (a - b));

        this.nearestDrivers = [0, 1, 2];
    }

    _increaseSearchRadius() {
        for (let i=0; i<3; i++) {
            this.nearestDrivers[i] += 3;
        }
    }

    _gotoNextShipment() {
        this.shipmentAccepted = true;
        this.currentShipmentIndex++;
        this.completedDispatch = this.currentShipmentIndex >= this.numShipments ? true : false;
        if (this.completedDispatch) {
            this._stop();
        }
        else {
            this.currentShipment = this.shipments[this.shipmentIds[this.currentShipmentIndex]];
            this.shipmentId = this.shipmentIds[this.currentShipmentIndex];
            this._getDriverDistances();
            this.numDenies = 0;
        }
    }

// -------------------------------------------------------------------------------------------------------------- //

    async _offerShipment () { // catch block could fire if any of the axios requests returned an error
        try {
            for (let i=0; i<3; i++) {
                if (this.nearestDrivers[i] < this.numDrivers) { // prevents out of bounds errors
                    this.driverResponses[i] =
                        await axios({
                            method: 'post',
                            url: `http://challenge.shipwithbolt.com/driver/${this.driverDistances.indexOf(this.sortedDriverDistances[this.nearestDrivers[i]]) + 1}/dispatch`,
                            data: {
                                "shipmentId": Number(this.shipmentId),
                            }
                        });
                }
            }

            for (let i=0; i<3; i++) {
                let res = this.driverResponses[i];
                if (res.data.response === 'Accepted') {
                    console.log(`\n*** Shipment ${res.data.shipmentId} was ${res.data.response} by driver ${res.data.driverId} | ${this.driverDistances[res.data.driverId-1].toFixed(2) + " miles away"} ***\n`);
                    this._gotoNextShipment();
                    break;
                }
                else {
                    this.numDenies++;
                }
            }
            
            if (!this.shipmentAccepted) {
                this._increaseSearchRadius();
            }
            else {
                this.shipmentAccepted = false;
            }
        }
        catch (error) {
            console.log(error.data);
        }

        if (this.numDenies >= this.numDrivers) {
            console.log('****** Driver not found. Please try again. ******\n');
            this._gotoNextShipment();
        }
    };
}

module.exports = DispatchClient;