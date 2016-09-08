var fs = require("fs");
var Service, Characteristic, DoorState; // set in the module.exports, from homebridge

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  DoorState = homebridge.hap.Characteristic.CurrentDoorState;

  homebridge.registerAccessory("homebridge-gpio-dooralarm", "RaspPiGPIODoorAlarm", RaspPiGPIODoorAlarmAccessory);
}

function RaspPiGPIODoorAlarmAccessory(log, config) {
  this.log = log;
  this.name = config['name'];
  this.doorSensorPin = config['doorSensorPin'];
  this.doorPollInMs = config['doorPollInMs'];
  this.service = new Service.Switch(this.name);
  log("Door Name: " + this.name);
  log("Door Sensor Pin: " + this.pin);
  log("Door Poll in ms: " + this.duration);

  if (!this.doorSensorPin) throw new Error('You must provide a config value for doorSensorPin.');

  this.initService();
  this.monitorDoorState.bind(this);
}

RaspPiGPIODoorAlarmAccessory.prototype = {

  monitorDoorState: function() {
    this.log("monitoring state..");
    var isClosed = this.isClosed();
    if (isClosed != this.wasClosed) {
    this.log("change detected!!!!");
     this.wasClosed = isClosed;
     var state = isClosed ? DoorState.CLOSED : DoorState.OPEN;
     this.log("Door state changed to " + (isClosed ? "CLOSED" : "OPEN"));
     if (!this.operating) {
       this.currentDoorState.setValue(state);
       this.targetDoorState.setValue(state);
       this.targetState = state;
     }
    }
    setTimeout(this.monitorDoorState.bind(this), this.doorPollInMs);
  },

  initService: function() {
    this.garageDoorOpener = new Service.GarageDoorOpener(this.name,this.name);
    this.currentDoorState = this.garageDoorOpener.getCharacteristic(DoorState);
    this.currentDoorState.on('get', this.getState.bind(this));
    this.targetDoorState = this.garageDoorOpener.getCharacteristic(Characteristic.TargetDoorState);
    this.targetDoorState.on('set', this.setState.bind(this));
    this.targetDoorState.on('get', this.getTargetState.bind(this));
    var isClosed = this.isClosed();
    this.currentDoorState.setValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
    this.targetDoorState.setValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
    this.infoService = new Service.AccessoryInformation();
    this.infoService
      .setCharacteristic(Characteristic.Manufacturer, "Opensource Community")
      .setCharacteristic(Characteristic.Model, "RaspPi GPIO Door alarm")
      .setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");

    this.wasClosed = isClosed;
    this.operating = false;
    setTimeout(this.monitorDoorState.bind(this), this.doorPollInMs);
  },

  getTargetState: function(callback) {
    callback(null, this.targetState);
  },

  isClosed: function() {
    return fs.readFileSync("/sys/class/gpio/gpio"+this.doorSensorPin+"/value", "utf8").trim() == "1";
  },

  switchOff: function() {
    this.log("Turning off Door Relay");
  },

  setFinalDoorState: function() {
    var isClosed = this.isClosed();
    if ((this.targetState == DoorState.CLOSED && !isClosed) || (this.targetState == DoorState.OPEN && isClosed)) {
      this.log("Was trying to " + (this.targetState == DoorState.CLOSED ? " CLOSE " : " OPEN ") + "the door, but it is still " + (isClosed ? "CLOSED":"OPEN"));
      this.currentDoorState.setValue(DoorState.STOPPED);
      this.targetDoorState.setValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
    } else {
      this.currentDoorState.setValue(this.targetState);
    }
    this.operating = false;
  },

  setState: function(state, callback) {
    this.log("Setting state to " + state);
    this.targetState = state;
    var isClosed = this.isClosed();
    if ((state == DoorState.OPEN && isClosed) || (state == DoorState.CLOSED && !isClosed)) {
      this.log("Triggering GarageDoor Relay");
    }

    callback();
    return true;
  },

  getState: function(callback) {
    var isClosed = this.isClosed();
    this.log("GarageDoor is " + (isClosed ? "CLOSED ("+DoorState.CLOSED+")" : "OPEN ("+DoorState.OPEN+")"));
    callback(null, (isClosed ? DoorState.CLOSED : DoorState.OPEN));
  },

  getServices: function() {
    return [this.infoService, this.garageDoorOpener];
  }
};
