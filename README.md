# Settingizer
Create settings pages from JS objects.

`create_settings(data);`

Omitting the second argument will make it ask you lots of questions and build a model of your data to be used as the config.

Use the config as the second argument in production:

`create_settings(data, config);`

The data and config properties will both be used to generate settings. If the data and config are out of sync, there will be a warning in the console with information about which properties are out of sync. (doesn't work yet)

`<div class="settingizer"></div>`

A form element with your settings will be added to elements with the settingizer class. If no element is found, it's added to the `<body>` tag.

## Config Properties

Your config will be generated with these properties.

| Property | Default | Description |
| --- | --- | --- |
| `sc_show` | true | Show/hide some property. |
| `sc_type` | '' | Choose the type of data. |
| `sc_keys` | [] | This is used to specify a complete list and order of properties. |
| `sc_values` | [] | This is used to list all options, including unselected ones, for dropdowns, buttons, radios, checkboxes etc. |
| `sc_description` | '' | Description text shows below the value area. |
| `sc_add` | false | Let users add more array elements. |
| `sc_grid` | false | If there's an array of arrays with equal length, you can create a grid. |
| `sc_style` | '' | Choose a custom style for the options. |
