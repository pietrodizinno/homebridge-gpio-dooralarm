# homebridge gpio dooralarm

_based on [homebridge-rasppi-gpio-garagedoor by @benlamonica](https://github.com/benlamonica/homebridge-rasppi-gpio-garagedoor)_

## Installation

### prepare

**1. Export the GPIO pins to be used and set their direction after reboot**
* Copy and edit this start script into your `/etc/init.d` directory.
* Change the values to be the gpio pins that you are using.
* `sudo chmod 755 /etc/init.d/door-gpio`
* `sudo update-rc.d door-gpio defaults` # this will set up the symlinks to run the script on startup.
* `sudo /etc/init.d/door-gpio start` and verify that your pins are exported by looking in `ls /sys/class/gpio/` directory

**2. Install homebridge using: `npm install -g homebridge`**

### Install plugin

`git clone git@github.com:schurig/homebridge-gpio-dooralarm.git`

`sudo npm i -g ./homebridge-gpio-dooralarm/`

Add to your `~/homebridge/config.json`

```json
"accessories": [
  {
    "accessory": "RaspPiGPIODoorAlarm",
    "name": "Door",
    "doorSensorPin": 14,
    "doorPollInMs": 1000
  }
]
```

**3. Set up Homebridge to start automatically after reboot**
* Copying the homebridge start script into your /etc/init.d directory.
* Modify the file to start homebridge with the .homebridge directory and user that you want. Make sure that the user you are choosing to run Homebridge as has access to write to GPIO pins. On my version of Raspbian, Homebridge has to run as root.
* `sudo chmod 755 /etc/init.d/homebridge`
* `sudo update-rc.d homebridge defaults`
* `sudo apt-get install apache2-utils` # this will install rotatelog which is used in the start script so that the log can rotate and you can clean up diskspace
* `sudo /etc/init.d/homebridge start` and verify that it is running. Logs are located at `~pi/.homebridge/`
