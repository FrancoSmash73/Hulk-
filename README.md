# ☎ HulkPhone — ViciDial WebRTC Softphone
> **Version 1.0.0** | Neon Green Theme | SIP.js 0.20.x | ViciDial Compatible

---

## 🟢 What Is HulkPhone?

HulkPhone is a browser-based **WebRTC SIP softphone** built for embedding into the
**ViciDial** call center agent interface. Inspired by ViciPhone and CyburPhone, it
combines the best patterns from both into a single, clean, themeable package.

It opens as a **popup window** from within the ViciDial agent screen, registers
your extension via WebSocket (wss://), and auto-joins the agent conference — exactly
how a production ViciDial webphone should work.

---

## 📁 File Structure

```
hulkphone/
├── hulkphone.php          ← Main entry point (PHP, renders the phone UI)
├── hulk_int_example.php   ← ViciDial integration bridge
├── css/
│   └── hulkphone.css      ← Neon green Hulk theme
├── js/
│   └── hulkphone.js       ← SIP.js WebRTC core engine
└── sounds/
    └── ring.mp3           ← Ringtone (add your own)
```

---

## ⚡ Installation

### 1. Clone/copy to your web server

```bash
# Option A — clone to your ViciDial web root
cd /var/www/html
git clone https://github.com/yourrepo/hulkphone.git

# Option B — manual copy
cp -r hulkphone/ /var/www/html/

# Set permissions
chmod -R 755 /var/www/html/hulkphone
chown -R apache:apache /var/www/html/hulkphone
```

### 2. Asterisk WebSocket & WebRTC Requirements

In your Asterisk `pjsip.conf` or SIP template, ensure:

```ini
[webrtc_template](!)
type=endpoint
transport=transport-wss
context=from-internal
disallow=all
allow=opus
allow=ulaw
allow=alaw
dtls_verify=no
dtls_rekey=0
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes              ; ← REQUIRED for SIP.js 0.20.x
use_avpf=yes
media_encryption=dtls
```

In `http.conf`:
```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/etc/asterisk/keys/asterisk.pem
tlsprivatekey=/etc/asterisk/keys/asterisk.key
```

### 3. Firewall Ports

Open these ports on your Asterisk server:

| Port | Protocol | Purpose |
|------|----------|---------|
| 8089 | TCP/WSS  | Asterisk WebSocket (SIP.js) |
| 10000-20000 | UDP | RTP Media |
| 3478 | UDP | STUN |

---

## 🔗 ViciDial Integration

### Option A — Set WebPhone URL in ViciDial Admin

In **ViciDial Admin → System Settings → WebPhone**:

```
http://YOUR_SERVER/hulkphone/hulkphone.php
```

ViciDial will append its own parameters automatically.

### Option B — Manual Popup (in custom scripts)

```javascript
function openHulkPhone(server, ext, pass, conf) {
    var url = '/hulkphone/hulkphone.php' +
        '?server_ip='  + encodeURIComponent(server) +
        '&ext='        + encodeURIComponent(ext) +
        '&pass='       + encodeURIComponent(pass) +
        '&conf_exten=' + encodeURIComponent(conf) +
        '&auto_answer=1';

    window.open(url, 'HulkPhone',
        'width=330,height=620,resizable=0,scrollbars=0,toolbar=0,menubar=0,location=0');
}
```

### URL Parameters

| Parameter     | Default          | Description |
|---------------|------------------|-------------|
| `server_ip`   | *(required)*     | Asterisk SIP server IP/hostname |
| `ext`         | *(required)*     | SIP extension number |
| `pass`        | *(required)*     | SIP password |
| `user`        | ext              | Agent username (display only) |
| `conf_exten`  | —                | Conference ext to auto-dial on register |
| `ws_port`     | `8089`           | Asterisk WebSocket port |
| `ws_path`     | `/ws`            | WebSocket path |
| `callerid`    | ext              | Caller ID display |
| `auto_answer` | `1`              | 1 = auto-call conf on registration |
| `language`    | `en`             | `en` or `es` |
| `stun_server` | stun.l.google.com:19302 | STUN server |

---

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0-9`, `*`, `#` | Dial pad digits |
| `Enter` | Call / Hang up |
| `Escape` | Hang up |
| `Backspace` | Delete last digit |
| `M` | Toggle mute |
| `H` | Toggle hold |

---

## 📡 ViciDial Parent Window Events

HulkPhone fires events to the ViciDial opener window:

```javascript
// In your ViciDial agent interface, listen for:
window.HulkPhoneEvent = function(event) {
    if (event === 'CALL_CONNECTED') { /* ... */ }
    if (event === 'CALL_ENDED')     { /* ... */ }
};

// OR via postMessage:
window.addEventListener('message', function(e) {
    if (e.data.source === 'hulkphone') {
        console.log('HulkPhone event:', e.data.event);
    }
});
```

---

## 🛠️ Customization

### Change Colors

Edit `css/hulkphone.css` `:root` block:

```css
:root {
    --hulk-green:  #39ff14;  /* Main neon green */
    --hulk-amber:  #ffcc00;  /* Mute button accent */
    --hulk-blue:   #00cfff;  /* Hold button accent */
    --hulk-red:    #ff2d2d;  /* Hangup / danger */
    --bg-void:     #060c06;  /* Background */
}
```

### Add a New Language

In `hulkphone.php`, add to the `$lang` array:

```php
'fr' => [
    'btn_call'    => 'APPELER',
    'btn_hangup'  => 'RACCROCHER',
    // ...
],
```

Then pass `?language=fr` in the URL.

---

## 📋 Changelog

### v1.0.0
- Initial release
- Full SIP.js 0.20.x WebRTC support (rtcp_mux=yes required)
- Auto-call conference extension on registration
- DTMF dialpad with letters
- Mute, Hold, Blind Transfer, Warm Transfer
- English and Spanish translations
- Keyboard shortcut support
- ViciDial parent window event bridge (postMessage)
- Neon Green "Hulk" theme with scanline CRT overlay
- Timer display
- Volume control

---

## 🙏 Credits

- Based on patterns from **ViciPhone** by Michael Cargile
- Enhanced by **CyburPhone** by carpenox / ccabrerar
- ViciDial integration docs from **deepwiki.com/ccabrerar/vicidial**
- WebRTC via **SIP.js** (sipjs.com)

## 📄 License

AGPL-3.0 — See LICENSE file.
