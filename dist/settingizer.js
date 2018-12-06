function create_settings(data, model) {
	console.log('data', data);
	console.log('config', model);
	if (typeof data === 'string') {
		// todo: parse json
		return console.log('don\'t pass string');
	}
	// make copy so we can add sc_keys to it
	data = Array.isArray(data) ? data.concat() : Object.assign({}, data);

	var htmlStr = '';

	var index = [];
	var parent = data;
	var value = data;
	var buildModel = !model;
	var model = model || {};
	var modelActive = {};
	var ids = [];
	var descriptions = {};
	var gridCheck = 0;
	var index_path;

	var traverses = 0;

	var el;
	el = document.getElementsByClassName('settingizer')[0];
	if (!el) el = document.body;
	if (!el) return console.warn('Settingizer: Run create_settings() in body or add <div class="settingizer"></div>');

	var form = document.createElement('form');
	build_settings();
	// todo: cache the html
	el.appendChild(form);

	if (buildModel) {
		// clean model
		form.innerHTML = '<p class="sc-message">Success! Your model has been generated.<br>Use it as the second argument for create_settings(obj, model).</p><textarea class="config" style="margin: 10px; max-width: none; width: calc(100% - 20px);"></textarea>' + form.innerHTML;
		var configEl = form.querySelector('.config');
		if (configEl) {
			configEl.innerHTML = JSON.stringify(model, false, 4);
			configEl.style.height = '';
			configEl.style.height = configEl.scrollHeight + 5 + 'px';
		}
	}

	return form;

	function traverse() {
		traverses += 1;
		if (traverses > 10000) return;
		// console.log(traverses);
		// console.log('index: ', index, 'value: ', value, 'parent: ', parent);

		index_path = index.reduce(function (p, c) { return p ? p + '->' + c : c; }, '');
		index_path = index_path ? '"' + index_path + '"' : 'the root object';

		// check for null, empty objects and arrays here

		if (value === null) value = '';

		if ((Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
			nextProp();
			traverse();
			return;
		}

		checkModel();
		if (buildModel) {
			questions();
		}
		checkModel(); // if questions can checkModel too, this can be removed
		var sc_hide = modelActive.sc_show === false ? ' sc-hide' : '';

		if (!buildModel) {
			if (childrenOf0() && !Array.isArray(value) && typeof value === 'object') {
				var data_keys = getDataKeys();
				var model_value = model;
				for (var i = 0; i < index.length; i += 1) {
					if (model_value) {
						model_value = model_value[index[i]];
					} else {
						console.warn('Config is missing all the keys for ' + index_path);
						break;
					}
				}
				if (model_value) {
					var model_keys = Object.keys(model_value);
					var extra_data = data_keys.reduce(function (a, v) { if (model_keys.indexOf(v) === -1) { a.push(v); } return a; }, []);
					if (extra_data.length) console.warn('Config is missing ' + extra_data.join(', ') + ' from ' + index_path + '.');
				}
				// put in combined
				value.sc_keys = concatUnique(model_keys, data_keys);
			}
		}

		if (Array.isArray(value)) {
			// console.log('array');
			if (index[index.length - 1] !== undefined && isNaN(index[index.length - 1])) {
				html('<label class="fieldset' + sc_hide + '">' + capitalize(index[index.length - 1]) + '</label>');
			}
			// if array has as many arrays of the same length
			if (!gridCheck) {
				if (modelActive.sc_grid) {
					gridCheck = value.length;
					html('<div class="grid array-group' + sc_hide + '">');
				} else {
					html('<div class="array-group' + sc_hide + '">');
				}
			} else {
				html('<div class="grid-row' + sc_hide + '">');
			}
			index.push(0);
			parent = value;
			value = parent[0];

		} else if (typeof value === 'object' && value) { // typof null === 'object' :P
			// console.log('object');
			if (index[index.length - 1] !== undefined && isNaN(index[index.length - 1])) {
				html('<label class="fieldset' + sc_hide + '">' + capitalize(index[index.length - 1]) + '</label>');
			}
			html('<div class="object-group' + sc_hide + '">');
			var all_keys = getFirstObject().sc_keys;
			index.push(all_keys ? all_keys[0] : [undefined]);
			parent = value;
			value = value[index[index.length - 1]];

		} else if (typeof value === 'function') {

		} else if (value === undefined) {
			// console.log('none');
			if (Array.isArray(parent) && modelActive.sc_add && gridCheck === 0) {
				html('<div class="array-button"><button class="add-item" type="button">Add item</button></div>');
			}
			html('</div>');

			if (gridCheck === 1) {
				html('<div class="grid-buttons"><button class="add-x" type="button">Add X</button><button class="add-y" type="button">Add Y</button></div>');
				html('</div>');
				index.pop();
			}
			if (gridCheck > 0) gridCheck--;


			if (index.length === 1) {
				if (!buildModel) form.innerHTML = htmlStr;
				return; // kill it
			}
			index.pop(); // up a level
			value = data;
			for (var i = 0; i < index.length; i += 1) {
				parent = value;
				value = value[index[i]];
			}
			// reset descriptions
			if (!Array.isArray(parent) && typeof parent === 'object') descriptions = {};

			nextProp();

		} else {
			// console.log('new fieldset');
			var type = 'text';
			if (value && value.toString().match(/^#?[a-fA-F0-9]{6}$/)) {
				type = 'color';
				if (value[0] !== '#') value = '#' + value;
			}
			else if (value === 'on' || value === 'off' || typeof value === 'boolean') type = 'checkbox';
			else if (value && !isNaN(Number(value))) type = 'number';
			else if (value && value.length > 134) type = 'textarea';

			var name = Array.isArray(data) ? 'root' : '';
			for (var i = 0; i < index.length; i += 1) {
				if (i === 0 && !Array.isArray(data)) name += index[i];
				else name += '[' + index[i] + ']';
			}

			var prop = index[index.length - 1];
			var id = isNaN(prop) ? prop.toLowerCase() : 'a' + prop;
			var dupes = getAllIndexes(ids, id);
			ids.push(id);
			if (dupes > 0) { id += dupes; }

			var description = modelActive.sc_description ? '<p class="description">' + modelActive.sc_description + '</p>' : '';

			if (gridCheck) {
				html('<div class="fieldset' + sc_hide + '">');
					html('<div><input type="' + type + '" id="' +  id + '" data-key="' + prop + '" name="' +  name + '" value="' + value + '"' + (value === 'on' || value === true ? ' checked' : '') + ' />' + description + '</div>');
				html('</div>'); // close fieldset
			} else {
				html('<div class="fieldset' + sc_hide + '"><label for="' + id + '">' + capitalize(prop) + '</label>');
				if (type === 'textarea') {
					html('<div><textarea rows="5" id="' +  id + '" name="' +  name + '"' + (value === 'on' ? ' checked' : '') + '>' + htmlEncode(value) + '</textarea></div>');
				} else {
					html('<div><input type="' + type + '" id="' +  id + '" data-key="' + prop + '" name="' +  name + '" value="' + value + '"' + (value === 'on' || value === true ? ' checked' : '') + ' />' + description + '</div>');
				}
				html('</div>'); // close fieldset
			}
			nextProp();
		}
		traverse();
	}

	function nextProp() {
		if (Array.isArray(parent)) {
			index[index.length - 1] += 1;
		} else {
			var obj = getFirstObjectParent();
			var i = obj.sc_keys.indexOf(index[index.length - 1]);
			index[index.length - 1] = obj.sc_keys[i + 1];
		}

		value = data; // reset value before traversing
		for (var i = 0; i < index.length; i += 1) {
			parent = value;
			value = value[index[i]];
		}
	}

	function html(str) {
		htmlStr += str;
		// todo: this line slows it down a lot, only needed when building model
		if (buildModel) {
			form.innerHTML = htmlStr;
		}
	}

	function build_settings() {
		traverse();
		initEvents();
	}

	function questions() {
		// console.log('question', index);
		var show = modelActive.sc_show !== false;
		var grid;
		var description;
		var prop = index[index.length - 1];

		if (show) { // higher level says show
			if (prop !== undefined || (prop === undefined && Array.isArray(data))) {
				if (childrenOf0NoItem()) {
					show = confirm('Show ' + index_path + '?');
					if (!show) {
						questionGetParent()['sc_show'] =  false;
					} else {
						if (typeof value !== 'object') { // not array or object
							description = prompt('Description for ' + index_path + '?', '');
							if (description) {
								descriptions[prop] = description;
								questionGetParent()['sc_description'] = description;
							}
						}
						if (Array.isArray(value)) {
							// todo: check that values are primitives
							grid = value.reduce(function (a, v) { return a && Array.isArray(v) && v.length === value.length; }, true);
							if (grid) {
								questionGetParent()['sc_grid'] = confirm('Format ' + index_path + ' as grid?');
								questionGetParent()['sc_add'] = confirm('Allow adding more ' + index_path + '?');
							} else if (!modelActive.sc_grid) {
								questionGetParent()['sc_add'] = confirm('Allow adding more ' + index_path + '?');
							}
						}
					}
				}
			}
		}

		// find all unique props for this level
		// don't need to ask "show" if object? "Show" is needed, since props in data, but not model need to be asked about
		if (childrenOf0() && !Array.isArray(value) && typeof value === 'object') {
			// console.log('question', value);
			var data_keys = getDataKeys();
			var model_keys = [];

			if (show) {
				var keyStr = prompt('Enter all the available keys for ' + index_path + ' in the order you want them.', data_keys.join(','));
				if (keyStr) {
					model_keys = keyStr.split(',');
					model_keys = model_keys.map(function (key) { return key.trim(); });
					model_keys = model_keys.reduce(function (a, v) { if (v && a.indexOf(v) === -1) { a.push(v); } return a; }, []);
					var type;
					var validTypes = ['text', 'number', 'button', 'radio', 'checkbox'];
					var new_parent;
					for (var i = 0; i < model_keys.length; i += 1) {
						new_parent = questionGetParent();
						new_parent[model_keys[i]] = {};
						if (data_keys.indexOf(model_keys[i]) === -1) {
							type = prompt('Enter the type for ' + model_keys[i] + '. Valid answers: ' + validTypes.join(', '));
							if (validTypes.indexOf(type) !== -1) {
								new_parent[model_keys[i]]['sc_type'] = type;
							}
						}
					}
				}
			}
			value.sc_keys = concatUnique(model_keys, data_keys);
		}
	}

	function questionGetParent() {
		var option = model;
		for (var i = 0; i < index.length; i += 1) {
			if (option[index[i]] === undefined) {
				option[index[i]] = {};
			}
			option = option[index[i]];
		}
		return option;
	}

	function getFirstObject() {
		var val = data;
		for (var i = 0; i < index.length; i += 1) {
			val = val[isNaN(index[i]) ? index[i] : 0];
		}
		return val;
	}

	function getFirstObjectParent() {
		var val = data;
		for (var i = 0; i < index.length - 1; i += 1) {
			val = val[isNaN(index[i]) ? index[i] : 0];
		}
		return val;
	}

	function getDataKeys() {
		var keys = [];
		if (Array.isArray(parent)) {
			var arr = parent.reduce(function (a, v) { a.push(Object.keys(v)); return a; }, []);
			for (var i = 0; i < arr.length; i += 1) {
				for (var j = 0; j < arr[i].length; j += 1) {
					if (keys.indexOf(arr[i][j]) === -1) {
						keys.push(arr[i][j]);
					}
				}
			}
		} else {
			keys = Object.keys(value);
		}
		return keys;
	}

	function concatUnique(a, b) {
		if (!a && !b) return [];
		if (!b) return a;
		if (!a) return b;
		var arr = a;
		for (var i = 0; i < b.length; i += 1) {
			if (arr.indexOf(b[i]) === -1) arr.push(b[i]);
		}
		return arr;
	}

	function checkModel() {
		modelActive = {};
		var option = model;
		var settings = ['sc_add', 'sc_show', 'sc_grid', 'sc_description']; // sc_type sc_options

		for (var j = 0; j < settings.length; j += 1) {
			if (settings[j] in option) {
				modelActive[settings[j]] = option[settings[j]];
			}
		}

		for (var i = 0; i < index.length; i += 1) {
			option = option[isNaN(index[i]) ? index[i] : 0];
			if (option === undefined) break;

			for (var j = 0; j < settings.length; j += 1) {
				if (settings[j] in modelActive) continue; // already found
				if (settings[j] in option) {
					modelActive[settings[j]] = option[settings[j]];
				}
			}
		}
	}

	function childrenOf0NoItem() {
		// false: if any indexes are num and (not 0 or 0 at the end will fail)
		for (var i = 0; i < index.length; i += 1) {
			if (!isNaN(index[i]) && (index[i] !== 0 || (index[i] === 0 && i === index.length - 1))) {
				return false;
			}
		}
		return true;
	}

	function childrenOf0() {
		// false: if any indexes are num and not 0
		for (var i = 0; i < index.length; i += 1) {
			if (!isNaN(index[i]) && (index[i] !== 0)) {
				return false;
			}
		}
		return true;
	}

	function capitalize(string) {
		// todo: add space if words go from lowercase to uppercase
		if (typeof string !== 'string') return string;
		var matches = string.match(/([^\s-_]+)/g);
		matches = matches.map(function (w) { return w[0].toUpperCase() + w.slice(1).toLowerCase(); });
		string = matches.join(' ');
		return string;
	}

	function getAllIndexes(arr, val) {
		var indexes = 0;
		var i;
		for (i = 0; i < arr.length; i += 1) {
			if (arr[i] === val) indexes++;
		}
		return indexes;
	}

	function initEvents() {
		el.addEventListener('click', function (e) {
			// delegate
			if (e.target.matches('.add-item') || e.target.matches('.add-y')) {
				// todo: increment index
				var item = e.target.parentNode.previousSibling.cloneNode(true);
				fixIds(item);
				e.target.parentNode.parentNode.insertBefore(item, e.target.parentNode);
			} else if (e.target.matches('.add-x') || e.target.matches('.add-y')) {
				if (e.target.matches('.add-x')) {
					var rows = e.target.parentNode.parentNode.querySelectorAll('.grid-row');
					for (var i = 0; i < rows.length; i += 1) {
						item = rows[i].children[rows[i].children.length - 1].cloneNode(true);
						fixIds(item);
						rows[i].appendChild(item);
					}
				} else {
					var item = e.target.parentNode.previousSibling.cloneNode(true);
					fixIds(item);
					e.target.parentNode.parentNode.insertBefore(item, e.target.parentNode);
				}
			}
		});
	}

	function fixIds(item) {
		var fieldsets = item.querySelectorAll('div.fieldset');
		if (item.matches('div.fieldset')) fieldsets = [item];
		var label, input, prop, dupes;
		for (var i = 0; i < fieldsets.length; i += 1) {
			label = fieldsets[i].querySelector('label');
			input = fieldsets[i].querySelector('input');

			prop = input.dataset.key;
			id = isNaN(prop) ? prop.toLowerCase() : 'a' + prop;
			dupes = getAllIndexes(ids, id);
			ids.push(id);
			if (dupes > 0) { id += dupes; }

			input.id = id;
			if (label) label.htmlFor = id;
		}
	}

	function htmlEncode(str) {
		var elt = document.createElement('span');
		elt.textContent = str;
		return elt.innerHTML;
	}
}
