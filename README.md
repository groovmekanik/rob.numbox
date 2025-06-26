# 🎛️ rob.numbox

**⚠️ PROJECT STATUS: ON HOLD - JSUI PARAMETER PERSISTENCE ISSUE ⚠️**

A JSUI-based attempt to create a `live.numbox` replacement for Max/MSP that encountered **parameter persistence issues** when saved in Max for Live devices.

## 🚨 Critical Discovery

During development, we discovered that while **JSUI parameter attributes can be set successfully**, they **do not persist when saved in Max for Live devices**:

### **The Problem**
- **Parameter attributes can be set** during runtime (✅ `_parameter_invisible: 0` works)
- **Attributes appear correct** when inspected (✅ all parameter settings work)
- **Parameters don't persist** when Max for Live device is saved and reloaded
- **JSUI parameter state is lost** between device sessions

### **Project Status: SUSPENDED**

This project is **currently on hold** pending clarification from Cycling '74 regarding whether JSUI parameter settings are supposed to persist in Max for Live devices, and if so, what the correct implementation method is.

---

## 📋 What We Built (Proof of Concept)

**rob.numbox** is a functional JSUI control that replicates `live.numbox` behavior and can set parameter attributes, but **parameter settings don't persist in Max for Live devices**.

## ✅ Features That Work

- 🖱️ **Full live.numbox interaction** - Mouse dragging, keyboard editing, double-click reset
- ⌨️ **Keyboard editing mode** - Direct number entry with visual cursor
- 🎨 **Dynamic Live theme support** - Automatic color adaptation with active/inactive states  
- 📐 **Text justification** - Left, center, right alignment via jsarguments
- 🔢 **Complete unit formatting** - int, float, time (ms), hertz (Hz), dB, percent (%), etc.
- 👁️ **Focus management** - Visual focus indicators with crosshair corners
- 🔒 **Cursor locking** - Mouse cursor locks during drag operations
- ⚡ **Fine adjustment** - Shift for precise control
- 📏 **Size constraints** - Fixed 15px height like live.numbox
- ✅ **Parameter attribute setting** - All parameter attributes can be set successfully

## ❌ What Doesn't Work (The Critical Issue)

- **❌ Parameter persistence in M4L devices** - Settings don't save with device
- **❌ Reliable Max for Live integration** - Parameter state lost between sessions
- **❌ Production readiness** - Cannot be used reliably in distributed devices

## 🔍 Technical Investigation

We successfully demonstrated that JSUI parameter attributes CAN be set:
- `parameter_enable: 1` ✅ (works and can be set)
- `_parameter_type: 0` (float) ✅ (works and can be set)  
- `_parameter_range: [min, max]` ✅ (works and can be set)
- `_parameter_invisible: 0` ✅ (works and can be set)
- `_parameter_initial_enable: 1` ✅ (works and can be set)

### **The Core Issue**
**Parameter settings don't persist when the Max for Live device is saved and reloaded.** The JSUI object appears to lose its parameter configuration between sessions.

## 📖 Documentation Generated

This project generated comprehensive documentation:

- **[`jsui-object-prop.md`](jsui-object-prop.md)** - Complete JSUI attribute reference with 70+ properties documented
- **Parameter system investigation** - Detailed analysis of what can be set vs. what persists

## 🔧 For Cycling '74

**Questions that need official answers:**

1. **Are JSUI parameter settings supposed to persist in Max for Live devices?**
2. **What is the correct way to ensure JSUI parameter persistence in M4L?**
3. **Is there a specific initialization sequence required for JSUI parameters?**
4. **Are there additional steps needed beyond `setattr()` calls for parameter persistence?**

## 🚀 Usage (As Proof of Concept)

### Setup
1. Add a **JSUI** object to your Max patch
2. Load `jsui.numbox.js` into the JSUI object  
3. Call `initializeObject()` to set parameter attributes
4. **For full functionality, connect:**
   - `mousestate` system for cursor locking
   - `key` object for keyboard input
   - `live.thisdevice` for active state and initialization trigger

### **⚠️ Important Limitation**
While this object functions correctly and can set parameter attributes, **parameter settings don't persist when saved in Max for Live devices**, making it unreliable for production use.

## 📄 Next Steps

1. **Contact Cycling '74** with specific questions about JSUI parameter persistence in M4L
2. **Wait for official clarification** on proper JSUI parameter persistence methods
3. **Resume development** if/when reliable JSUI parameter persistence is confirmed possible
4. **Consider alternative approaches** if JSUI parameter persistence is fundamentally limited

## 📄 License

MIT

## 👨‍💻 Author

Robert Koster - Fixation Studios  
June 22, 2025

---

**This project serves as documentation of JSUI parameter persistence limitations in Max for Live devices and a request for clarification from Cycling '74 on proper JSUI parameter persistence methods.**

### 📚 Resources
- [Complete JSUI Attribute Documentation](jsui-object-prop.md)  
- [Max/MSP JSUI Documentation](https://docs.cycling74.com/max8/vignettes/jsui)
- [Parameter System Investigation Results](jsui-object-prop.md#jsui-parameter-system-status---unverifiedproblematic)
