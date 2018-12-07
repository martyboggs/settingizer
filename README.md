# Settingizer
Include the CSS and JS files in your project:

`<link rel="stylesheet" href="/settingizer/dist/settingizer.css" />`

`<script src="/settingizer/dist/settingizer.js"></script>`

Create settings pages from JS objects.

`create_settings(data);`

Omitting the second argument will make it ask you lots of questions and build a model of your data to be used as the config.

Use the config as the second argument in production:

`create_settings(data, config);`

The data and config properties will both be used to generate settings. If the data and config are out of sync, there will be a warning in the console with information about which properties are out of sync.

`<div class="settingizer"></div>`

Add a `div` with the `settingzer` class. If no element is found, the settings will be added to the `<body>`.

## Config Properties

Your config will be generated with these properties.

| Property | Default | Description | Available |
| --- | --- | --- | --- |
| `sc_show` | true | Show/hide some property. | yes |
| `sc_type` | '' | Choose the type of data. | yes |
| `sc_values` | [] | This is used to list all options, including unselected ones, for dropdowns, buttons, radios, checkboxes etc. | yes |
| `sc_description` | '' | Description text shows below the value area. | yes |
| `sc_add` | false | Let users add more array elements. | yes |
| `sc_grid` | false | If there's an array of arrays with equal length, you can create a grid. | yes |
| `sc_style` | '' | Choose a custom style for the options. | yes |
