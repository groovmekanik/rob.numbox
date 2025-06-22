/*
JSUI Numbox - A live.numbox replica for Max/MSP
===============================================

A JSUI replacement for live.numbox to avoid the 
"overwrite look" of js painter files and enable additional functionality.

Features:
- live.numbox compatibility (mouse interaction, keyboard editing, double-click reset)
- Dynamic Live theme color support, with active/inactive states
- Text justification via jsarguments ("left", "centre"/"center", "right")
- All unit style formatting (int, float, time, hertz, dB, percent, etc.)
- Attribute monitoring for inspector changes

Usage:
- use JSUI object
- Send "active 0/1" messages to control output state and colours
- Add justification arguments: @jsarguments left/centre/right

Author: Robert Koster // Fixation Studios
Date: 22/06/2025
*/

/*
TODO: Unimplemented Features
- _parameter_units: currently uses parameter_unit_styles rather than worrying about _parameter_units
- _parameter_steps: adjustable step size - currently uses 0.002 : 0.5 (see ondrag function)
- _parameter_exponent: Exponential scaling for parameter mapping - currently uses linear scaling
- Unique identifier addressing: No "---" style unique ID system for remote addressing
- Parameter automation: No automation visualisation capabilities or setup
- Accessibility features: No screen reader or keyboard navigation support
- Color themes: currently matches Live's LCD color scheme and look
*/

autowatch = 1;
outlets = 2;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var currentValue = 0;
var minValue = -100;  // Default fallback
var maxValue = 100;   // Default fallback
var initialValue = 0; // Default fallback
var textJustification = "centre"; // Default: "left", "centre", "right"
var activeState = 1; // Default to active (1 = active, 0 = inactive)

// Debug function to list all available attributes
function getAttrs() {
    var getattrList = box.getattrnames();
    var allProperties = Object.getOwnPropertyNames(box);
    
    // Categorize all properties
    var parameterAttrs = [];
    var otherAttrs = [];
    
    for (var i = 0; i < allProperties.length; i++) {
        var prop = allProperties[i];
        if (prop.indexOf('_parameter_') === 0) {
            parameterAttrs.push(prop);
        } else if (getattrList.indexOf(prop) === -1) {
            // Not in regular attributes list, so it's "other"
            otherAttrs.push(prop);
        }
    }
    
    post("=== PARAMETER ATTRIBUTES ===\n");
    for (var i = 0; i < parameterAttrs.length; i++) {
        try {
            var value = box.getattr(parameterAttrs[i]);
            post("  ", parameterAttrs[i], ":", value, "\n");
        } catch(e) {
            post("  ", parameterAttrs[i], ": [cannot read]\n");
        }
    }
    
    post("\n=== REGULAR ATTRIBUTES ===\n");
    for (var i = 0; i < getattrList.length; i++) {
        post("  ", getattrList[i], ":", box.getattr(getattrList[i]), "\n");
    }
    
    post("\n=== OTHER PROPERTIES/METHODS ===\n");
    for (var i = 0; i < otherAttrs.length; i++) {
        try {
            // Try to determine if it's a method or property
            var value = box[otherAttrs[i]];
            if (typeof value === 'function') {
                post("  ", otherAttrs[i], ": [method]\n");
            } else {
                post("  ", otherAttrs[i], ": [property]", value, "\n");
            }
        } catch(e) {
            post("  ", otherAttrs[i], ": [unknown]\n");
        }
    }
    
    post("\n=== SUMMARY ===\n");
    post("Parameter attributes found:", parameterAttrs.length, "\n");
    post("Regular attributes found:", getattrList.length, "\n");
    post("Other properties/methods found:", otherAttrs.length, "\n");
    post("Total properties:", allProperties.length, "\n");
}

// Update min/max values from inspector range attribute
function updateRange() {
    var rangeAttr = box.getattr("_parameter_range");
    
    // Range should be an array [min, max]
    if (rangeAttr && rangeAttr.length >= 2) {
        minValue = rangeAttr[0];
        maxValue = rangeAttr[1];
        
        // Clamp current value to new range
        var newValue = Math.max(minValue, Math.min(maxValue, currentValue));
        if (newValue !== currentValue) {
            currentValue = newValue;
            updateDisplay();
            
            // Only output if active
            if (activeState) {
                outlet(0, outputValue);
            }
        }
    }
}

// Update initial value from inspector
function updateInitialValue() {
    var initialEnabled = box.getattr("_parameter_initial_enable");
    
    if (initialEnabled) {
        var initialAttr = box.getattr("_parameter_initial");
        if (initialAttr !== null && initialAttr !== undefined) {
            initialValue = initialAttr;
        }
    } else {
        // Fall back to 0 if initial is not enabled
        initialValue = 0;
    }
}

// Get current unit style from inspector
function getUnitStyle() {
    return box.getattr("_parameter_unitstyle") || 0;
}

var displayText = currentValue.toFixed(1);
var outputValue = currentValue;

// Get all jsarguments as an array for future extensibility
function getJSArguments() {
    var jsArgs = box.getattr("jsarguments");
    var argsArray = [];
    
    if (jsArgs) {
        if (typeof jsArgs === 'string') {
            // Single string argument
            argsArray = [jsArgs];
        } else if (typeof jsArgs === 'object' && jsArgs.length !== undefined) {
            // Array-like object
            for (var i = 0; i < jsArgs.length; i++) {
                argsArray.push(jsArgs[i].toString());
            }
        }
    }
    
    return argsArray;
}

// Parse jsarguments for text justification
function parseJustificationArgs() {
    var jsArgs = box.getattr("jsarguments");
    var foundJustifications = [];
    
    // Convert jsarguments to array - handle both strings and arrays
    var argsArray = [];
    if (jsArgs) {
        if (typeof jsArgs === 'string') {
            // Single string argument
            argsArray = [jsArgs];
        } else if (typeof jsArgs === 'object' && jsArgs.length !== undefined) {
            // Array-like object
            for (var i = 0; i < jsArgs.length; i++) {
                argsArray.push(jsArgs[i].toString());
            }
        }
    }
    
    // Process the arguments array
    for (var i = 0; i < argsArray.length; i++) {
        var arg = argsArray[i].toLowerCase();
        if (arg === "left" || arg === "centre" || arg === "center" || arg === "right") {
            // Handle both "centre" and "center" spellings
            if (arg === "center") arg = "centre";
            foundJustifications.push(arg);
        }
    }
    
    // Handle conflicts and set justification
    if (foundJustifications.length > 1) {
        post("conflict found: justifications conflict, defaulted to \"centre\"\n");
        textJustification = "centre"; // Default on conflict
    } else if (foundJustifications.length === 1) {
        textJustification = foundJustifications[0];
    } else {
        textJustification = "centre"; // Default when no args found
    }
}

// Test function to manually set justification
function testJustification(just) {
    textJustification = just;
    post("TEST: Set justification to", just, "\n");
    mgraphics.redraw();
}

// Initialize justification from jsarguments
parseJustificationArgs();

// === COLOR AND THEME MANAGEMENT ===

// Get dynamic colors from Max's color system using live_ prefix names
function getColor(colorName) {
    try {
        // Convert display names to Max theme color names with live_ prefix
        var maxColorName;
        switch(colorName) {
            case "LCD Icon / Text":
                maxColorName = "live_lcd_control_fg";  // Correct: LCD Icon/Text
                break;
            case "LCD Icon / Text (Inactive)":
                maxColorName = "live_lcd_control_fg_zombie";  // Correct: LCD Icon/Text (Inactive)
                break;
            case "LCD Background":
                maxColorName = "live_lcd_bg";
                break;
            default:
                maxColorName = "live_lcd_control_fg";
                break;
        }
        
        // Use Max's dynamic color system
        var color = max.getcolor(maxColorName);
        
        // Check if we got valid color values (not NaN)
        if (isNaN(color[0]) || isNaN(color[1]) || isNaN(color[2])) {
            throw new Error("Invalid color values");
        }
        
        return color;
    } catch(e) {
        // Fallback colors if dynamic colors fail
        switch(colorName) {
            case "LCD Icon / Text":
                return [1.0, 1.0, 1.0, 1.0]; // White
            case "LCD Icon / Text (Inactive)": 
                return [0.5, 0.5, 0.5, 1.0]; // Gray
            case "LCD Background":
                return [0.2, 0.2, 0.2, 1.0]; // Dark gray
            default:
                return [1.0, 1.0, 1.0, 1.0]; // White fallback
        }
    }
}

// Handle active state messages
function active(state) {
    var newState = state ? 1 : 0; // Ensure it's 0 or 1
    var wasInactive = (activeState === 0);
    activeState = newState;
    
    // If transitioning from inactive to active, output current value
    if (wasInactive && activeState === 1) {
        outlet(0, outputValue);
    }
    
    mgraphics.redraw(); // Redraw with new colors
}

// === DISPLAY AND UNIT FORMATTING ===

function updateDisplay() {
    if (isEditing) {
        displayText = editText;
        outputValue = currentValue;
    } else {
        var unitStyle = getUnitStyle();
        
        switch (unitStyle) {
            case 0: // int - show integers
                displayText = Math.round(currentValue).toString();
                outputValue = currentValue;
                break;
            case 1: // float - show 2 decimal places
                displayText = currentValue.toFixed(2);
                outputValue = currentValue;
                break;
            case 2: // time - show 2 decimal places
                displayText = currentValue.toFixed(1) + " ms";
                outputValue = currentValue;
                break;
            case 3: // hertz - show 1 decimal place with "Hz" suffix
                displayText = Math.round(currentValue).toString() + " Hz";
                outputValue = currentValue;
                break;
            case 4: // dB - show "-inf" when <= -80.0, otherwise 1 decimal place with "dB" suffix
                if (currentValue <= -80.0) {
                    displayText = "-inf";
                    outputValue = 0.0;
                } else {
                    displayText = currentValue.toFixed(1) + " dB";
                    outputValue = currentValue;
                }
                break;
            case 5: // % - show integers with "%" suffix
                displayText = Math.round(currentValue).toString() + " %";
                outputValue = currentValue;
                break;
            case 6: // Pan - placeholder
                displayText = currentValue.toFixed(2);
                outputValue = currentValue;
                break;
            case 7: // Semitone - placeholder
                displayText = currentValue.toFixed(1) + " st";
                outputValue = currentValue;
                break;
            case 8: // MIDI Note - placeholder
                displayText = Math.round(currentValue).toString();
                outputValue = currentValue;
                break;
            case 9: // Custom - placeholder
                displayText = currentValue.toFixed(2);
                outputValue = currentValue;
                break;
            case 10: // Native (Type) - placeholder
                displayText = currentValue.toFixed(2);
                outputValue = currentValue;
                break;
            default: // Default formatting - 1 decimal place, no suffix
                displayText = currentValue.toFixed(1);
                outputValue = currentValue;
                break;
        }
    }
}

// Initialize range and initial value from inspector
updateRange();
updateInitialValue();

// Single handler for all attribute changes
function handleAttributeChange(data) {
    switch(data.attrname) {
        case "_parameter_unitstyle":
            updateDisplay();
            break;
        case "_parameter_range":
            updateRange();
            break;
        case "_parameter_initial_enable":
        case "_parameter_initial":
            updateInitialValue();
            break;
        case "jsarguments":
            parseJustificationArgs();
            break;
    }
    mgraphics.redraw();
}

// Set up attribute listeners for inspector changes
var unitStyleListener = new MaxobjListener(box, "_parameter_unitstyle", handleAttributeChange);
var rangeListener = new MaxobjListener(box, "_parameter_range", handleAttributeChange);
var initialEnableListener = new MaxobjListener(box, "_parameter_initial_enable", handleAttributeChange);
var initialValueListener = new MaxobjListener(box, "_parameter_initial", handleAttributeChange);
var jsArgumentsListener = new MaxobjListener(box, "jsarguments", handleAttributeChange);

// Drag state
var isDragging = false;
var dragStartY = 0;
var dragStartValue = 0;
var lastDragY = 0;
var cursorOrigin = [0, 0];

// Edit state
var isEditing = false;
var editText = "";
var hasFocus = false;
var showCursor = true;
var cursorTimer = new Task(toggleCursor, this);

var clickedInside = false;

function msg_float(x) {
    updateRange(); // Ensure we have latest range values
    updateInitialValue(); // Ensure we have latest initial value
    currentValue = Math.max(minValue, Math.min(maxValue, x));
    updateDisplay();
    mgraphics.redraw();
    
    // Only output if active
    if (activeState) {
        outlet(0, outputValue);
    }
}

// Called when object is being deleted - cleanup only
function notifydeleted() {
    // Cleanup code would go here if needed
    // Currently no cleanup required
}

function onclick(x, y, button, cmd, shift, capslock, option, ctrl) {
    // Set flag that we were clicked
    clickedInside = true;
    
    // Give this object focus
    hasFocus = true;
    mgraphics.redraw(); // Redraw to show focus box
    
    // Start dragging
    isDragging = true;
    dragStartY = y;
    lastDragY = y;
    dragStartValue = currentValue;
    
    // Update range and initial values for dragging
    updateRange();
    updateInitialValue();
    
    // Output bang on second outlet to poll mousestate for global cursor position
    outlet(1, "bang");
}

function ondblclick(x, y, button, cmd, shift, capslock, option, ctrl) {
    // Update initial value in case inspector changed
    updateInitialValue();
    
    // Reset to initial value
    currentValue = initialValue;
    
    // Update display and redraw
    updateDisplay();
    mgraphics.redraw();
    
    // Only output if active
    if (activeState) {
        outlet(0, outputValue);
    }
}

function ondrag(x, y, button, cmd, shift, capslock, option, ctrl) {
    if (isDragging) {
        // Hide cursor during drag
        max.hidecursor();
        
        // Calculate incremental delta from last position
        var deltaY = lastDragY - y;
        //post("deltaY:", deltaY);
        
        // Fine adjustment with shift (0.02 step), normal is 0.5 step
        var stepSize = shift ? 0.02 : 0.5;
        var newValue = currentValue + (deltaY * stepSize);
        
        // Clamp to min/max
        newValue = Math.max(minValue, Math.min(maxValue, newValue));
        
        if (newValue !== currentValue) {
            currentValue = newValue;
            updateDisplay();
            mgraphics.redraw();
            
            // Only output if active
            if (activeState) {
                outlet(0, outputValue);
            }
        }
        
        // Always update lastDragY to prevent deltaY accumulation
        lastDragY = y;
        
        // Keep cursor locked (mousestate provides global coords)
        if (!button) {
            // Mouse button released - restore cursor at onclick position
            max.pupdate(cursorOrigin[0], cursorOrigin[1]);
            max.showcursor();
            isDragging = false;
        }
        //post("ondrag - isDragging:", isDragging);
        //there is potential for issues when the user drags way off screen and deltaY not being updated but we can deal with that later
    }
}

// Combined function to handle global mouse events
function globalMouse(leftClick, globalX, globalY) {
    
    // Store cursor origin for dragging
    cursorOrigin[0] = globalX;
    cursorOrigin[1] = globalY;
    
    // Simple focus logic: if there's a left click and we have focus,
    // but our onclick wasn't called, then click was outside
    if (leftClick && hasFocus) {
        // This will be called for ALL left clicks
        // If our onclick was also called, it will set a flag
        // If not, we lose focus after a brief delay
        var task = new Task(function() {
            if (!clickedInside) {
                hasFocus = false;
                mgraphics.redraw(); // Redraw to hide focus box
                if (isEditing) {
                    commitEdit();
                }
            }
            clickedInside = false; // Reset flag
        }, this);
        task.schedule(1); // Check after 1ms
    }
}

function onidleout(x, y) {
    // Stop dragging when mouse leaves and restore cursor
    if (isDragging) {
        isDragging = false;
        max.showcursor();
    }
    // DON'T lose focus when mouse leaves - maintain focus like live.objects
    // Focus will only be lost when a click occurs outside this object
}

// Handle external key input via message
function keyInput(c) {
    // Only handle keys if we have focus
    if (!hasFocus) {
        return;
    }
    
    var charCode = c;
    
    // Filter: only accept number keys (0-9), decimal point, minus sign, backspace, enter, escape
    var isValidChar = (charCode >= 48 && charCode <= 57) || // 0-9
                      charCode === 46 ||  // decimal point
                      charCode === 45 ||  // minus sign
                      charCode === 127 || // backspace
                      charCode === 13 ||  // enter
                      charCode === 3 ||   // numpad enter
                      charCode === 27;    // escape
    
    if (!isValidChar) {
        return; // Ignore invalid keys
    }
    
    // Handle number keys, decimal point, and minus sign
    if ((charCode >= 48 && charCode <= 57) || charCode === 46 || charCode === 45) {
        if (!isEditing) {
            // Enter edit mode and start with the typed character
            isEditing = true;
            editText = String.fromCharCode(charCode);
            showCursor = true;
            cursorTimer.schedule(500); // Start cursor blinking
            updateDisplay();
            mgraphics.redraw();
        } else {
            // Add character to edit text
            editText += String.fromCharCode(charCode);
            updateDisplay();
            mgraphics.redraw();
        }
    }
    
    // Handle special keys when in edit mode
    if (isEditing) {
        if (charCode === 127) { // Backspace
            if (editText.length > 0) {
                editText = editText.slice(0, -1);
                updateDisplay();
                mgraphics.redraw();
            }
        } else if (charCode === 13 || charCode === 3) { // Enter or numpad enter
            commitEdit();
        } else if (charCode === 27) { // Escape
            cancelEdit();
        }
    }
}

// Commit the edited value
function commitEdit() {
    if (isEditing) {
        cursorTimer.cancel(); // Stop cursor blinking
        var newValue = parseFloat(editText);
        if (!isNaN(newValue)) {
            newValue = Math.max(minValue, Math.min(maxValue, newValue));
            currentValue = newValue;
            updateDisplay();
            
            // Only output if active
            if (activeState) {
                outlet(0, outputValue);
            }
        }
        isEditing = false;
        updateDisplay();
        mgraphics.redraw();
    }
}

// Cancel editing and revert
function cancelEdit() {
    if (isEditing) {
        cursorTimer.cancel(); // Stop cursor blinking
        isEditing = false;
        editText = "";
        updateDisplay();
        mgraphics.redraw();
    }
}

function toggleCursor() {
    if (isEditing) {
        showCursor = !showCursor;
        mgraphics.redraw();
        cursorTimer.schedule(500); // Blink every 500ms
    }
}

// Enforce minimum dimensions like live.numbox
function onresize(width, height) {
    var fixedHeight = 15; // Fixed height like live.numbox
    var minWidth = 25; // Minimum width to ensure readability
    var needsResize = false;
    
    // Lock height to exactly 15 pixels
    if (height !== fixedHeight) {
        height = fixedHeight;
        needsResize = true;
    }
    
    if (width < minWidth) {
        width = minWidth;
        needsResize = true;
    }
    
    if (needsResize) {
        // Update the object's size to enforce constraints
        box.setattr("patching_rect", [box.rect[0], box.rect[1], width, height]);
    }
    
    // Redraw with new dimensions
    mgraphics.redraw();
}

function paint() {
    with (mgraphics) {
        var width = this.box.rect[2] - this.box.rect[0];
        var height = this.box.rect[3] - this.box.rect[1];
        
        // Clear background with LCD style
        var bgColor = getColor("LCD Background");
        set_source_rgba(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
        rectangle(0, 0, width, height);
        fill();
        
        // Draw border with LCD style
        set_source_rgba(0.5, 0.5, 0.5, 1.0);
        set_line_width(1);
        rectangle(0.5, 0.5, width - 1, height - 1);
        stroke();
        
        // Draw text (to match live.numbox)
        select_font_face("Ableton Sans Medium");
        var fontSize = 10;
        set_font_size(fontSize);
        
        // Set text color based on active state
        var colorName = activeState ? "LCD Icon / Text" : "LCD Icon / Text (Inactive)";
        var textColor = getColor(colorName);
        set_source_rgba(textColor[0], textColor[1], textColor[2], textColor[3]);
        
        // Position text based on justification
        var textExtents = text_measure(displayText);
        var textX, textY;
        
        // Horizontal positioning based on justification
        switch(textJustification) {
            case "left":
                textX = 2; // Small left padding
                break;
            case "right":
                textX = width - textExtents[0] - 2; // Small right padding
                break;
            case "centre":
            default:
                textX = (width - textExtents[0]) / 2; // Centered
                break;
        }
        
        // Vertical centering remains the same
        textY = height / 2 + 4; //it sits better with 3.5 but I'm worried about half pixels
        
        move_to(textX, textY);
        show_text(displayText);
        
        // Draw flashing cursor when in edit mode
        if (isEditing && showCursor) {
            set_source_rgba(1.0, 0.2, 0.2, 1.0); // Red cursor
            set_line_width(1);
            var cursorX = textX + textExtents[0] + 2; // Position after text
            // Cursor height matches font size: baseline is ~90% down from top when limiting object size to 15 like live.numbox
            var cursorTop = textY - (fontSize * 0.90);
            var cursorBottom = textY + (fontSize * 0.10);
            move_to(cursorX, cursorTop);
            line_to(cursorX, cursorBottom);
            stroke();
        }
        
        // Draw focus crosshair lines when object has focus
        if (hasFocus) {
            // Use same color as text for focus lines
            set_source_rgba(textColor[0], textColor[1], textColor[2], textColor[3]);
            set_line_width(1);
            var cornerSize = 3; // Length of corner lines
            var inset = 1; // Inset from edges to ensure visibility
            
            // Top-left corner
            move_to(inset, cornerSize + inset);
            line_to(inset, inset);
            line_to(cornerSize + inset, inset);
            
            // Top-right corner
            move_to(width - cornerSize - inset, inset);
            line_to(width - inset, inset);
            line_to(width - inset, cornerSize + inset);
            
            // Bottom-right corner
            move_to(width - inset, height - cornerSize - inset);
            line_to(width - inset, height - inset);
            line_to(width - cornerSize - inset, height - inset);
            
            // Bottom-left corner
            move_to(cornerSize + inset, height - inset);
            line_to(inset, height - inset);
            line_to(inset, height - cornerSize - inset);
            
            stroke();
        }
    }
}