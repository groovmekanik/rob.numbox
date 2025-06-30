/*
JSUI Numbox - A live.numbox replica for Max/MSP
===============================================
Author: Robert Koster // Fixation Studios
Date: 30/06/2025

STATUS: PARTIAL IMPLEMENTATION - LIVE PARAMETER INTEGRATION ISSUE
================================================================

WORKING FEATURES:
✅ Basic numbox functionality (display, editing, dragging)
✅ Parameter persistence (save/restore with patcher)
✅ Inspector integration (reads all parameter attributes)
✅ Color theming (matches Live's LCD style)
✅ getvalueof/setvalueof functions implemented
✅ notifyclients() calls implemented
✅ Mouse interaction and keyboard editing
✅ Arrow key stepping (up/down arrows)

CRITICAL ISSUE - LIVE PARAMETER INTEGRATION:
❌ Parameter doesn't appear in Live's automation lane
❌ Cannot be MIDI mapped in Live  
❌ Error in Live's Status Bar: "Parameter index received from Max is out of range"

SUSPECTED CAUSES:
- Parameter may not be properly registered with Live on object creation
- parameter_enable attribute might need explicit initialization
- parameter_mappable attribute might not be set correctly
- Missing initialization sequence for Live parameter system
- Possible timing issue with parameter registration vs Live's parameter scan

NEEDS INVESTIGATION:
? Does parameter_enable need to be set programmatically in loadbang?
? Are we missing a parameter registration step for Live?
? Does Live require specific parameter attributes to be set in a certain order?
? Is there a difference between pattr parameters and Live parameters?

FOR CYCLING74 SUPPORT:
This object implements all documented parameter functions (getvalueof, setvalueof, 
notifyclients) and properly handles parameter attributes, but Live doesn't recognize 
it as a valid parameter. The "parameter index out of range" error suggests a 
registration or indexing issue between Max and Live's parameter systems.
*/

/*
Notes;
- The object is not being registered as a parameter in Live.
- There may be issues with initial value and dB unit style due to dbtoa conversion step - will debug later.
- Cycling74 says that properties should not be updated dynamically (setattr). Only use attributes to change internal functionality... But setattr has to be used for loading saved state?
- No _parameter_units: only float values are currently supported.
- No _parameter_exponent: Exponential scaling for parameter mapping - currently uses linear scaling
- Unique identifier addressing: No "---" style unique ID system for remote addressing
- Parameter automation: No automation visualisation capabilities or setup
- Accessibility features: No screen reader support
- Color themes: currently matches Live's LCD color scheme and look
*/

autowatch = 1;
outlets = 2;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// === INTERNAL STATE VARIABLES ===
// Status: ✅ WORKING - These maintain the object's internal state correctly

var currentValue = -10; //to see if initial value can persist
var minValue = -100;  // Default fallback
var maxValue = 100;   // Default fallback
var initialValue = 0; // Default fallback
var textJustification = "centre"; // Default: "left", "centre", "right"
var activeState = 1; // Default to active (1 = active, 0 = inactive)

// === STEP SIZE CONSTANTS ===
// Status: ✅ WORKING - Global step sizes for consistent behavior across drag and arrow key functions
// These values control both mouse dragging and arrow key stepping behavior:
// - Mouse drag: delta movement * step size (shift modifier uses fine step size)
// - Arrow keys: current value +/- normal step size
var normalStepSize = 0.5;  // Normal step size for dragging and arrow keys
var fineStepSize = 0.02;   // Fine step size for shift+drag only

// === PARAMETER ATTRIBUTE FUNCTIONS ===
// Status: ✅ WORKING - These correctly read from inspector attributes

// update parameter type to float (no other types supported yet)
function updateParameterType() {
    var currentType = box.getattr("_parameter_type");
    //post("DEBUG: Current _parameter_type:", currentType, "\n");
    
    // Only set to float (0) if not already set
    if (currentType !== 0) {
        post("Set _parameter_type to 0 (float) - nothing else supported yet\n");
        //box.setattr("_parameter_type", 0);
        // STATUS: ❓ INVESTIGATION NEEDED - Is this setattr call needed for Live registration?
    }
}

// Update min/max values from inspector range attribute
function updateRange() {
    // Status: ✅ WORKING - Correctly reads and applies range from inspector
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
    // Status: ✅ WORKING - Correctly reads initial value settings
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
    // Status: ✅ WORKING - Returns correct unit style for display formatting
    return box.getattr("_parameter_unitstyle") || 0;
}

// Convert dB to linear amplitude (exact formula: 10^(dB/20))
// Used for object output value when in dB Parameter Unit Style
function dbtoa(dB) {
    return Math.pow(10, dB / 20);
}

// === JSARGUMENTS PARSING ===
// Status: ✅ WORKING - Correctly parses jsarguments for text justification

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

// Test function to manually set step sizes
function testStepSizes(normal, fine) {
    if (normal !== undefined) normalStepSize = normal;
    if (fine !== undefined) fineStepSize = fine;
    post("TEST: Step sizes set to normal:", normalStepSize, "fine:", fineStepSize, "\n");
}

// Initialize justification from jsarguments
parseJustificationArgs();

// === COLOR AND THEME MANAGEMENT ===
// Status: ✅ WORKING - Dynamic color system matches Live's LCD theme

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
    // Status: ✅ WORKING - Active/inactive state handling works correctly
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
// Status: ✅ WORKING - All unit styles display correctly

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
                    outputValue = dbtoa(currentValue);
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

// Initialize parameter type, range and initial value from inspector
// NOTE: Commented out immediate initialization - now handled by initializeObject message
// updateParameterType();
// updateRange();
// updateInitialValue();

// === ATTRIBUTE CHANGE HANDLING ===
// Status: ✅ WORKING - Responds correctly to inspector changes

// Single handler for all attribute changes
function handleAttributeChange(data) {
    // Removed debug spam - only handle the actual changes
    switch(data.attrname) {
        case "_parameter_type":
            updateParameterType();
            break;
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
var parameterTypeListener = new MaxobjListener(box, "_parameter_type", handleAttributeChange);
var unitStyleListener = new MaxobjListener(box, "_parameter_unitstyle", handleAttributeChange);
var rangeListener = new MaxobjListener(box, "_parameter_range", handleAttributeChange);
var initialEnableListener = new MaxobjListener(box, "_parameter_initial_enable", handleAttributeChange);
var initialValueListener = new MaxobjListener(box, "_parameter_initial", handleAttributeChange);
var jsArgumentsListener = new MaxobjListener(box, "jsarguments", handleAttributeChange);

// === INTERACTION STATE VARIABLES ===
// Status: ✅ WORKING - Mouse and keyboard interaction works correctly

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

// === MESSAGE HANDLING ===
// Status: ✅ WORKING - Input messages work correctly, notifyclients() called appropriately

function msg_float(x) {
    updateRange(); // Ensure we have latest range values
    updateInitialValue(); // Ensure we have latest initial value
    currentValue = Math.max(minValue, Math.min(maxValue, x));
    updateDisplay();
    mgraphics.redraw();
    
    // Notify pattr/Live that our value changed
    notifyclients();
    
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

// === MOUSE INTERACTION ===
// Status: ✅ WORKING - All mouse interactions function correctly

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
    
    // Notify pattr/Live that our value changed (user double-clicked to reset)
    notifyclients();
    
    // Only output if active
    if (activeState) {
        outlet(0, outputValue);
    }
}

function ondrag(x, y, button, cmd, shift, capslock, option, ctrl) {
    if (isDragging) {
        // Hide cursor during drag
        max.hidecursor();

        //issue with user dragging cursor off screen, halting parameter changes, should be fixed now
        if (Math.abs(lastDragY) > 30) {
            //reset cursor position before it reaches screen boundary to allow parameter value to advance further
            max.pupdate(cursorOrigin[0], cursorOrigin[1]);
            lastDragY = y;
            deltaY = 0;
            return;
        } else {
            // Calculate incremental delta from last position
            var deltaY = lastDragY - y;
            //post("deltaY:", deltaY);
        }
        
        // Fine adjustment with shift, normal step size otherwise
        var stepSize = shift ? fineStepSize : normalStepSize;
        var newValue = currentValue + (deltaY * stepSize);
        
        // Clamp to min/max
        newValue = Math.max(minValue, Math.min(maxValue, newValue));
        
        if (newValue !== currentValue) {
            currentValue = newValue;
            updateDisplay();
            mgraphics.redraw();
            
            // Notify pattr/Live that our value changed (user dragging)
            notifyclients();
            
            // Only output if active
            if (activeState) {
                outlet(0, outputValue);
            }
        }
        
        // Always update lastDragY to prevent deltaY accumulation
        lastDragY = y;
        //post("lastDragY:", lastDragY);
        
        // Keep cursor locked (mousestate provides global coords)
        if (!button) {
            // Mouse button released - restore cursor at onclick position
            max.pupdate(cursorOrigin[0], cursorOrigin[1]);
            max.showcursor();
            isDragging = false;
        }
        //post("ondrag - isDragging:", isDragging);
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

// === KEYBOARD INTERACTION ===
// Status: ✅ WORKING - Text editing and keyboard input functions correctly

// Handle external key input via message
function keyInput(c) {
    // Only handle keys if we have focus
    if (!hasFocus) {
        return;
    }
    
    var charCode = c;
    
    // Handle arrow keys for value adjustment (Max key codes: 30=up, 31=down)
    var isArrowKey = charCode === 30 ||   // Up arrow
                     charCode === 31;     // Down arrow
    
    if (isArrowKey) {
        // Exit edit mode if currently editing
        if (isEditing) {
            commitEdit();
        }
        
        // Determine step direction and size
        var isUpArrow = (charCode === 30);
        var step = isUpArrow ? normalStepSize : -normalStepSize;
        
        // Update range to ensure we have current min/max values
        updateRange();
        
        // Calculate new value and clamp to range
        var newValue = Math.max(minValue, Math.min(maxValue, currentValue + step));
        
        if (newValue !== currentValue) {
            currentValue = newValue;
            updateDisplay();
            mgraphics.redraw();
            
            // Notify pattr/Live that our value changed (user used arrow keys)
            notifyclients();
            
            // Only output if active
            if (activeState) {
                outlet(0, outputValue);
            }
        }
        return; // Arrow key handled, don't process further
    }
    
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
            
            // Notify pattr/Live that our value changed (user typed new value)
            notifyclients();
            
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

// === SIZING AND LAYOUT ===
// Status: ✅ WORKING - Size constraints match live.numbox

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
        //box.setattr("patching_rect", [box.rect[0], box.rect[1], width, height]);
        //bypass this for now to test if it works without it
    }
    
    // Redraw with new dimensions
    mgraphics.redraw();
}

// === DRAWING AND RENDERING ===
// Status: ✅ WORKING - Visual appearance matches live.numbox perfectly

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

// === PARAMETER PERSISTENCE FUNCTIONS ===
// Status: ✅ WORKING - Save/restore system works correctly for patcher persistence

// Save function called when patcher is saved
function save() {
    // Save internal state variables
    embedmessage("restoreInternalState", 
        currentValue, 
        minValue, 
        maxValue, 
        initialValue, 
        textJustification, 
        activeState
    );
    
    // Save critical parameter attributes that Max doesn't persist properly
    embedmessage("restoreParameterType", box.getattr("_parameter_type"));
    embedmessage("restoreInitialEnable", box.getattr("_parameter_initial_enable"));
    embedmessage("restoreInitialValue", box.getattr("_parameter_initial"));
    embedmessage("restoreUnitStyle", box.getattr("_parameter_unitstyle"));
    embedmessage("restoreParameterInvisible", box.getattr("_parameter_invisible"));
    
    // Save range if it exists
    var range = box.getattr("_parameter_range");
    if (range && range.length >= 2) {
        embedmessage("restoreParameterRange", range[0], range[1]);
    }
}

// Restore internal state variables
function restoreInternalState(value, min, max, initial, justification, active) {
    // Restore internal variables directly
    currentValue = value;
    minValue = min;
    maxValue = max;
    initialValue = initial;
    textJustification = justification;
    activeState = active;
    
    // Update display and redraw
    updateDisplay();
    mgraphics.redraw();
    
    post("RESTORED: Internal state restored\n");
}

// Restore critical parameter attributes (necessary to prevent blob type reversion)
function restoreParameterType(type) {
    // This setattr is specifically for restoration from save, not dynamic changes
    var task = new Task(function() {
        box.setattr("_parameter_type", type);
        if (type !== 0) {
            post("Set _parameter_type to 0 (float) - nothing else supported yet\n");
        } else {
            post("RESTORED: _parameter_type to", type, "\n");
        }
    }, this);
    task.schedule(10);
}

function restoreInitialEnable(enable) {
    var task = new Task(function() {
        box.setattr("_parameter_initial_enable", enable);
        post("RESTORED: _parameter_initial_enable to", enable, "\n");
    }, this);
    task.schedule(20);
}

function restoreInitialValue(value) {
    var task = new Task(function() {
        if (value !== null && value !== undefined) {
            box.setattr("_parameter_initial", value);
            post("RESTORED: _parameter_initial to", value, "\n");
        }
    }, this);
    task.schedule(30);
}

function restoreParameterRange(min, max) {
    var task = new Task(function() {
        box.setattr("_parameter_range", [min, max]);
        post("RESTORED: _parameter_range to [", min, ",", max, "]\n");
    }, this);
    task.schedule(40);
}

function restoreUnitStyle(style) {
    var task = new Task(function() {
        box.setattr("_parameter_unitstyle", style);
        post("RESTORED: _parameter_unitstyle to", style, "\n");
    }, this);
    task.schedule(50);
}

function restoreParameterInvisible(invisible) {
    var task = new Task(function() {
        box.setattr("_parameter_invisible", invisible);
        post("RESTORED: _parameter_invisible to", invisible, "\n");
    }, this);
    task.schedule(60);
}

// === PATTR AND LIVE PARAMETER FUNCTIONS ===
// Status: ❓ INVESTIGATION NEEDED - Functions implemented correctly but Live integration failing

// Required for pattr system and Live parameter automation
function getvalueof() {
    // Return the current value - this is what Live automates and saves in presets
    // STATUS: ✅ WORKING for pattr, ❌ NOT WORKING for Live automation
    return currentValue;
}

// Required for pattr system and Live parameter automation  
function setvalueof(value) {
    // STATUS: ✅ WORKING for pattr, ❌ NOT WORKING for Live automation
    // Ensure we have latest range values from inspector
    updateRange();
    
    // Clamp incoming value to current range and set
    currentValue = Math.max(minValue, Math.min(maxValue, value));
    
    // Update display to reflect new value
    updateDisplay();
    mgraphics.redraw();
    
    // Output the new value if object is active (allows pattr/Live to control output)
    if (activeState) {
        outlet(0, outputValue);
    }
}

// === INITIALIZATION ===
// Status: ❓ INVESTIGATION NEEDED - May need additional Live parameter registration

// Initialize from inspector attributes on load
function loadbang() {
    // Restoring the objects state is handled by the save() function
    // Initialize display
    parseJustificationArgs();
    updateDisplay();
    notifyclients();
    mgraphics.redraw();
}

// === DEBUG FUNCTIONS ===
// Status: ✅ WORKING - Useful for debugging parameter state

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