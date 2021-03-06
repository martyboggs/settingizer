var settingizer = {};

function create_settings(data, model) {
	settingizer.data = data;
	settingizer.config = model;
	if (typeof data === 'string') {
		// todo: parse json
		return console.log('don\'t pass string');
	}
	// make copy so we can add sc_keys to it
	data = Array.isArray(data) ? data.concat() : Object.assign({}, data);

	// todo: simple array delete button
	// todo: warning shows for children of sc_show: false
	// todo: remove classname undefined
	// todo: remove classname with indexes
	// todo: when add-item, generate href from sc_link
	// todo: check if data has primitive value where model says an object should be

	// restrictions: no [ ] allowed in key names

	var htmlStr = '';

	var index = [];
	var parent = data;
	var value = data;
	var buildModel = !model;
	var model = model || {};
	var modelActive = {};
	var ids = ['array', 'object', 'grid', 'grid-row', 'sc-btn'];
	var descriptions = {};
	var gridRows = -1;
	var index_path;
	var empty = false;
	var sc_keys;
	var data_keys = [];
	var model_keys = [];
	var height;
	var animationPadding;

	var traverses = 0;

	// parent only used for checking type
	//(except for *||* sc_link substituter)
	//and length is checked when finding the end of array

	var el;
	el = document.getElementsByClassName('settingizer')[0];
	if (!el) el = document.body;
	if (!el) return console.warn('Settingizer: Run create_settings() in body or add <div class="settingizer"></div>');
	el.className += model.sc_theme ? ' ' + model.sc_theme + '-theme' : '';

	var form = document.createElement('form');
	build_settings();
	// fixCss();
	if (model.sc_action) form.action = model.sc_action;
	if (model.sc_method) form.method = model.sc_method;
	el.appendChild(form);

	if (buildModel) {
		// clean model
		form.innerHTML = '<p class="sc-message">Success! Your model has been generated.<br>Use it as the second argument for create_settings(obj, model).</p><textarea class="config" style="margin: 5px; max-width: none; width: calc(100% - 10px);"></textarea>' + form.innerHTML;
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
		if (traverses > 5000) return;
		// console.log(traverses);

		index_path = index.reduce(function (p, c) { return p ? p + '->' + c : c; }, '');
		index_path = index_path ? '"' + index_path + '"' : 'the root object';

		if (value === null) value = '';

		var prop = index[index.length - 1];

		// if value is undefined, check model
		if (prop !== undefined && firstChild(index) && value === undefined) {
			var modelValue = model;
			for (var i = 0; i < index.length; i += 1) {
				if (modelValue) {
					modelValue = modelValue[isNaN(index[i]) ? index[i] : 0];
					if (i === index.length - 1 && modelValue) {
						if (isNaN(index[i])) {
							parent = parent || {};
						} else {
							empty = true;
							parent = [];
						}
						if (!isObject(modelValue)) { console.error('config must be all nested objects'); }
						var modelValueKeys = Object.keys(modelValue);
						modelValueKeys = modelValueKeys.filter(function (key) { return !key.match(/^sc_/); });
						if (modelValueKeys.length === 0) {
							value = '';
						} else if (modelValueKeys[0] === '0') {
							value = [];
						} else if (modelValueKeys.some(function (v) { return !v.match(/^sc_/); })) { // there's at least one valid key
							value = {};
						}
					}
				}
			}
		}

		// data_keys
		if (isObject(value)) {
			data_keys = getDataKeys(index);
		}

// need value from model for getting data_keys
// need datakeys for questions

		checkModel();
		if (buildModel) questions();
		checkModel();

		var sc_hide = modelActive.sc_show === false ? ' sc-hide' : '';
		// console.log('prop', prop);

		if (isObject(value)) {
			getScKeys();
		}

		// console.log(traverses);
		if (gridRows === -1 && prop !== undefined && value === '' && modelActive.sc_type && modelActive.sc_type === 'grid') {
			value = [['']];
		}
		if (value === undefined && gridRows === 1) {
			gridRows = 0;
		}

		// console.log('index:', index, 'sc_keys:', sc_keys, 'parent:', parent, 'value:', value);

		if (Array.isArray(value)) {
			// console.log('array');
			if (prop !== undefined && isNaN(prop) && (modelActive.sc_label || modelActive.sc_label === undefined)) {
				html('<label class="fieldset' + sc_hide + ' ' + prop + '-label">' + (modelActive.sc_label ? modelActive.sc_label : capitalize(prop)) + '</label>');
			}

			var name = Array.isArray(data) ? ' data-name="root' : ' data-name="';
			for (var i = 0; i < index.length; i += 1) {
				if (i === 0 && !Array.isArray(data)) name += index[i];
				else name += '[' + index[i] + ']';
			}
			name += '"';
			var min = modelActive.sc_min ? ' data-min="' + modelActive.sc_min + '"' : '';

			// if array has as many arrays of the same length
			if (gridRows === -1) {
				if (modelActive.sc_type && modelActive.sc_type === 'grid') {
					gridRows = value.length;
					html('<div class="grid array-group' + sc_hide + ' ' + prop + '-group"' + name + min + '>');
				} else {
					html('<div class="array-group' + sc_hide + ' ' + prop + '-group"' + name + min + '>');
				}
			} else {
				html('<div class="grid-row' + sc_hide + '">');
			}

			// down a level
			index.push(0);
			parent = value;
			value = value[0];

		} else if (isObject(value)) {
			// console.log('object');
			var hide = Array.isArray(parent) && empty && !modelActive.sc_min ? ' style="display: none"' : '';
			if (prop !== undefined && isNaN(prop) && (modelActive.sc_label || modelActive.sc_label === undefined)) {
				html('<label class="fieldset' + sc_hide + ' ' + prop + '-label">' + (modelActive.sc_label ? modelActive.sc_label : capitalize(prop)) + '</label>');
			}
			html('<div class="object-group' + sc_hide + (' ' + prop) + '-group"' + hide + '>');
			if (Array.isArray(parent) && (modelActive.sc_add || modelActive.sc_order)) {
				var orderButtons = modelActive.sc_order ? '<button type="button" class="move-up">-</button><button type="button" class="move-down">+</button>' : '';
				var deleteButton = modelActive.sc_delete ? '<button type="button" class="delete-item">x</button>' : '';
				html('<div class="sc-header"><div class="order-buttons">' + orderButtons + '</div>' + deleteButton + '</div><div class="sc-spacer"></div>');
			}

			// down a level
			index.push(sc_keys ? sc_keys[0] : undefined);
			parent = value;
			value = value[index[index.length - 1]];

		} else if (typeof value === 'function') {

		} else if (prop === undefined || (!isNaN(prop) && prop >= parent.length)) { // reached end of object/array
			// console.log('end of array or object');
			if (index.length === 1) {
				done();
				return; // kill it
			}

			empty = false;

			if (Array.isArray(parent) && modelActive.sc_add && gridRows === -1) {
				html('<div class="array-button"><button class="add-item sc-btn" type="button">Add item</button></div>');
			}
			html('</div>'); // closes array-group or grid-row

			if (gridRows === 0) {
				if (modelActive.sc_add) {
					html('<div class="grid-buttons"><div><label>Columns</label><button class="delete-x sc-btn" type="button">-</button><button class="add-x sc-btn" type="button">+</button></div><div><label>Rows</label><button class="delete-y sc-btn" type="button">-</button><button class="add-y sc-btn" type="button">+</button></div></div>');
				}
				html('</div>'); // closes grid
				index.pop();
			}

			// up a level
			index.pop();
			value = data;
			for (var i = 0; i < index.length; i += 1) {
				parent = value;
				value = value ? value[index[i]] : undefined;
			}

			if (isNaN(index[index.length - 1])) {
				parent = {};
			} else {
				parent = [];
				if (gridRows !== 0) sc_keys = [];
			}

			if (gridRows === 2) {
				gridRows -= 2;
			} else if (gridRows >= 0) {
				gridRows -= 1;
			}

			// reset descriptions
			if (isObject(parent)) {
				getParentScKeys();
				descriptions = {};
			}

			var isLastProp = sc_keys.indexOf(index[index.length - 1]) === sc_keys.length - 1;
			if (!Array.isArray(parent) && !isLastProp) html('<div class="sc-spacer' + sc_hide + '"></div>');
			nextProp();

		} else {
			// console.log('new fieldset');
			var type = modelActive.sc_type || 'text';
			if (type === 'grid') type = 'text';
			if (type === 'text') {
				if (value && value.toString().match(/^#?[a-fA-F0-9]{6}$/)) {
					type = 'color';
					if (value[0] !== '#') value = '#' + value;
				}
				else if (value === 'on' || value === 'off' || typeof value === 'boolean') type = 'checkbox';
				else if (value && !isNaN(Number(value))) type = 'number';
				else if (value && value.length > 134) type = 'textarea';
			}

			var name = Array.isArray(data) ? ' name="root' : ' name="';
			for (var i = 0; i < index.length; i += 1) {
				if (i === 0 && !Array.isArray(data)) name += index[i];
				else name += '[' + index[i] + ']';
			}
			name += '"';
			var key = ' data-key="' + prop + '"';
			var className = prop + ' type-' + type;
			var id = getId(prop);
			var idAtt = ' id="' + id + '"';
			var val = htmlEncode(value);
			var placeholder = modelActive.sc_placeholder ? ' placeholder="' + modelActive.sc_placeholder + '"' : '';
			var readonly = modelActive.sc_readonly ? ' readonly' : '';
			var description = modelActive.sc_description ? '<p class="description">' + modelActive.sc_description + '</p>' : '';
			var required = modelActive.sc_required ? ' required' : '';
			var url = modelActive.sc_link ? modelActive.sc_link.replace(/\*\|(\w+)\|\*/g, function (sub, match) { return parent[match] ? parent[match] : ''; }) : '';
			var open_link = modelActive.sc_link && type !== 'button' ? '<a href="' + url + '">' : '';
			var close_link = modelActive.sc_link && type !== 'button' ? '</a>' : '';
			var disabled = modelActive.sc_disabled || (empty && !modelActive.sc_min) ? ' disabled' : '';
			var isLastProp = isObject(parent) && sc_keys.indexOf(prop) === sc_keys.length - 1;

			html('<div class="fieldset' + sc_hide + ' ' + className + '">');
				// label
				if (gridRows === -1 && modelActive.sc_label !== false) html('<label for="' + id + '">' + (modelActive.sc_label ? modelActive.sc_label : capitalize(prop)) + '</label>');
				// option
				html(open_link);
					var option = '';
					if (type === 'textarea') {
						html('<div><textarea' + idAtt + key + name + placeholder + readonly + required + disabled + (value === 'on' ? ' checked' : '') + '>' + val + '</textarea>' + description + '</div>');
					} else if (type === 'select') {
						option += '<div><div class="select-wrapper"><select' + idAtt + key + name + required + disabled + '>';
						option += modelActive.sc_options.reduce(function (a, v) { return a + '<option value="' + v + '"' + (val === v ? ' selected' : '') + '>' + capitalize(v) + '</option>'; }, '');
						option += '</select><svg style="display: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 16l-4-4h8l-4 4zm0-12L6 8h8l-4-4z"></path></svg></div>' + description + '</div>';
						html(option);
					} else if (type === 'radios') {
						option += '<div>';
						option += modelActive.sc_options.reduce(function (a, v) { id = getId(prop); return a + '<div class="radioset"><label for="' + id + '">' + capitalize(v) + '</label><input type="radio" id="' + id + '"' + key + name + required + disabled + ' value="' + v + '"' + (val === v ? ' checked' : '') + '></div>'; }, '');
						option += '</div>' + description;
						html(option);
					} else if (type === 'buttons') {
						option += '<div>';
						option += modelActive.sc_options.reduce(function (a, v) { id = getId(prop); return a + '<div class="buttonset"><label for="' + id + '">' + capitalize(v) + '</label><input type="radio" id="' + id + '"' + key + name + required + disabled + ' value="' + v + '"' + (val === v ? ' checked' : '') + '></div>'; }, '');
						option += '</div>' + description;
						html(option);
					} else if (type === 'image-swatches') {
						option += '<div class="swatches">';
						option += modelActive.sc_options.reduce(function (a, v) { id = getId(prop); return a + '<div><input type="radio" id="' + id + '"' + key + name + required + disabled + ' value="' + v.key + '"' + (val === v.key ? ' checked' : '') + '><label for="' + id + '" style="background-image: url(' + v.value + ')"></label></div>'; }, '');
						option += '</div>' + description;
						html(option);
					} else if (type === 'button') {
						var button_text = modelActive.sc_button_text;
						if (!button_text) button_text = capitalize(prop);
						if (url) {
							html('<div><a class="sc-btn" href="' + url + '">' + button_text + '</a>' + description + '</div>');
						} else {
							html('<div><button type="button" class="sc-btn">' + button_text + '</button>' + description + '</div>');
						}
					} else {
						html('<div><input type="' + type + '"' + idAtt + key + name + placeholder + readonly + required + disabled + ' value="' + val + '"' + (value === 'on' || value === true ? ' checked' : '') + ' />' + description + '</div>');
					}
				html(close_link);
			html('</div>'); // close fieldset

			if (isObject(parent) && !isLastProp) html('<div class="sc-spacer' + sc_hide + '"></div>');
			nextProp();
		}
		traverse();
	}

	function nextProp() {
		if (Array.isArray(parent)) {
			index[index.length - 1] += 1;
		} else {
			var i = sc_keys.indexOf(index[index.length - 1]);
			index[index.length - 1] = sc_keys[i + 1];
		}

		value = data;
		for (var i = 0; i < index.length; i += 1) {
			if (value) {
				parent = value;
				value = value[index[i]];
			} else {
				parent = isNaN(index[index.length - 1]) ? {} : [];
				value = undefined;
				break;
			}
		}
	}

	function html(str) {
		htmlStr += str;
		if (buildModel) {
			form.innerHTML = htmlStr;
		}
	}

	function done() {
		if (!buildModel) form.innerHTML = htmlStr + '<div class="sc-submit"><button type="submit" class="sc-btn-primary">' + (modelActive.sc_submit_text ? modelActive.sc_submit_text : 'Save') + '</button></div>';
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

		if (show && value !== undefined) { // higher level says show
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
							grid = value.length > 0 && value.every(function (v) { return Array.isArray(v) && v.length > 0 && v.every(function (v) { return typeof v !== 'object'; }); });
							if (grid) {
								var active = questionGetParent();
								active['sc_type'] = confirm('Format ' + index_path + ' as grid?') ? 'grid' : '';
								active['sc_add'] = confirm('Allow adding more ' + index_path + '?');
							} else if (!modelActive.sc_type || modelActive.sc_type !== 'grid') {
								questionGetParent()['sc_add'] = confirm('Allow adding more ' + index_path + '?');
							}
						}
					}
				}
			}
		}

		// get model_value
		if (isObject(value) || (Array.isArray(parent) && parent.length === 0 && value === undefined)) {
			if (childrenOf0(index)) {
				var keyStr = prompt('Enter all the available keys for ' + index_path + ' in the order you want them.', data_keys.join(','));
				// todo: support hiding keys if they are removed from this list
				if (keyStr) {
					model_keys = keyStr.split(',');
					model_keys = model_keys.map(function (key) { return key.trim(); });
					model_keys = model_keys.reduce(function (a, v) { if (v && a.indexOf(v) === -1) { a.push(v); } return a; }, []);
					var type;
					var validTypes = ['text', 'number', 'buttons', 'radio', 'checkbox', 'button'];
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
		}
	}

	function getScKeys() {
		// find all unique props for this level
		// don't need to ask "show" if object? "Show" is needed, since props in data, but not model need to be asked about
		var isChildOf0 = childrenOf0(index);

		// todo: add if (show) to some places here

		// model_keys
		if (buildModel) {
			// got model_value in questions()
		} else {
			var model_value = model;
			for (var i = 0; i < index.length; i += 1) {
				if (model_value) {
					model_value = model_value[isNaN(index[i]) ? index[i] : 0];
				} else {
					if (isChildOf0) console.warn('Config is missing all the keys for ' + index_path);
					break;
				}
			}
			if (model_value) {
				var model_keys = Object.keys(model_value);
				model_keys = model_keys.filter(function (key) { return !key.match(/^sc_/); });
				var extra_data = data_keys.reduce(function (a, v) { if (model_keys.indexOf(v) === -1) { a.push(v); } return a; }, []);
				if (isChildOf0 && extra_data.length) console.warn('Config is missing ' + extra_data.join(', ') + ' from ' + index_path + '.');
			}
		}
		sc_keys = concatUnique(model_keys, data_keys);
	}

	function getParentScKeys() {
		// refresh sc_keys when going up a level
		// needs to based on value and model

		var data_keys = getDataKeys(index.slice(0, -1));
		var model_keys = [];

		var model_value = model;
		for (var i = 0; i < index.slice(0, -1).length; i += 1) {
			if (model_value) {
				model_value = model_value[isNaN(index[i]) ? index[i] : 0];
			} else {
				break;
			}
		}

		if (model_value) {
			var model_keys = Object.keys(model_value);
			model_keys = model_keys.filter(function (key) { return !key.match(/^sc_/); });
		}
		sc_keys = concatUnique(model_keys, data_keys);
	}

	function questionGetParent() {
		//  builds the model recursively
		var option = model;
		for (var i = 0; i < index.length; i += 1) {
			if (option[index[i]] === undefined) {
				option[index[i]] = {};
			}
			option = option[index[i]];
		}
		return option;
	}

	function getDataKeys(index) {
		// gets all data keys including those from sibling/cousin elements
		var value = data;
		var keys = [];
		var otherIndex = index.concat();
		var otherValue;
		var distance;
		var nextDistance = 0;
		if (index.length === 0) return Object.keys(data);

		for (var i = 0; i < index.length; i += 1) {
			if (value) {
				value = value[index[i]];
				if (i === index.length - 1 && value) {
					keys = Object.keys(value);
				}
			}
		}

		while (1) {
			for (var i = 0; i < otherIndex.length; i += 1) {
				if (i >= nextDistance && !isNaN(otherIndex[i])) {
					otherIndex[i] += 1;
					distance = i;
					break;
				} else {
					return keys;
				}
			}

			otherValue = data;
			for (var i = 0; i < otherIndex.length; i += 1) {
				if (otherValue) {
					otherValue = otherValue[otherIndex[i]];
					if (i === otherIndex.length - 1) {
						if (otherValue) {
							keys = concatUnique(keys, Object.keys(otherValue));
						} else {
							nextDistance = distance + 1;
						}
					}
				} else {
					if (i === distance + 1) {
						otherIndex[distance] = 0;
						nextDistance = distance + 1;
					}
					break;
				}
			}
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
		var i;
		var prop;
		// checks index = [] too
		for (i = 0; i < index.length + 1; i += 1) {
			for (prop in option) {
				if (prop.match(/^sc_/)) {
					// for some props, just look at the current level
					if (['sc_label', 'sc_description', 'sc_action', 'sc_method', 'sc_disabled', 'sc_submit_text'].indexOf(prop) === -1 || i === index.length) {
						modelActive[prop] = option[prop];
					}
				}
			}
			option = option[isNaN(index[i]) ? index[i] : 0];
			if (option === undefined) break;
		}
	}

	function childrenOf0NoItem() { // false: if any indexes are num and (not 0 or 0 at the end will fail)
		for (var i = 0; i < index.length; i += 1) {
			if (!isNaN(index[i]) && (index[i] !== 0 || (index[i] === 0 && i === index.length - 1))) {
				return false;
			}
		}
		return true;
	}

	function childrenOf0(index) { // false: if any indexes are num and not 0
		for (var i = 0; i < index.length; i += 1) {
			if (!isNaN(index[i]) && (index[i] !== 0)) {
				return false;
			}
		}
		return true;
	}

	function firstChild(index) { // true if last index is 0
		for (var i = index.length - 1; i >= 0; i -= 1) {
			if (!isNaN(index[i])) {
				return index[i] === 0;
			}
		}
		return true;
	}

	function capitalize(string) {
		// todo: add space if words go from lowercase to uppercase
		if (typeof string !== 'string') return string;
		var mod_string = string.replace(/[-_]|([a-z])([A-Z])/g, '$1 $2');
		mod_string = mod_string.replace(/^.|\s./g, function (str) { return str.toUpperCase(); });
		return mod_string;
	}

	function getAllIndexes(arr, val) {
		var indexes = 0;
		var i;
		for (i = 0; i < arr.length; i += 1) {
			if (arr[i] === val) indexes++;
		}
		return indexes;
	}

	function getId(prop) {
		var id = isNaN(prop) ? prop.toLowerCase() : 'a' + prop;
		var dupes = getAllIndexes(ids, id);
		ids.push(id);
		if (dupes > 0) { id += dupes; }
		return id;
	}

	function initEvents() {
		el.addEventListener('click', function (e) {
			// delegate
			if (e.target.matches('.add-item') || e.target.matches('.add-y')) {
				var par = getClosest('.array-group', e.target);
				var items = par[0].childNodes;
				items = [].slice.call(items, 0, -1); // remove last
				var lastItem = items[items.length - 1];
				if (items.length === 1 && lastItem.style.display === 'none') {
					lastItem.style.display = '';
					initShowAnimation(lastItem);
					showAnimation(lastItem);
					clearValues(lastItem);
					disableNameEls(lastItem, false);
				} else {
					var item = lastItem.cloneNode(true);
					par[0].insertBefore(item, lastItem.nextSibling);
					initShowAnimation(item);
					showAnimation(item);
					clearValues(item);
					fixAtts(item, par[0].dataset.name);
				}
			} else if (e.target.matches('.add-x')) {
				var par = getClosest('.array-group', e.target);
				var items = par[0].querySelectorAll('.grid-row');
				var firstLastItem = items[0].childNodes[items[0].childNodes.length - 1];
				var item, lastItem;
				if (items[0].childNodes.length === 1 && firstLastItem.style.display === 'none') {
					for (var i = 0; i < items.length; i += 1) {
						lastItem = items[i].childNodes[items[i].childNodes.length - 1];
						lastItem.style.display = '';
						initShowAnimation(lastItem);
						showAnimation(lastItem);
						clearValues(lastItem);
						disableNameEls(lastItem, false);
					}
				} else {
					for (var i = 0; i < items.length; i += 1) {
						item = items[i].childNodes[items[i].childNodes.length - 1].cloneNode(true);
						items[i].appendChild(item);
						initShowAnimation(item);
						showAnimation(item);
						clearValues(item);
						fixAtts(item, par[0].dataset.name);
					}
				}
			} else if (e.target.matches('.delete-item') || e.target.matches('.delete-y')) {
				var par = getClosest('.array-group', e.target);
				var items = par[0].childNodes;
				items = [].slice.call(items, 0, -1); // remove last item (buttons)
				var lastItem = e.target.matches('.delete-y') ? items[items.length - 1] : par[1];
				if (!par[0].dataset.min || items.length > Number(par[0].dataset.min)) {
					if (items.length > 1) {
						initHideAnimation(lastItem);
						hideAnimation(lastItem);
						setTimeout(function () {
							par[0].removeChild(lastItem);
							if (e.target.matches('.delete-item')) {
								items = par[0].childNodes; // refresh
								items = [].slice.call(items, 0, -1); // remove last item (buttons)
								// fixAtts(items, par[0].dataset.name);
							}
						}, 400);
					} else {
						if (e.target.matches('.delete-y')) return; // can't delete last row
						initHideAnimation(lastItem);
						hideAnimation(lastItem);
						setTimeout(function () {
							lastItem.style.display = 'none';
							disableNameEls(lastItem, true);
						}, 400);
					}
				}
			} else if (e.target.matches('.delete-x')) {
				var par = getClosest('.array-group', e.target);
				var items = par[0].querySelectorAll('.grid-row');
				var lastItem;
				if (items[0].childNodes.length > 1) {
					for (var i = 0; i < items.length; i += 1) {
						lastItem = items[i].childNodes[items[i].childNodes.length - 1];
						items[i].removeChild(lastItem);
					}
				} else {
					// can't delete last column
				}
			} else if (e.target.matches('.move-up') || e.target.matches('.move-down')) {
				var par = getClosest('.array-group', e.target);
				var items = par[0].childNodes;
				items = [].slice.call(items, 0, -1); // remove last item (buttons)
				if (e.target.matches('.move-up')) {
					if (par[1].previousSibling) {
						par[0].insertBefore(par[1], par[1].previousSibling);
						items = par[0].childNodes; // refresh
						items = [].slice.call(items, 0, -1); // remove last item (buttons)
						fixAtts(items, par[0].dataset.name);
					}
				} else {
					if (par[1].nextSibling.nextSibling) {
						par[0].insertBefore(par[1], par[1].nextSibling.nextSibling);
						items = par[0].childNodes; // refresh
						items = [].slice.call(items, 0, -1); // remove last item (buttons)
						fixAtts(items, par[0].dataset.name);
					}
				}
			}
		});

		function initShowAnimation(item) {
			item.style.transition = '';
			item.style.overflow = 'hidden';
			item.style.transform = 'rotateX(-90deg)';
			// item.style.opacity = '0';
		}

		function showAnimation(item) {
			setTimeout(function () {
				item.style.transition = 'all 0.3s ease-in-out';
				item.style.transform = 'none';
				// item.style.opacity = '1';
			});
		}

		function initHideAnimation(item) {
			item.style.transition = '';
		}

		function hideAnimation(item) {
			setTimeout(function () {
				item.style.transition = 'all 0.3s ease-in-out';
				item.style.transform = 'rotateX(-90deg)';
				// item.style.opacity = '0';
			});
		}

		el.addEventListener('mousedown', function (e) {
			// // check if clicking the rearrange icon
			return; // remove this
			var par = getClosest('.array-group', e.target);
			if (par) {
				par[1].onDragStart = function () {
					return false;
				}
				draggable(par[1]);
			}
		});

		function draggable(el) {
			var position = el.style.position;
			var zIndex = el.style.zIndex;
			el.style.position = 'absolute';
			el.style.zIndex = 1000;
			// todo: height too

			// document.body.append(el);

			moveAt(event.pageX, event.pageY);

			function moveAt(pageX, pageY) {
				el.style.left = pageX - el.offsetWidth / 2 + 'px';
				el.style.top = pageY - el.offsetHeight / 2 + 'px';
			}

			function onMouseMove(event) {
				moveAt(event.pageX, event.pageY);
			}

			document.addEventListener('mousemove', onMouseMove);

			el.onmouseup = function() {
				document.removeEventListener('mousemove', onMouseMove);
				el.onmouseup = null;
				el.style.position = position;
				el.style.zIndex = zIndex;
			};
		}
	}

	function getClosest(search, target) {
		var el = target;
		var lastEl;
		var type = search[0];
		var att;
		if (type === '.') {
			att = 'className';
			search = search.slice(1);
		} else if (type === '#') {
			att = 'id';
			search = search.slice(1);
		} else {
			att = 'tagName';
		}
		while (el && el.tagname !== 'HTML') {
			lastEl = el;
			el = el.parentNode;
			if (el && el[att] && el[att].indexOf(search) !== -1) {
				return [el, lastEl];
			}
		}
		return false;
	}

	function disableNameEls(el, bool) {
		var fields = el.querySelectorAll('[name]');
		if (fields.length === 0 && el.name) {
			fields = [el];
		}
		fields.forEach(function (field) { field.disabled = bool; });
	}

	function fixAtts(itemOrItems, key) { // updates id, for, name
		var i, j, k;
		var item, fieldsets;
		var items = itemOrItems.length ? itemOrItems : [itemOrItems];
		var reg = items[0].parentNode && items[0].parentNode.className.indexOf('grid-row') !== -1
			? new RegExp('^' + key.replace(/\[/g, '\\[').replace(/\]/g, '\\]') + '\\[\\d+\\]\\[(\\d+)\\]')
			: new RegExp('^' + key.replace(/\[/g, '\\[').replace(/\]/g, '\\]') + '\\[(\\d+)\\]');
		for (i = 0; i < items.length; i += 1) {
			item = items[i];
			fieldsets = item.querySelectorAll('div.fieldset');
			if (item.matches('div.fieldset')) fieldsets = [item];
			var els, id, prev;
			for (j = 0; j < fieldsets.length; j += 1) {
				els = fieldsets[j].querySelectorAll('input, textarea, select');
				for (k = 0; k < els.length; k += 1) {
					// id
					id = getId(els[k].dataset.key);
					els[k].id = id;
					// for
					prev = els[k].previousSibling;
					if (prev && prev.tagname === 'LABEL') prev.htmlFor = id;
					next = els[k].nextSibling;
					if (next && next.tagname === 'LABEL') next.htmlFor = id;
					// name
					els[k].name = els[k].name.replace(reg, function (substring, match, ind, original) {
						var place = substring.length - match.length - 1;
						return original.slice(0, place) + (itemOrItems.length ? i : Number(match) + 1) + ']';
					});
				}
			}
		}
	}

	function isObject(obj) {
		// typeof null === 'object' :P
		if (obj && !Array.isArray(obj) && typeof obj === 'object') return true;
		return false;
	}

	function clearValues(item) {
		var i, j;
		var inputs = item.querySelectorAll('input, textarea');
		for (i = 0; i < inputs.length; i += 1) {
			inputs[i].value = '';
		}
		var selects = item.querySelectorAll('select');
		for (i = 0; i < selects.length; i += 1) {
			selects[i].selectedIndex = 0;
		}
		var arrays = item.querySelectorAll('.array-group');
		var items;
		for (i = 0; i < arrays.length; i += 1) {
			if (arrays[i].className && arrays[i].className.indexOf('grid') !== -1) continue;
			items = arrays[i].childNodes;
			for (j = 0; j < items.length; j += 1) {
				if (items[j].className && items[j].className.indexOf('array-button') !== -1) continue;
				if (j === 0) {
					items[j].style.display = 'none';
					disableNameEls(items[j], true);
				} else {
					arrays[i].removeChild(items[j]);
					j -= 1;
				}
			}
		}
	}

	function fixCss() {
		var groups = form.querySelectorAll('.object-group');
		var i;
		groups.forEach(function (group) {
			for (i = group.childNodes.length - 1; i >= 0; i -= 1) {
				if (group.childNodes[i].matches('div.fieldset') && !group.childNodes[i].matches('.sc-hide')) {
					group.childNodes[i].style.paddingBottom = '10px';
					break;
				}
			}
		});
	}

	function htmlEncode(str) {
		var elt = document.createElement('span');
		elt.textContent = str;
		return elt.innerHTML.replace(/"/g, '&quot;');
	}
}
