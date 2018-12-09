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
	el.className += model.sc_theme ? ' ' + model.sc_theme + '-theme' : '';

	var form = document.createElement('form');
	build_settings();
	fixCss();
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
		if (traverses > 5000) return;
		// console.log(traverses);
		// console.log('index: ', index);
		// console.log('value: ', value);
		// console.log('parent: ', parent);

		index_path = index.reduce(function (p, c) { return p ? p + '->' + c : c; }, '');
		index_path = index_path ? '"' + index_path + '"' : 'the root object';

		if (value === null) value = '';

		// check for empty [] {}
		if (Array.isArray(value)) {
			if (value.length === 0) {
				nextProp();
				traverse();
				return;
			}
	 	} else if (typeof value === 'object') {
			if (Object.keys(value).length === 0) {
				nextProp();
				traverse();
				return;
			}
		}

		checkModel();
		if (buildModel) {
			questions();
		}
		checkModel(); // if questions can checkModel too, this can be removed

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
				value.sc_keys = concatUnique(model_keys, data_keys);
			}
		}

		var sc_hide = modelActive.sc_show === false ? ' sc-hide' : '';
		var prop = index[index.length - 1];

		if (Array.isArray(value)) {
			// console.log('array');
			var prop = index[index.length - 1];
			if (prop !== undefined && isNaN(prop) && modelActive.sc_label !== false) {
				html('<label class="fieldset' + sc_hide + ' ' + prop + '-label">' + (modelActive.sc_label ? modelActive.sc_label : capitalize(prop)) + '</label>');
			}
			// if array has as many arrays of the same length
			if (gridCheck === 0) {
				if (modelActive.sc_grid) {
					gridCheck = value.length;
					html('<div class="grid array-group' + sc_hide + ' ' + prop + '-group">');
				} else {
					html('<div class="array-group' + sc_hide + ' ' + prop + '-group">');
				}
			} else {
				html('<div class="grid-row' + sc_hide + '">');
			}
			index.push(0);
			parent = value;
			value = parent[0];

		} else if (typeof value === 'object' && value) { // typeof null === 'object' :P
			// console.log('object');
			if (prop !== undefined && isNaN(prop) && modelActive.sc_label !== false) {
				html('<label class="fieldset' + sc_hide + ' ' + prop + '-label">' + (modelActive.sc_label ? modelActive.sc_label : capitalize(prop)) + '</label>');
			}
			html('<div class="object-group' + sc_hide + ' ' + prop + '-group">');
			var all_keys = getFirstObject().sc_keys;
			index.push(all_keys ? all_keys[0] : undefined);
			parent = value;
			value = value[index[index.length - 1]];

		} else if (typeof value === 'function') {

		} else if (index[index.length - 1] === undefined || (!isNaN(index[index.length - 1]) && index[index.length - 1] === parent.length)) { // reached end of object/array
			// console.log('end of sc_keys');
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
				done();
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
			var type = modelActive.sc_type || 'text';
			if (type === 'text') {
				if (value && value.toString().match(/^#?[a-fA-F0-9]{6}$/)) {
					type = 'color';
					if (value[0] !== '#') value = '#' + value;
				}
				else if (value === 'on' || value === 'off' || typeof value === 'boolean') type = 'checkbox';
				else if (value && !isNaN(Number(value))) type = 'number';
				else if (value && value.length > 134) type = 'textarea';
			}

			var name = Array.isArray(data) ? 'root' : '';
			for (var i = 0; i < index.length; i += 1) {
				if (i === 0 && !Array.isArray(data)) name += index[i];
				else name += '[' + index[i] + ']';
			}
			var prop = index[index.length - 1];
			var className = prop + ' type-' + type;
			var id = getId(prop);
			var val = htmlEncode(value);
			var placeholder = modelActive.sc_placeholder ? ' placeholder="' + modelActive.sc_placeholder + '"' : '';
			var readonly = modelActive.sc_readonly ? ' readonly' : '';
			var description = modelActive.sc_description ? '<p class="description">' + modelActive.sc_description + '</p>' : '';
			var required = modelActive.sc_required ? ' required' : '';
			var url = modelActive.sc_link ? modelActive.sc_link.replace(/\*\|(\w+)\|\*/g, function (sub, match) { return parent[match] ? parent[match] : ''; }) : '';
			var open_link = modelActive.sc_link && type !== 'button' ? '<a href="' + url + '">' : '';
			var close_link = modelActive.sc_link && type !== 'button' ? '</a>' : '';

			html('<div class="fieldset' + sc_hide + ' ' + className + '">');
			// label
			if (gridCheck === 0 && modelActive.sc_label !== false) html('<label for="' + id + '">' + (modelActive.sc_label ? modelActive.sc_label : capitalize(prop)) + '</label>');
			// option
			html(open_link);
				var option = '';
				if (type === 'textarea') {
					html('<div><textarea rows="5" id="' + id + '" data-key="' + prop + '" name="' + name + '"' + placeholder + readonly + required + (value === 'on' ? ' checked' : '') + '>' + val + '</textarea></div>');
				} else if (type === 'select') {
					option += '<div><select id="' + id + '" data-key="' + prop + '" name="' + name + '"' + required +'>';
					option += modelActive.sc_options.reduce(function (a, v) { return a + '<option value="' + v + '"' + (val === v ? ' selected' : '') + '>' + capitalize(v) + '</option>'; }, '');
					option += '</select></div>';
					html(option);
				} else if (type === 'radios') {
					option += '<div>';
					option += modelActive.sc_options.reduce(function (a, v) { id = getId(prop); return a + '<div class="radioset"><label for="' + id + '">' + capitalize(v) + '</label><input type="radio" id="' + id + '" data-key="' + prop + '" name="' + name + '"' + required + ' value="' + v + '"' + (val === v ? ' checked' : '') + '></div>'; }, '');
					option += '</div>';
					html(option);
				} else if (type === 'buttons') {
				} else if (type === 'button') {
					html('<div><a class="sc-btn" href="' + url + '">' + modelActive.sc_button_text + '</a></div>');
				} else {
					html('<div><input type="' + type + '" id="' + id + '" data-key="' + prop + '" name="' + name + '"' + placeholder + readonly + required + ' value="' + val + '"' + (value === 'on' || value === true ? ' checked' : '') + ' />' + description + '</div>');
				}
				html(close_link);
			html('</div>'); // close fieldset
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

		// todo: delete sc_keys if done?

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

	function done() {
		if (!buildModel) form.innerHTML = htmlStr + '<div class="sc-submit"><button type="submit">Send</button></div>';
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
							grid = value.reduce(function (a, v) { return a && Array.isArray(v) && v.length === value.length; }, true);
							if (grid) {
								var active = questionGetParent();
								active['sc_type'] = confirm('Format ' + index_path + ' as grid?') ? 'grid' : '';
								active['sc_add'] = confirm('Allow adding more ' + index_path + '?');
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
		var i;
		var prop;
		// checks index = [] too
		for (i = 0; i < index.length + 1; i += 1) {
			for (prop in option) {
				if (prop.match(/^sc_/)) {
					// for some props, just look at the last one
					if (['sc_label'].indexOf(prop) === -1 || i === index.length) {
						modelActive[prop] = option[prop];
					}
				}
			}
			option = option[isNaN(index[i]) ? index[i] : 0];
			if (option === undefined) break;
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
				// todo: increment index
				// todo: clear values
				var item = e.target.parentNode.previousSibling.cloneNode(true);
				fixAtts(item);
				e.target.parentNode.parentNode.insertBefore(item, e.target.parentNode);
			} else if (e.target.matches('.add-x') || e.target.matches('.add-y')) {
				if (e.target.matches('.add-x')) {
					var rows = e.target.parentNode.parentNode.querySelectorAll('.grid-row');
					for (var i = 0; i < rows.length; i += 1) {
						item = rows[i].children[rows[i].children.length - 1].cloneNode(true);
						fixAtts(item);
						rows[i].appendChild(item);
					}
				} else {
					var item = e.target.parentNode.previousSibling.cloneNode(true);
					fixAtts(item);
					e.target.parentNode.parentNode.insertBefore(item, e.target.parentNode);
				}
			}
		});
	}

	function fixAtts(item) { // updates id, for, name
		var fieldsets = item.querySelectorAll('div.fieldset');
		if (item.matches('div.fieldset')) fieldsets = [item];
		var els, id, prev;
		for (var i = 0; i < fieldsets.length; i += 1) {
			els = fieldsets[i].querySelectorAll('input, select');
			for (var j = 0; j < els.length; j += 1) {
				// id
				id = getId(els[j].dataset.key);
				els[j].id = id;
				// for
				prev = els[j].previousSibling;
				if (prev && prev.tagname === 'LABEL') prev.htmlFor = id;
				next = els[j].nextSibling;
				if (next && next.tagname === 'LABEL') next.htmlFor = id;
				// name - todo: doesn't work
				els[j].name = els[j].name.replace(/^.+(?:\[(\d+)\])/, function (substring, match, ind, original) {
					var place = substring.length - match.length - 1;
					return original.slice(0, place) + (Number(match) + 1) + ']';
				});
			}
		}
	}

	function fixCss() {
		var groups = form.querySelectorAll('.object-group');
		var i;
		groups.forEach(function (group) {
			for (i = group.childNodes.length - 1; i >= 0; i -= 1) {
				if (group.childNodes[i].matches('div.fieldset') && !group.children[i].matches('.sc-hide')) {
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
