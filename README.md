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

Your config will be generated with a schema of your data and the answers to the questions it asks in the following properties: sc_show, sc_type, sc_description, sc_add, sc_grid. The rest of the properties can be added to the config manually.


| Property | Default | Description |
| --- | --- | --- |
| sc_show | true | Show/hide some property. |
| sc_type | '' | Choose the type of data. Accepts select, buttons, radios, checkboxes, grid, button. If there's an array of arrays with equal length, you can create a grid. |
| sc_options | [] | This is used to list all options, including unselected ones, for dropdowns, buttons, radios, checkboxes etc. |
| sc_description | '' | Description text shows below the value area. |
| sc_add | false | Let users add more array elements. |
| sc_theme | '' | Only read at the root. Choose a custom style for the options. Accepts: 'shopify' or 'dark' |
| sc_readonly | '' | readonly attribute |
| sc_placeholder | '' | placeholder attribute |
| sc_required | '' | required attribute |
| sc_link | '' | clicking an element will redirect to this url. Use the &ast;&#124;property&#124;&ast; variable to put a value from the parent item into the url, e.g. `{sc_link: '/?id=*|id|*'}`
| sc_button_text | '' | text for button type |
| sc_label | 'Capitalized Property' | Custom text for label. Set to false to hide the label. |

