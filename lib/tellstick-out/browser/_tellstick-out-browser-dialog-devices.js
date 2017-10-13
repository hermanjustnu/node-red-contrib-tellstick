/*eslint-env browser, jquery */
/*global node, showHideMethods, $, RED */

/**
 * Configure list configured devices dialog
 */
'use strict';

$('#telldus-dialog-list-configured-devices').dialog({
	dialogClass: 'telldus-list-configured-device-dialog no-close',
	autoOpen: false,
	modal: true,
	width: 900,
	maxHeight: ( $(window).height() - ( $(window).height() / 10 ) ),
	buttons: [
		{
			text: 'Add New Device',
			class: 'telldus-btn-add-new-device',
			click: function() {
				var jqAddEditDialog = $('#telldus-dialog-add-edit-device');
				jqAddEditDialog.data('incomingDevice', '');
				jqAddEditDialog.dialog('open');
			}
		},
		{
			text: 'Done',
			click: function() {
				$(this).dialog( 'close' );
			}
		}
	]
});


/**
 * Get the device status object and return HTML for Off/On/Dim
 *
 * @param statusObj
 * @returns {string}
 */
function statusObjToHTML(statusObj) {
	if (statusObj.name === 'OFF') {
		return '<i class="fa fa-lightbulb-o telldus-status-icon-off telldus-status-icon"></i> Off';
	} else if (statusObj.name === 'ON') {
		return '<i class="fa fa-lightbulb-o telldus-status-icon-on telldus-status-icon"></i> On';
	} else if (statusObj.name === 'DIM') {
		return '<i class="fa fa-lightbulb-o telldus-status-icon-on telldus-status-icon"></i> ' + Math.round((statusObj.level / 255) * 100) + '%';
	} else {
		return 'Unknown';
	}
}


/**
 * Get the status device object and return HTML for turning on/off/dimming/belling a device
 *
 * @param deviceObj
 * @returns {string}
 */
function deviceObjToButtons(deviceObj) {
	var strOut = '';
	if (deviceObj.methods.dim && deviceObj.methods.turnon && deviceObj.methods.turnoff) {
		strOut += '<a href="#" class="telldus-invoke-method-link" data-method="turnoff" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-off telldus-status-icon telldus-status-icon-button"></i></a>' +
		'<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="64" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-25 telldus-status-icon telldus-status-icon-button"></i></a>' +
		'<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="128" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-50 telldus-status-icon telldus-status-icon-button"></i></a>' +
		'<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="192" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-75 telldus-status-icon telldus-status-icon-button"></i></a>' +
		'<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="255" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-100 telldus-status-icon telldus-status-icon-button"></i></a>';
	} else {
		if (deviceObj.methods.turnoff === true) {
			strOut += '<a href="#" class="telldus-invoke-method-link" data-method="turnoff" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-off telldus-status-icon telldus-status-icon-button"></i></a>';
		}
		if (deviceObj.methods.turnon === true) {
			strOut += '<a href="#" class="telldus-invoke-method-link" data-method="turnon" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-100 telldus-status-icon telldus-status-icon-button"></i></a>';
		}
	}

	if (deviceObj.methods.up === true) {
		strOut += '<a href="#" class="telldus-invoke-method-link" data-method="up" data-deviceid="' + deviceObj.id + '"><i class="fa fa-arrow-up telldus-status-icon-up telldus-status-icon telldus-status-icon-button"></i></a>';
	}
	if (deviceObj.methods.down === true) {
		strOut += '<a href="#" class="telldus-invoke-method-link" data-method="down" data-deviceid="' + deviceObj.id + '"><i class="fa fa-arrow-down telldus-status-icon-down telldus-status-icon telldus-status-icon-button"></i></a>';
	}
	if (deviceObj.methods.stop === true) {
		strOut += '<a href="#" class="telldus-invoke-method-link" data-method="stop" data-deviceid="' + deviceObj.id + '"><i class="fa fa-stop telldus-status-icon-stop telldus-status-icon telldus-status-icon-button"></i></a>';
	}

	if (deviceObj.methods.bell === true) {
		strOut += '<a href="#" class="telldus-invoke-method-link" data-method="bell" data-deviceid="' + deviceObj.id + '"><i class="fa fa-bell-o telldus-status-icon-bell telldus-status-icon telldus-status-icon-button"></i></a>';
	}

	return strOut;
}

/**
 * Get the status device object and return HTML for sending the learn command.
 *
 * @param deviceObj
 * @returns {string}
 */
function deviceObjToLearnButton(deviceObj) {
	if (deviceObj.methods.learn) {
		return '<a href="#" class="telldus-invoke-method-link telldus-button" data-method="learn" data-deviceid="' + deviceObj.id + '">Learn</a>';
	} else {
		return '';
	}
}


/**
 * Get all configured devices from backend, and populate device lists
 */
/*eslint-disable no-unused-vars*/
var devices = [];
function getAllDevicesAndPopulateLists() {
	var jqXHR = $.getJSON('tellstick/device');

	jqXHR.fail(function(data) {
		RED.notify('<strong>Tellstick error (err: 13)</strong>: ' + JSON.stringify(data.responseText), 'error');
	});

	jqXHR.done(function(data) {
		devices = data;
		var jqOutputConfigDevices = $('#telldus-output-config-devices').find('tbody');
		var jqNodeInputDevice = $('#node-input-device');

		// Reset
		jqOutputConfigDevices.empty();
		jqNodeInputDevice
			.empty()
			.append('<option value=""></option>');

		if (data.length === 0) {
			$('#telldus-no-devices-configured').show();
		} else {
			$('#telldus-no-devices-configured').hide();
			data.forEach(function (device) {
				jqNodeInputDevice
					.append($('<option>', { value: device.id })
					.text(device.name));
				jqOutputConfigDevices
					.append(
					'<tr>' +
					'<td>' + device.id + '</td>' +
					'<td class="telldus-status-column">' + statusObjToHTML(device.status) + '</td>' +
					'<td class="telldus-name-column">' + device.name + '</td>' +
					'<td>' + deviceObjToButtons(device) + '</td>' +
					'<td>' + deviceObjToLearnButton(device) + '</td>' +
					'<td class="telldus-config-column">' +
					'<a href="#" data-deviceid="' + device.id + '" class="telldus-config-device-button telldus-button">Configure</a>' +
					'</td>' +
					'<tr>'
				);
			});
		}
		jqNodeInputDevice.find('option[value="' + node.device + '"]').prop('selected', true);
		showHideMethods(node.device, node.method);
	});
}
/*eslint-enable no-unused-vars*/


/**
 * Send request to server to invoke method (turn on/off/dim/bell/learn) when clicked on button
 */
var jqBody = $('body');
jqBody.on('click', '.telldus-invoke-method-link', function() {
	var jqThis = $(this);
	var jqDeviceTableRow = jqThis.parents('tr');
	var jqStatus = jqDeviceTableRow.find('.telldus-status-column');
	var deviceName = jqDeviceTableRow.find('.telldus-name-column').text();
	var outObj = {
		id: jqThis.data('deviceid') || '',
		method: jqThis.data('method') || '',
		value: jqThis.data('methodvalue') || ''
	};

	var jqXHR = $.getJSON('tellstick/invoke/' + outObj.id + '/' + outObj.method + '/' + outObj.value);

	jqXHR.fail(function(data) {
		RED.notify('<strong>Tellstick error (err: 7): </strong>' + JSON.parse(data.responseText).errWarnStr, 'error');
	});

	jqXHR.done(function(data) {
		// Send notification message
		if (data.method === 0) {
			RED.notify(deviceName + ': turned off', 'success');
		} else if (data.method === 1) {
			RED.notify(deviceName + ': turned on', 'success');
		} else if (data.method === 2) {
			RED.notify(deviceName + ': dimmed to ' + Math.round((data.dimlevel / 255) * 100) + '%', 'success');
		} else if (data.method === 3) {
			RED.notify(deviceName + ': bell called', 'success');
		} else if (data.method === 7) {
			RED.notify(deviceName + ': learn command sent', 'success');
		}

		// Update status column in table
		jqStatus.html(statusObjToHTML(data.status));
	});
});


/**
 * When clicked on "Configure" button, send request to server for that device and
 * display the configure dialog.
 */
jqBody.on('click', '.telldus-config-device-button', function() {
	var jqXHR = $.getJSON('tellstick/device/' + $(this).data('deviceid'));

	jqXHR.fail(function(data) {
		RED.notify('<strong>Tellstick error (err: 7): </strong>' + JSON.parse(data.responseText).errStr, 'error');
	});

	jqXHR.done(function(data) {
		$('#telldus-dialog-add-edit-device')
			.data('incomingDevice', data)
			.dialog('open');
	});
});
