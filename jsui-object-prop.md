# JSUI Object Attributes & Properties Reference

## Status Summary

- **Parameter persistence**: ✅ Solved using `save()` function with `embedmessage()` and timed restoration
- **Parameter attribute access**: ✅ All attributes readable/writable with `box.getattr()`/`box.setattr()`
- **Live parameter registration**: ❌ Objects don't appear in Live automation lanes (requires Cycling74 investigation)

## ⚠️ Important Notes from Cycling74 staff on Discord

- **M4L Runtime Changes**: Inside Max for Live, you **should not change parameter attributes at runtime** (changes may be ignored, have unexpected results, or crash)
- **Two Separate Systems**: `parameter_mappable` controls Max's mapping, `_parameter_invisible` controls Live's parameter visibility

---

## Usage Context

- **Inside JSUI code**: `box.getattr("varname")` and `box.setattr("varname", "new_name")`
- **External scripts**: `this.patcher.getnamed("jsui_name").getattr("varname")`
- **Max messages**: Send messages directly to the JSUI object

**Status Legend:**
- ✅ **Confirmed** - Verified working
- 🔍 **TBTC** - To Be Tested and Confirmed
- ⚠️ **Context-Dependent** - Behavior varies

---



## PARAMETER ATTRIBUTES

These attributes control how the JSUI object behaves as a parameter in Live devices, automation, and modulation contexts.

### `_parameter_modmode` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Controls the modulation mode for the parameter
- **Usage**: Sets how external modulation sources affect this parameter
- **Example**: `box.setattr("_parameter_modmode", 1);`
- **Range**: 0 (none), 1 (bipolar), 2 (unipolar)

### `_parameter_longname` 🔍 **TBTC**
- **Value**: `"jsui"`
- **Description**: The full display name for the parameter in Live's device view
- **Usage**: Set a descriptive name that appears in automation lanes and device interfaces
- **Example**: `box.setattr("_parameter_longname", "Master Volume");`

### `_parameter_invisible` ✅
- **Value**: `1`
- **Description**: Controls whether the parameter appears in Live's parameter list and automation lanes
- **Usage**: Set to 0 to make parameter visible in Live automation
- **Example**: `box.setattr("_parameter_invisible", 0);` - used in implementation
- **Range**: 0 (visible in Live), 1 (hidden from Live)

### `_parameter_shortname` 🔍 **TBTC**
- **Value**: `"jsui"`
- **Description**: Abbreviated name used in contexts with limited space
- **Usage**: Provide a short version of the parameter name for compact displays
- **Example**: `box.setattr("_parameter_shortname", "Vol");`

### `_parameter_speedlim` 🔍 **TBTC**
- **Value**: `1.00`
- **Description**: Rate limiting for parameter changes to prevent zipper noise in audio processing
- **Usage**: Control how fast parameter values can change
- **Example**: `box.setattr("_parameter_speedlim", 0.5);`
- **Range**: 0.0-1.0 (0 = no limiting, 1 = maximum smoothing)

### `_parameter_modrange` 🔍 **TBTC**
- **Value**: `0.00 127.00`
- **Description**: The range within which modulation sources can affect the parameter
- **Usage**: Define the boundaries for external modulation (LFOs, envelopes, etc.)
- **Example**: `box.setattr("_parameter_modrange", [0., 100.]);`
- **Note**: Array format needs verification for JSUI context

### `_parameter_osc_enabled` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Enables Open Sound Control (OSC) communication for this parameter
- **Usage**: Allow remote control via OSC protocol
- **Example**: `box.setattr("_parameter_osc_enabled", 1);`
- **Range**: 0 (disabled), 1 (enabled)

### `_parameter_enum_icons` 🔍 **TBTC**
- **Value**: `jsobject -1407374883553280` (null/unset)
- **Description**: JavaScript object containing icon definitions for enumerated parameters
- **Usage**: Define custom icons for discrete parameter values (when parameter type is enum)
- **Example**: `box.setattr("_parameter_enum_icons", icon_array);` 
- **Note**: Large negative number indicates null/unset value - needs testing for proper object handling

### `_parameter_initial_enable` ✅
- **Value**: `1`
- **Description**: Whether the parameter uses its initial value on device load
- **Usage**: Control startup behavior of parameter values
- **Example**: `box.setattr("_parameter_initial_enable", 1);` - used in implementation
- **Range**: 0 (use current), 1 (use initial)

### `_parameter_defer` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Defers parameter updates to avoid threading issues
- **Usage**: Enable for parameters that might cause timing problems
- **Example**: `box.setattr("_parameter_defer", 1);`
- **Range**: 0 (immediate), 1 (deferred)

### `_parameter_unitstyle` ✅
- **Value**: `4`
- **Description**: Display format for parameter values in Live's interface
- **Usage**: Control how parameter values are shown (%, dB, Hz, etc.)
- **Example**: `box.setattr("_parameter_unitstyle", 2);` - used in implementation
- **Common Values**: 0 (int), 1 (float), 2 (time), 3 (hertz), 4 (decibels), 5 (percent), 6 (Pan), 7 (Semitone), 8 (MIDI Note), 9 (Custom) 10 (Native - Type)

### `_parameter_osc_name` 🔍 **TBTC**
- **Value**: `"<default>"`
- **Description**: Custom OSC address name for remote control
- **Usage**: Define specific OSC path for this parameter
- **Example**: `box.setattr("_parameter_osc_name", "/device/volume");`

### `_parameter_type` ✅
- **Value**: `0`
- **Description**: Parameter data type (float, int, enum, etc.)
- **Usage**: Define what kind of values this parameter accepts
- **Example**: `box.setattr("_parameter_type", 1);` - used in implementation
- **Range**: 0 (float), 1 (int), 2 (enum), 3 (blob)

### `_parameter_order` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Display order in Live's parameter list
- **Usage**: Control the sequence parameters appear in device interfaces
- **Example**: `box.setattr("_parameter_order", 1);`

### `_parameter_units` 🔍 **TBTC**
- **Value**: `""`
- **Description**: Custom unit string displayed after parameter values
- **Usage**: Add units like "Hz", "ms", "dB" to parameter displays
- **Example**: `box.setattr("_parameter_units", "Hz");`

### `_parameter_exponent` 🔍 **TBTC**
- **Value**: `1.00`
- **Description**: Curve exponent for non-linear parameter scaling
- **Usage**: Create logarithmic or exponential parameter curves
- **Example**: `box.setattr("_parameter_exponent", 2.0);`
- **Range**: 0.01-100.0 (1.0 = linear, >1 = exponential, <1 = logarithmic)

### `_parameter_osc_valuemode` 🔍 **TBTC**
- **Value**: `0`
- **Description**: How OSC values are interpreted (normalized vs. raw)
- **Usage**: Control OSC value scaling behavior
- **Example**: `box.setattr("_parameter_osc_valuemode", 1);`
- **Range**: 0 (normalized 0-1), 1 (parameter range)

### `_parameter_initial` ✅
- **Value**: `0.00`
- **Description**: The initial parameter value used when parameter is reset
- **Usage**: Set the default value when parameter is reset or device loads
- **Example**: `box.setattr("_parameter_initial", 0.5);` - used in implementation

### `_parameter_range` ✅
- **Value**: `0.00 127.00`
- **Description**: Minimum and maximum values for the parameter
- **Usage**: Define the operational range of the parameter
- **Example**: `box.setattr("_parameter_range", [0., 1.]);` - used in implementation

### `_parameter_linknames` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Links parameter names across multiple instances
- **Usage**: Synchronize parameter naming in multi-instance scenarios
- **Example**: `box.setattr("_parameter_linknames", 1);`
- **Range**: 0 (independent), 1 (linked)

### `_parameter_steps` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Number of discrete steps for quantized parameters
- **Usage**: Create stepped parameters (like preset selectors)
- **Example**: `box.setattr("_parameter_steps", 8);`
- **Range**: 0 (continuous), >0 (number of steps)

---

## REGULAR ATTRIBUTES

These attributes control the basic appearance, behavior, and functionality of the JSUI object.

### `annotation` 🔍 **TBTC**
- **Value**: `""`
- **Description**: Tooltip text that appears when hovering over the object
- **Usage**: Provide helpful information about the object's function
- **Example**: `box.setattr("annotation", "Controls master volume level");`

### `background` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Controls whether the object draws a background
- **Usage**: Set visual appearance of the JSUI object
- **Example**: `box.setattr("background", 1);`
- **Range**: 0 (transparent), 1 (opaque background)

### `border` 🔍 **TBTC**
- **Value**: `1`
- **Description**: Controls whether a border is drawn around the object
- **Usage**: Define visual boundaries of the JSUI object
- **Example**: `box.setattr("border", 0);`
- **Range**: 0 (no border), 1 (show border)

### `filename` 🔍 **TBTC**
- **Value**: `"numbox.js"`
- **Description**: The JavaScript file that defines the object's behavior
- **Usage**: Load different JS files to change functionality
- **Example**: `box.setattr("filename", "custom_control.js");`

### `hidden` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Controls object visibility in the patcher
- **Usage**: Hide objects that shouldn't be visible to users
- **Example**: `box.setattr("hidden", 1);`
- **Range**: 0 (visible), 1 (hidden)

### `hint` 🔍 **TBTC**
- **Value**: `""`
- **Description**: Help text shown in Max's help bar when object is selected
- **Usage**: Provide contextual help information
- **Example**: `box.setattr("hint", "Drag to adjust volume");`

### `ignoreclick` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Controls whether mouse clicks are processed
- **Usage**: Disable interaction for display-only objects
- **Example**: `box.setattr("ignoreclick", 1);`
- **Range**: 0 (responds to clicks), 1 (ignores clicks)

### `jsarguments` ✅
- **Value**: Arguments passed to JSUI object
- **Description**: Arguments passed to the JavaScript file, accessible as array-like object
- **Usage**: Pass initialization parameters to your JavaScript code
- **Example**: `box.getattr("jsarguments")` - used in implementation for text justification ("left", "centre", "right")
- **Note**: Can be string or array-like object, requires type checking in code

### `jspainterfile` 🔍 **TBTC**
- **Value**: `""`
- **Description**: External JavaScript file for custom painting/rendering
- **Usage**: Separate rendering logic from interaction logic using JS Painter API
- **Example**: `box.setattr("jspainterfile", "custom_painter.js");`

### `nofsaa` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Disables full-scene anti-aliasing for the object
- **Usage**: Improve performance by disabling anti-aliasing
- **Example**: `box.setattr("nofsaa", 1);`
- **Range**: 0 (anti-aliasing enabled), 1 (disabled)

### `param_connect` 🔍 **TBTC**
- **Value**: `""`
- **Description**: Automatically connects to a named parameter
- **Usage**: Link JSUI to existing parameters without patching
- **Example**: `box.setattr("param_connect", "device_parameter[1]");`
- **Note**: Parameter connection syntax needs verification

### `parameter_enable` 🔍 **TBTC**
- **Value**: `1`
- **Description**: Enables the object to act as a parameter in Max/Live
- **Usage**: Allow automation and remote control
- **Example**: `box.setattr("parameter_enable", 0);`
- **Range**: 0 (not a parameter), 1 (parameter enabled)

### `parameter_mappable` 🔍 **TBTC**
- **Value**: `1`
- **Description**: Controls visibility to Max's mapping system (separate from Live's parameter system)
- **Usage**: Enable assignment in Max's mapping interface
- **Example**: `box.setattr("parameter_mappable", 0);`
- **Range**: 0 (not mappable in Max), 1 (mappable in Max)

### `patching_position` 🔍 **TBTC**
- **Value**: `634.00 405.00`
- **Description**: X and Y coordinates in the patcher window
- **Usage**: Programmatically position objects in patchers
- **Example**: `box.setattr("patching_position", [100, 200]);`

### `patching_rect` 🔍 **TBTC**
- **Value**: `634.00 405.00 69.00 22.00`
- **Description**: Complete rectangle definition (x, y, width, height)
- **Usage**: Set both position and size simultaneously
- **Example**: `box.setattr("patching_rect", [0, 0, 100, 50]);`
- **Note**: Referenced in code but commented out, not actually used

### `patching_size` 🔍 **TBTC**
- **Value**: `69.00 22.00`
- **Description**: Width and height of the object in patcher view
- **Usage**: Resize objects programmatically
- **Example**: `box.setattr("patching_size", [150, 30]);`

### `presentation` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Controls whether object appears in presentation mode
- **Usage**: Show/hide objects in performance interfaces
- **Example**: `box.setattr("presentation", 1);`
- **Range**: 0 (not in presentation), 1 (visible in presentation)

### `presentation_position` 🔍 **TBTC**
- **Value**: `0.00 0.00`
- **Description**: X and Y coordinates in presentation mode
- **Usage**: Position objects differently in performance view
- **Example**: `box.setattr("presentation_position", [50, 100]);`

### `presentation_rect` 🔍 **TBTC**
- **Value**: `634.00 405.00 69.00 22.00`
- **Description**: Complete rectangle for presentation mode
- **Usage**: Define different size/position for presentation view
- **Example**: `box.setattr("presentation_rect", [10, 10, 80, 25]);`

### `presentation_size` 🔍 **TBTC**
- **Value**: `0.00 0.00`
- **Description**: Width and height in presentation mode
- **Usage**: Different sizing for performance interfaces
- **Example**: `box.setattr("presentation_size", [120, 40]);`

### `valuepopup` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Shows parameter value in a popup when adjusting
- **Usage**: Provide visual feedback during parameter changes
- **Example**: `box.setattr("valuepopup", 1);`
- **Range**: 0 (no popup), 1 (show value popup)

### `valuepopuplabel` 🔍 **TBTC**
- **Value**: `0`
- **Description**: Shows parameter name along with value in popup
- **Usage**: Include parameter identification in value popups
- **Example**: `box.setattr("valuepopuplabel", 1);`
- **Range**: 0 (value only), 1 (name and value)

### `varname` 🔍 **TBTC**
- **Value**: `"jsui"`
- **Description**: Script name for programmatic access to the object
- **Usage**: Reference this object from other scripts or patchers
- **Example**: `box.setattr("varname", "volume_control");`

---

## OTHER PROPERTIES/METHODS

These are methods and properties available for scripting and advanced object manipulation. **Note**: These are messages that can be sent TO the JSUI object, not methods available within JSUI code.

### `reference` ✅
- **Type**: Method/Message
- **Description**: Opens the object's reference documentation
- **Usage**: Send as message to JSUI object
- **Example**: `this.patcher.getnamed("jsui").message("reference");`

### `openquery` ⚠️ **Context-Dependent**
- **Type**: Method/Message
- **Description**: Opens file dialog for selecting JavaScript files
- **Usage**: Send as message to JSUI object
- **Example**: `this.patcher.getnamed("jsui").message("openquery");`

### `wclose` ⚠️ **Context-Dependent**
- **Type**: Method/Message
- **Description**: Closes the object's editor window
- **Usage**: Send as message to JSUI object
- **Example**: `this.patcher.getnamed("jsui").message("wclose");`

### `open` ✅
- **Type**: Method/Message
- **Description**: Opens the JavaScript file in the editor
- **Usage**: Send as message to JSUI object
- **Example**: `this.patcher.getnamed("jsui").message("open");`

### `int` ✅
- **Type**: Method/Message
- **Description**: Sends integer values to the JavaScript code
- **Usage**: Triggers `msg_int()` function if defined in JSUI code
- **Example**: `this.patcher.getnamed("jsui").message("int", 42);`

### `float` ✅
- **Type**: Method/Message
- **Description**: Sends floating-point values to the JavaScript code
- **Usage**: Triggers `msg_float()` function if defined in JSUI code
- **Example**: `this.patcher.getnamed("jsui").message("float", 3.14159);`

### `bang` ✅
- **Type**: Method/Message
- **Description**: Triggers the bang function in the JavaScript code
- **Usage**: Triggers `bang()` function if defined in JSUI code
- **Example**: `this.patcher.getnamed("jsui").message("bang");`

### `list` ✅
- **Type**: Method/Message
- **Description**: Sends list data to the JavaScript code
- **Usage**: Triggers `list()` function if defined in JSUI code
- **Example**: `this.patcher.getnamed("jsui").message("list", [1, 2, 3]);`

### `anything` ✅
- **Type**: Method/Message
- **Description**: Sends arbitrary messages to the JavaScript code
- **Usage**: Triggers `anything()` function if defined in JSUI code
- **Example**: `this.patcher.getnamed("jsui").message("custom_message", arg1, arg2);`

### `compile` ✅
- **Type**: Method/Message
- **Description**: Recompiles the JavaScript code without reopening
- **Usage**: Force recompilation of JSUI script
- **Example**: `this.patcher.getnamed("jsui").message("compile");`

### `setprop` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Sets a property value programmatically
- **Usage**: May be different from setattr - needs verification
- **Example**: `this.patcher.getnamed("jsui").message("setprop", "varname", "new_name");`

### `getprop` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Gets a property value programmatically
- **Usage**: May be different from getattr - needs verification
- **Example**: `this.patcher.getnamed("jsui").message("getprop", "varname");`

### `delprop` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Deletes a dynamic property
- **Usage**: For runtime-created properties
- **Example**: `this.patcher.getnamed("jsui").message("delprop", "custom_prop");`

### `loadbang` ✅
- **Type**: Method/Message
- **Description**: Triggers initialization when patcher loads
- **Usage**: Automatically called - implement `loadbang()` in your JS code

### `autowatch` ✅
- **Type**: Method/Message  
- **Description**: Enables automatic recompilation when JS file changes
- **Usage**: Set autowatch property in JSUI code or send as message
- **Example**: `this.patcher.getnamed("jsui").message("autowatch", 1);`

### `statemessage` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Handles state saving/loading for the object
- **Usage**: Used internally by Max for preset and project management

### `editfontsize` ✅
- **Type**: Method/Message
- **Description**: Sets font size for text display in the object  
- **Usage**: Control text rendering in JSUI
- **Example**: `this.patcher.getnamed("jsui").message("editfontsize", 14);`

### `debug` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Enables debugging output for the JavaScript code
- **Usage**: Enable debug mode for development
- **Example**: `this.patcher.getnamed("jsui").message("debug", 1);`

### `size` ✅
- **Type**: Method/Message
- **Description**: Resizes the object programmatically
- **Usage**: Change object dimensions
- **Example**: `this.patcher.getnamed("jsui").message("size", 100, 50);`

### `jsfile` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Changes the JavaScript file without reopening object inspector
- **Usage**: Runtime script switching
- **Example**: `this.patcher.getnamed("jsui").message("jsfile", "new_script.js");`

### `jsargs` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Sets JavaScript arguments programmatically
- **Usage**: Pass new arguments to script
- **Example**: `this.patcher.getnamed("jsui").message("jsargs", arg1, arg2);`

### `sendbox` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Sends messages to specific boxes in the patcher
- **Usage**: Inter-object messaging
- **Example**: `this.patcher.getnamed("jsui").message("sendbox", "boxname", "message");`

### `mfi` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Max For Live integration method
- **Usage**: Used internally for Live device integration

### `template` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Creates template code for the JavaScript file
- **Usage**: Generate boilerplate JSUI code
- **Example**: `this.patcher.getnamed("jsui").message("template");`

### `annotation_name` 🔍 **TBTC**
- **Type**: Method/Message
- **Description**: Sets annotation text programmatically
- **Usage**: Runtime annotation changes
- **Example**: `this.patcher.getnamed("jsui").message("annotation_name", "tooltip text");`

### `position` ✅
- **Type**: Method/Message
- **Description**: Sets object position programmatically
- **Usage**: Move object in patcher
- **Example**: `this.patcher.getnamed("jsui").message("position", 100, 200);`

---

## SUMMARY

- **Parameter attributes**: 21 properties controlling Live integration, automation, and modulation
- **Regular attributes**: 23 properties controlling appearance, behavior, and basic functionality  
- **Methods/Properties**: 26 methods for programmatic control and advanced functionality
- **Total**: 70 properties and methods available for JSUI objects

**Note**: Original console dump shows 66 total properties, but documentation includes 4 additional verified methods from official sources.

## Key Usage Notes

- **Parameter persistence**: Use `save()` function with `embedmessage()` calls and timed restoration via `Task.schedule()`
- **Reading attributes**: `box.getattr("_parameter_range")` returns arrays, check length before accessing
- **pattr integration**: Implement `getvalueof()`, `setvalueof()`, and call `notifyclients()` on value changes
- **Attribute monitoring**: Use `MaxobjListener` to respond to inspector changes
- **⚠️ M4L Limitation**: Parameter attributes cannot be changed at runtime in Max for Live devices

## References
- [Cycling74 Max JS API Documentation](https://docs.cycling74.com/apiref/js/)
- [JSUI Object Documentation](https://docs.cycling74.com/max8/vignettes/jsuiobject)
- [Maxobj Documentation](https://docs.cycling74.com/apiref/js/maxobj/)
- [JS Painter Guide](https://docs.cycling74.com/max8/vignettes/jspainter)
