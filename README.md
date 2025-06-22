# rob.numbox
A JSUI replacement for live.numbox to avoid the "overwrite look" of js painter files and enable additional functionality.
This is currrently a work in progress.

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

TODO: Unimplemented Features
- _parameter_units: currently uses parameter_unit_styles rather than worrying about _parameter_units
- _parameter_steps: adjustable step size - currently uses 0.002 : 0.5 (see ondrag function)
- _parameter_exponent: Exponential scaling for parameter mapping - currently uses linear scaling
- Unique identifier addressing: No "---" style unique ID system for remote addressing
- Parameter automation: No automation visualisation capabilities or setup
- Accessibility features: No screen reader or keyboard navigation support
- Color themes: currently matches Live's LCD color scheme and look
