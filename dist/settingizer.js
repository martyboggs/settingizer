window.create_settings = function (data, model) {
	// sc_ props for model
	// sc_order - specify an order for object keys

	if (typeof data === 'string') return console.log('don\'t pass string');

	var htmlStr = '';

	var index = [];
	var parent = data;
	var value = data;
	var ids = [];
	var buildModel = !model;
	var model = model || {};
	var modelActive = {};
	var traverses = 0;
	var labels = '';
	var descriptions = {};
	var keys = [];

	document.body.innerHTML += '<form class="settings-creator"></form>';
	var el = document.getElementsByClassName('settings-creator')[0];
	traverse(); // create all elements
	initEvents();

	if (buildModel) {
		// clean model
		$(el).prepend('<p style="margin: 0;padding: 10px 10px 0 10px">Success! Your model has been generated.<br>Use it as the second argument for create_settings(obj, model).</p><textarea class="model" style="margin: 10px; max-width: none; width: calc(100% - 20px);"></textarea>');
		var modelEl = el.querySelector('.model');
		if (modelEl) {
			modelEl.innerHTML = JSON.stringify(model, false, 4);
			modelEl.style.height = '';
			modelEl.style.height = modelEl.scrollHeight + 5 + 'px';
		}
	}

	console.log(data, $('.settings-creator').serializeObject());

	function traverse() {
		traverses += 1;
		if (traverses > 10000) return;
		// console.log(traverses);
		// console.log('value:', value, 'parent: ', parent, index);

		// check for empty objects and arrays here
		if ((Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
			return nextProp();
		}

		if (buildModel) {
			checkModel();
			questions();
		}
		checkModel();

		if (Array.isArray(value)) {
			// console.log('array');
			index.push(0);
			parent = value;
			value = parent[0];
			if (index[index.length - 2] !== undefined) {
				labels += isNaN(index[index.length - 2]) ? '<label class="fieldset">' + capitalize(index[index.length - 2]) + '</label>' : '';
			}
			labels += '<div class="array-group">';
			traverse();

		} else if (typeof value === 'object' && value) { // typof null === 'object' :P
			// console.log('object');
			var keys = Object.keys(value);
			index.push(keys[0]);
			parent = value;
			value = value[index[index.length - 1]];
			if (index[index.length - 2] !== undefined) {
				labels += isNaN(index[index.length - 2]) ? '<label class="fieldset">' + capitalize(index[index.length - 2]) + '</label>' : '';
			}
			labels += '<div class="object-group">';
			traverse();

		} else if (typeof value === 'function') {

		} else if (value === undefined) {
			// console.log('none');
			if (Array.isArray(parent) && modelActive.sc_add) {
				html('<div style="max-width: 100%; flex: 0 0 100%; border-color: transparent;"><button class="add-item" type="button">Add item</button></div>');
			}
			html('</div>');
			if (index.length === 1) {
				return; // kill it
			}
			index.pop(); // up a level
			value = data;
			for (var i = 0; i < index.length; i += 1) {
				parent = value;
				value = value[index[i]];
			}
			descriptions = {};

			nextProp();
			traverse();

		} else {
			// console.log('new fieldset');
			var type = 'text';
			if (value && value.toString().match(/^#?[a-fA-F0-9]{6}$/)) {
				type = 'color';
				if (value[0] !== '#') value = '#' + value;
			}
			else if (value && !isNaN(Number(value))) type = 'number';
			else if (value === 'on' || value === 'off' || typeof value === 'boolean') type = 'checkbox';
			else if (value && value.length > 134) type = 'textarea';

			var name = '';
			for (var i = 0; i < index.length; i += 1) {
				if (i === 0) name += index[i];
				else name += '[' + index[i] + ']';
			}

			var prop = index[index.length - 1];
			var id = isNaN(prop) ? prop.toLowerCase() : 'a' + prop;
			var dupes = getAllIndexes(ids, id);
			ids.push(id);
			if (dupes > 0) { id += dupes; }

			html(labels);
			labels = '';

			var description = descriptions[prop] ? '<p class="description">' + descriptions[prop] + '</p>' : '';

			html('<div class="fieldset"><label for="' + id + '">' + capitalize(prop) + '</label>');
				if (type !== 'textarea') {
					html('<div><input type="' + type + '" id="' +  id + '" data-key="' + prop + '" name="' +  name + '" value="' + value + '"' + (value === 'on' || value === true ? ' checked' : '') + ' />' + description + '</div>');
				} else {
					html('<div><textarea rows="5" id="' +  id + '" name="' +  name + '"' + (value === 'on' ? ' checked' : '') + '>' + value + '</textarea></div>');
				}
			html('</div>'); // close fieldset

			nextProp();
			traverse();
		}
	}

	function nextProp() {
		if (Array.isArray(parent)) {
			index[index.length - 1] += 1;
		} else {
			var keys = Object.keys(parent);
			for (var i = 0; i < keys.length; i += 1) {
				if (keys[i] === index[index.length - 1]) {
					break;
				}
			}
			index[index.length - 1] = keys[i + 1];
		}

		value = data; // reset value before traversing
		for (var i = 0; i < index.length; i += 1) {
			parent = value;
			value = value[index[i]];
		}
	}

	function html(str) {
		if (('sc_show' in modelActive) && modelActive.sc_show === false) return;
		htmlStr += str;
		el.innerHTML = htmlStr;
	}

	function questions() {
		var show;
		var description;
		// console.log('question', index);
		if (!('sc_show' in modelActive) && (index[index.length - 1] !== undefined || (index[index.length - 1] === undefined && Array.isArray(data)))) {
			var index_path = index.reduce(function (p, c) { return p ? p + '->' + c : c; }, '');
			if (!index_path) index_path = 'Root Item';
			if (notArrayItem()) {
				show = confirm('Show "' + index_path + '"?');
				if (show) {
					if (typeof value !== 'object') {
						description = prompt('Description for "' + index_path + '" ?', '');
						if (description) {
							descriptions[index[index.length - 1]] = description;
							questionChangeModel('sc_description', description);
						}
					}
					if (Array.isArray(value)) {
						questionChangeModel('sc_add', confirm('Allow adding more "' + index_path + '"?'));
					}
				} else {
					questionChangeModel('sc_show', false);
				}
			}
		}
	}

	function questionChangeModel(key, value) {
		var option = model;
		for (var i = 0; i < index.length; i += 1) {
			if (option[index[i]] === undefined) {
				option[index[i]] = {};
			}
			option = option[index[i]];
		}
		option[key] = value;
	}

	function checkModel() {
		modelActive = {};
		var option = model;
		var settings = ['sc_add', 'sc_show']; // sc_type sc_options sc_description

		for (var j = 0; j < settings.length; j += 1) {
			if (settings[j] in option) {
				modelActive[settings[j]] = option[settings[j]];
			}
		}

		for (var i = 0; i < index.length; i += 1) {
			option = option[index[i]];
			if (option === undefined) break;

			for (var j = 0; j < settings.length; j += 1) {
				if (settings[j] in modelActive) continue; // already found
				if (settings[j] in option) {
					modelActive[settings[j]] = option[settings[j]];
				}
			}
		}
	}

	function notArrayItem() {
		// false: if any indexes are num and (>0 or 0 at the end will fail)
		for (var i = 0; i < index.length; i += 1) {
			if (!isNaN(index[i]) && (index[i] !== 0 || (index[i] === 0 && i === index.length - 1))) {
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
		document.querySelector('.settings-creator').addEventListener('click', function (e) {
			// delegate
			if (e.target.matches('.add-item')) {
				// todo: increment index
				var item = e.target.parentNode.previousSibling.cloneNode(true);
				e.target.parentNode.parentNode.insertBefore(item, e.target.parentNode);

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
					label.htmlFor = id;
				}
			}
		});
	}
}
