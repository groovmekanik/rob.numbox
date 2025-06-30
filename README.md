# 🎛️ rob.numbox

**A JSUI-based `live.numbox` replacement for Max/MSP**

## 🎯 Project Status: Functional*

**rob.numbox** implements `live.numbox` functionality using JSUI, with patcher persistence and pattr integration working correctly.

**\*One remaining issue:** Live parameter registration (see [Known Issues](#-known-issues))

---

## ✅ Working Features

### Mouse Interaction
- Mouse dragging for value adjustment with cursor locking
- Shift+drag for fine adjustment (0.02 step vs 0.5 normal)
- Cursor resets when reaching screen boundaries
- Double-click reset to initial value
- Focus management with visual indicators

### Keyboard Support
- Arrow keys for value stepping (up/down, 0.5 step size)
- Text editing mode with number entry
- Input validation for numeric characters only
- Enter to commit, Escape to cancel edits

### Visual Design
- Dynamic color adaptation using Live's LCD color scheme
- Active/inactive state visual feedback
- Text justification (left, center, right) via jsarguments
- Fixed 15px height matching live.numbox

### Unit Support
- **int** - Integer display
- **float** - 2 decimal places
- **time** - Milliseconds with "ms" suffix
- **hertz** - Hz with "Hz" suffix  
- **dB** - Amplitude conversion with "-inf" handling
- **percent** - Percentage with "%" suffix
- **semitone** - Semitones with "st" suffix
- **MIDI note** - Note numbers
- **Custom/Native** - Additional formatting options

### Parameter System
- Complete save/restore with patcher persistence
- Parameter attribute restoration on load
- Inspector integration for all parameter settings
- getvalueof/setvalueof functions for pattr compatibility
- notifyclients() calls for parameter change notifications
- Dynamic range handling from inspector

## 🚀 Usage

### Basic Setup
1. Add a **JSUI** object to your Max patch
2. Load `jsui.numbox.js` into the JSUI object
3. **Optional:** Add jsarguments for text justification: `left`, `centre`, or `right`

### Full Functionality
Connect these objects for complete feature set:

```
[mousestate] -> [globalMouse $1 $2 $3] -> [jsui]
[key] -> [keyInput $1] -> [jsui]
[live.thisdevice] -> [active $1] -> [jsui]
```

### Inspector Configuration
- **Range** - Set min/max values
- **Initial Value** - Enable and set reset value
- **Unit Style** - Choose display format
- **Parameter Name** - For pattr integration

## ❌ Known Issues

### Live Parameter Registration
Despite implementing all documented parameter functions, one issue remains:

- Parameter doesn't appear in Live's automation lane
- Cannot be MIDI mapped in Live
- Live shows "Parameter index received from Max is out of range" error

The object works correctly for pattr and general Max use, but Live's parameter system doesn't recognize it as a valid parameter. All parameter functions (`getvalueof`, `setvalueof`, `notifyclients`) are implemented correctly.

## 🔍 Tested Scenarios

### ✅ Working
- Max patches with full functionality
- Patcher persistence (saves/restores all state)
- Inspector integration
- User interaction (mouse, keyboard, focus)
- Visual theming and states

### ❓ Untested
- Live parameter registration fix
- Max for Live device distribution
- Live automation recording

## 📚 Documentation

- Code comments with status tracking
- JSUI attribute reference: [`jsui-object-prop.md`](jsui-object-prop.md)

## 📄 License

MIT

## 👨‍💻 Author

Robert Koster - Fixation Studios  
June 30, 2025
