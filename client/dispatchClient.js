'use strict';

const axios = require('axios');
const { CronJob }  = require('cron');
const DistanceCalculations = require('../methods/distanceCalculations.js');
const distanceCalculations = new DistanceCalculations();

class DispatchClient {
    constructor(shipments, drivers, options) {
        this.shipments = shipments;
        this.drivers = drivers;

        this.currentShipmentIndex = 0;
        this.shipmentIds = Object.keys(this.shipments);
        this.numShipments = this.shipmentIds.length;
        this.currentShipment = this.shipments[this.shipmentIds[this.currentShipmentIndex]];
        this.shipmentId = this.shipmentIds[this.currentShipmentIndex];

        this.numDriversPerRun = options.driversPerRun !== undefined ? options.driversPerRun : 3;
        this.driverResponses = new Array(this.numDriversPerRun);
        this.driverIds = Object.keys(this.drivers);
        this.numDrivers = this.driverIds.length;
        this.nearestDrivers = new Array(this.numDriversPerRun);
        this.driverDistances = new Array(this.numDrivers);
        this.sortedDriverDistances = [];

        this.numDenies = 0;

        this.interval = options.runInterval !== undefined ? options.runInterval : 10;
        this.completedDispatch = false;
        this.shipmentAccepted = false;

        if (options.runOnInit) {
            this._initializeNearestDrivers();
            this._getDriverDistances();
            this._start();
        }
    }

    _start() {
        console.log('\nStarting automatic dispatch system...\n');

        this.job = new CronJob({
            cronTime: `*/${this.interval} * * * * *`, // every 10 seconds
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
        console.log('\nDispatch complete.\n');
    }

    _initializeNearestDrivers() {
        for (let i = 0; i < this.numDriversPerRun; i++) {
            this.nearestDrivers[i] = i;
        }
    }

    _getDriverDistances() {
        for (let i = 0; i < this.numDrivers; i++) {
            this.driverDistances[i] = distanceCalculations.getProximity(this.currentShipment, this.drivers[i + 1]);
        }

        this.sortedDriverDistances = [...this.driverDistances];
        this.sortedDriverDistances.sort((a, b) => (a - b));

        this._initializeNearestDrivers();
    }

    _increaseSearchRadius() {
        for (let i=0; i<this.numDriversPerRun; i++) {
            this.nearestDrivers[i] += this.numDriversPerRun;
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
            for (let i=0; i<this.numDriversPerRun; i++) {
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

            for (let i=0; i<this.numDriversPerRun; i++) {
                let res = this.driverResponses[i];
                if (res.data.response === 'Accepted') {
                    console.log(`\n*** Shipment ${res.data.shipmentId} was ${res.data.response} by driver ${res.data.driverId} | ${this.driverDistances[res.data.driverId-1].toFixed(2) + " miles away"} ***\n`);
                    this._gotoNextShipment();
                    break;
                }
                else if (res.data.response === 'Denied') {
                    console.log(`*** Shipment ${res.data.shipmentId} was ${res.data.response} by driver ${res.data.driverId} ***`);
                    this.numDenies++;
                    if (this.numDenies >= this.numDrivers) {
                        console.log(`\n****** No driver available for shipment ${this.shipmentId}. Please try again. ******\n`);
                        this._gotoNextShipment();
                        break;
                    }
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
    };
}

module.exports = DispatchClient;