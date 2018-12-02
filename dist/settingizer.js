window.create_settings = function (data, model) {
	if (typeof data === 'string') return console.log('don\'t pass string');

	var form;
	var htmlStr = '';

	var index = [];
	var parent = data;
	var value = data;
	var ids = [];
	var buildModel = !model;
	var model = model || {};
	var modelActive = {};
	var traverses = 0;
	var descriptions = {};
	var keys = [];
	var gridCheck = 0;

	var el;
	el = document.getElementsByClassName('settingizer')[0];
	if (!el) el = document.body;
	if (!el) return console.warn('Settingizer: Run create_settings() in body or add <div class="settingizer"></div>');

	var form = document.createElement('form');
	build_settings();
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

	function traverse() {
		traverses += 1;
		if (traverses > 10000) return;
		// console.log(traverses);
		// console.log('value:', value, 'parent: ', parent, index);

		// check for empty objects and arrays here
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
			traverse();

		} else if (typeof value === 'object' && value) { // typof null === 'object' :P
			// console.log('object');

			if (index[index.length - 1] !== undefined && isNaN(index[index.length - 1])) {
				html('<label class="fieldset' + sc_hide + '">' + capitalize(index[index.length - 1]) + '</label>');
			}
			html('<div class="object-group' + sc_hide + '">');
			var keys = Object.keys(value);
			index.push(keys[0]);
			parent = value;
			value = value[index[index.length - 1]];
			traverse();

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

			var description = descriptions[prop] ? '<p class="description">' + descriptions[prop] + '</p>' : '';

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
		htmlStr += str;
		form.innerHTML = htmlStr;
	}

	function build_settings() {
		traverse();
		initEvents();
	}

	function questions() {
		var show;
		var grid;
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
						// todo: check that values are primitives
						grid = value.reduce(function (a, v) { return a && Array.isArray(v) && v.length === value.length; }, true);
						if (grid) {
							questionChangeModel('sc_grid', confirm('Format "' + index_path + '" as grid?'));
							questionChangeModel('sc_add', confirm('Allow adding more "' + index_path + '"?'));
						} else if (!modelActive.sc_grid) {
							questionChangeModel('sc_add', confirm('Allow adding more "' + index_path + '"?'));
						}
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
