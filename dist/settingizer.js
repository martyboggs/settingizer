function create_settings(data, model) {
	console.log('data', data);
	console.log('config', model);
	if (typeof data === 'string') {
		// todo: parse json
		return console.log('don\'t pass string');
	}
	// make copy so we can add sc_keys to it
	data = Array.isArray(data) ? data.concat() : Object.assign({}, data);

	// todo: reorder
	// todo: simple array delete button
	// todo: name
	// todo: warning shows for children of sc_show: false
	// todo: classname undefined

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
	// fixCss();
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
			checkModel();
		} else {
			warning();
		}

		var sc_hide = modelActive.sc_show === false ? ' sc-hide' : '';
		var prop = index[index.length - 1];

		if (Array.isArray(value)) {
			// console.log('array');
			if (prop !== undefined && isNaN(prop) && modelActive.sc_label) {
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
			if (gridCheck === 0) {
				if (modelActive.sc_grid) {
					gridCheck = value.length;
					html('<div class="grid array-group' + sc_hide + ' ' + prop + '-group"' + name + min + '>');
				} else {
					html('<div class="array-group' + sc_hide + ' ' + prop + '-group"' + name + min + '>');
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
			if (Array.isArray(parent) && modelActive.sc_add) {
				var orderButtons = modelActive.sc_order ? '<button type="button" class="move-up">-</button><button type="button" class="move-down">+</button>' : '';
				html('<div class="sc-header"><div class="order-buttons">' + orderButtons + '</div><button type="button" class="delete-item">x</button></div>');
			}

			var all_keys = getFirstObject().sc_keys;
			index.push(all_keys ? all_keys[0] : undefined);
			parent = value;
			value = value[index[index.length - 1]];

		} else if (typeof value === 'function') {

		} else if (prop === undefined || (!isNaN(prop) && prop === parent.length)) { // reached end of object/array
			// console.log('end of sc_keys');
			if (Array.isArray(parent) && modelActive.sc_add && gridCheck === 0) {
				html('<div class="array-button"><button class="add-item sc-btn" type="button">Add item</button></div>');
			}
			html('</div>');

			if (gridCheck === 1) {
				html('<div class="grid-buttons"><div><label>X</label><button class="delete-x sc-btn" type="button">-</button><button class="add-x sc-btn" type="button">+</button></div><div><label>Y</label><button class="delete-y sc-btn" type="button">-</button><button class="add-y sc-btn" type="button">+</button></div></div>');
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

			html('<div class="fieldset' + sc_hide + ' ' + className + '">');
				// label
				if (gridCheck === 0 && modelActive.sc_label !== false) html('<label for="' + id + '">' + (modelActive.sc_label ? modelActive.sc_label : capitalize(prop)) + '</label>');
				// option
				html(open_link);
					var option = '';
					if (type === 'textarea') {
						html('<div><textarea rows="5"' + idAtt + key + name + placeholder + readonly + required + (value === 'on' ? ' checked' : '') + '>' + val + '</textarea></div>');
					} else if (type === 'select') {
						option += '<div><select' + idAtt + key + name + required +'>';
						option += modelActive.sc_options.reduce(function (a, v) { return a + '<option value="' + v + '"' + (val === v ? ' selected' : '') + '>' + capitalize(v) + '</option>'; }, '');
						option += '</select></div>';
						html(option);
					} else if (type === 'radios') {
						option += '<div>';
						option += modelActive.sc_options.reduce(function (a, v) { id = getId(prop); return a + '<div class="radioset"><label for="' + id + '">' + capitalize(v) + '</label><input type="radio" id="' + id + '"' + key + name + required + ' value="' + v + '"' + (val === v ? ' checked' : '') + '></div>'; }, '');
						option += '</div>';
						html(option);
					} else if (type === 'buttons') {
					} else if (type === 'button') {
						var button_text = modelActive.sc_button_text;
						if (!button_text) button_text = capitalize(prop);
						if (url) {
							html('<div><a class="sc-btn" href="' + url + '">' + button_text + '</a></div>');
						} else {
							html('<div><button type="button" class="sc-btn">' + button_text + '</button></div>');
						}
					} else {
						html('<div><input type="' + type + '"' + idAtt + key + name + placeholder + readonly + required + ' value="' + val + '"' + (value === 'on' || value === true ? ' checked' : '') + ' />' + description + '</div>');
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

		// todo: delete sc_keys if done? could use original object

		value = data; // reset value before traversing
		for (var i = 0; i < index.length; i += 1) {
			parent = value;
			value = value[index[i]];
		}
	}

	function html(str) {
		htmlStr += str;
		if (buildModel) {
			form.innerHTML = htmlStr;
		}
	}

	function done() {
		if (!buildModel) form.innerHTML = htmlStr + '<div class="sc-submit"><button type="submit" class="sc-btn-primary">Save</button></div>';
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

	function warning() {
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
					// for some props, just look at the current level
					if (['sc_label', 'sc_description'].indexOf(prop) === -1 || i === index.length) {
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
				var par = getClosest('.array-group', e.target);
				var items = par[0].childNodes;
				items = [].slice.call(items, 0, -1); // remove last
				var lastItem = items[items.length - 1];
				if (items.length === 1 && lastItem.style.display === 'none') {
					lastItem.style.display = '';
					disableNameEls(lastItem, false);
				} else {
					var item = lastItem.cloneNode(true);
					fixAtts(item, par[0].dataset.name);
					clearValues(item);
					par[0].insertBefore(item, lastItem.nextSibling);
				}
			} else if (e.target.matches('.add-x')) {
				var par = getClosest('.array-group', e.target);
				var items = par[0].querySelectorAll('.grid-row');
				var lastItem = items[0].childNodes[items[0].childNodes.length - 1];
				var item;
				if (items[0].childNodes.length === 1 && lastItem.style.display === 'none') {
					for (var i = 0; i < items.length; i += 1) {
						items[i].childNodes[items[i].childNodes.length - 1].style.display = '';
						clearValues(items[i].childNodes[items[i].childNodes.length - 1]);
					}
				} else {
					for (var i = 0; i < items.length; i += 1) {
						item = items[i].childNodes[items[i].childNodes.length - 1].cloneNode(true);
						items[i].appendChild(item);
						fixAtts(item, par[0].dataset.name);
						clearValues(item);
					}
				}
			} else if (e.target.matches('.delete-item') || e.target.matches('.delete-y')) {
				var par = getClosest('.array-group', e.target);
				var items = par[0].childNodes;
				items = [].slice.call(items, 0, -1); // remove last item (buttons)
				var lastItem = e.target.matches('.delete-y') ? items[items.length - 1] : par[1];
				if (!par[0].dataset.min || items.length > Number(par[0].dataset.min)) {
					if (items.length > 1) {
						par[0].removeChild(lastItem);
						if (e.target.matches('.delete-item')) {
							items = par[0].childNodes; // refresh
							items = [].slice.call(items, 0, -1); // remove last item (buttons)
							fixAtts(items, par[0].dataset.name);
						}
					} else {
						lastItem.style.display = 'none';
						disableNameEls(lastItem, true);
					}
				}
			} else if (e.target.matches('.delete-x')) {
				var par = getClosest('.array-group', e.target);
				var items = par[0].querySelectorAll('.grid-row');
				var lastItem = items[0].childNodes[items[0].childNodes.length - 1];
				var item;
				if (items[0].childNodes.length > 1) {
					for (var i = 0; i < items.length; i += 1) {
						item = items[i].childNodes[items[i].childNodes.length - 1];
						items[i].removeChild(item);
					}
				} else {
					for (var i = 0; i < items.length; i += 1) {
						items[i].childNodes[items[i].childNodes.length - 1].style.display = 'none';
					}
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

		function disableNameEls(el, bool) {
			var fields = el.querySelectorAll('[name]');
			if (fields.length === 0 && el.name) {
				fields = [el];
			}
			fields.forEach(function (field) { field.disabled = bool; });
		}

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
				els = fieldsets[j].querySelectorAll('input, select');
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

	function clearValues(item) {
		var inputs = item.querySelectorAll('input');
		for (var i = 0; i < inputs.length; i += 1) {
			inputs[i].value = '';
		}
		var selects = item.querySelectorAll('select');
		for (var i = 0; i < selects.length; i += 1) {
			selects[i].selectedIndex = 0;
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
