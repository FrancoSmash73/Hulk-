<?php
/**
 * HulkPhone - ViciDial WebRTC Softphone
 * Version: 1.0.0
 * Neon Green / Hulk Theme
 *
 * URL Parameters (passed by ViciDial):
 *   server_ip    - Asterisk SIP server IP/hostname
 *   ext          - SIP extension number
 *   pass         - SIP password
 *   user         - Agent username
 *   conf_exten   - Conference extension to auto-dial (usually 8600+)
 *   ws_port      - WebSocket port (default: 8089)
 *   ws_path      - WebSocket path (default: /ws)
 *   callerid     - Caller ID to display
 *   auto_answer  - 1 = auto-call conf on registration
 *   language     - en (default) | es
 *   stun_server  - STUN server (default: stun.l.google.com:19302)
 */

// ── Sanitize Inputs ───────────────────────────────────────────────────────────
function safe($key, $default = '') {
    if (isset($_GET[$key])) {
        return htmlspecialchars(trim($_GET[$key]), ENT_QUOTES, 'UTF-8');
    }
    return $default;
}

// ViciDial base64 parameter compatibility
if (isset($_GET["phone_login"]) && !empty($_GET["phone_login"])) {
    $ext         = base64_decode($_GET["phone_login"]);
    $pass        = base64_decode($_GET["phone_pass"] ?? "");
    $server_ip_raw = base64_decode($_GET["server_ip"] ?? "");
    $server_ip = "sip.campaignvoiceservices.com";
    $callerid    = base64_decode($_GET["callerid"] ?? $ext);
    $conf_exten  = "";
    $ws_port     = "8089";
    $ws_path     = "/ws";
    $auto_answer = "1";
    $language    = "en";
} else {

$server_ip   = safe('server_ip',   '');
$ext         = safe('ext',         '');
$pass        = safe('pass',        '');
$user        = safe('user',        '');
$conf_exten  = safe('conf_exten',  '');
$ws_port     = safe('ws_port',     '8089');
$ws_path     = safe('ws_path',     '/ws');
$callerid    = safe('callerid',    $ext);
$auto_answer = safe('auto_answer', '1');
$language    = safe('language',    'en');
$stun_server = safe('stun_server', 'stun.l.google.com:19302');
}
// Parse ViciDial options parameter
if (isset($_GET["options"]) && !empty($_GET["options"])) {
    $options_raw = base64_decode($_GET["options"]);
    if (preg_match("/SESSION(\\d+)/", $options_raw, $m)) {
        // Prepend '2' so the webphone joins as vici_agent_user (marked=yes)
        // ViciDial sends SESSION9600000; we dial 29600000 -> _29600XXX -> agent profile
        $conf_exten = '2' . $m[1];
    }
    if (preg_match("/AUTOANSWER_Y/", $options_raw)) {
        $auto_answer = "1";
    }
}


// Detect WSS vs WS (use wss for https pages)
$ws_protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'wss' : 'wss';

// Translations
$lang = [
    'en' => [
        'title'        => 'HulkPhone',
        'status_unreg' => 'NOT REGISTERED',
        'status_reg'   => 'REGISTERED',
        'status_call'  => 'IN CALL',
        'status_ring'  => 'RINGING...',
        'status_hold'  => 'ON HOLD',
        'status_conn'  => 'CONNECTING...',
        'btn_call'     => 'CALL',
        'btn_hangup'   => 'HANG UP',
        'btn_mute'     => 'MUTE',
        'btn_unmute'   => 'UNMUTE',
        'btn_hold'     => 'HOLD',
        'btn_unhold'   => 'RESUME',
        'btn_transfer' => 'XFER',
        'ext_label'    => 'Extension:',
        'server_label' => 'Server:',
    ],
    'es' => [
        'title'        => 'HulkPhone',
        'status_unreg' => 'NO REGISTRADO',
        'status_reg'   => 'REGISTRADO',
        'status_call'  => 'EN LLAMADA',
        'status_ring'  => 'SONANDO...',
        'status_hold'  => 'EN ESPERA',
        'status_conn'  => 'CONECTANDO...',
        'btn_call'     => 'LLAMAR',
        'btn_hangup'   => 'COLGAR',
        'btn_mute'     => 'SILENCIAR',
        'btn_unmute'   => 'ACTIVAR MIC',
        'btn_hold'     => 'ESPERA',
        'btn_unhold'   => 'RETOMAR',
        'btn_transfer' => 'TRANSFER',
        'ext_label'    => 'Extensión:',
        'server_label' => 'Servidor:',
    ],
];

$t = isset($lang[$language]) ? $lang[$language] : $lang['en'];
?>
<!DOCTYPE html>
<html lang="<?= $language ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title><?= $t['title'] ?></title>

    <!-- SIP.js 0.20.1 -->
    <script src="/hulkphone/js/sip.js?v=2"></script>

    <!-- HulkPhone Styles -->
    <link rel="stylesheet" href="css/hulkphone.css">

    <!-- Google Fonts: Rajdhani (display) + Share Tech Mono (mono) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
</head>
<body>

<!-- ══════════════════════════════════════════════════════════════
     HULKPHONE UI
═══════════════════════════════════════════════════════════════════ -->
<div id="hulkphone-wrapper">

    <!-- ── Header ────────────────────────────────────────── -->
    <div id="hp-header">
        <div id="hp-logo">
            <span class="hp-logo-icon">☎</span>
            <span class="hp-logo-text">HULK<em>PHONE</em></span>
        </div>
        <div id="hp-status-dot" class="status-dot unregistered"></div>
    </div>

    <!-- ── Status Banner ─────────────────────────────────── -->
    <div id="hp-status-bar">
        <span id="hp-status-text"><?= $t['status_unreg'] ?></span>
    </div>

    <!-- ── Info Row ───────────────────────────────────────── -->
    <div id="hp-info-row">
        <div class="hp-info-item">
            <span class="hp-info-label"><?= $t['ext_label'] ?></span>
            <span class="hp-info-value" id="hp-ext-display"><?= $ext ?: '----' ?></span>
        </div>
        <div class="hp-info-item">
            <span class="hp-info-label"><?= $t['server_label'] ?></span>
            <span class="hp-info-value" id="hp-server-display"><?= $server_ip ?: '---' ?></span>
        </div>
        <div class="hp-info-item">
            <span class="hp-info-label">TIMER</span>
            <span class="hp-info-value" id="hp-timer">00:00</span>
        </div>
    </div>

    <!-- ── Dial Display ──────────────────────────────────── -->
    <div id="hp-dial-display-wrap">
        <input type="text" id="hp-dial-input" placeholder="Enter number..." autocomplete="off" maxlength="20">
        <button id="hp-clear-btn" title="Clear" onclick="HulkPhone.clearInput()">⌫</button>
    </div>

    <!-- ── Dial Pad ───────────────────────────────────────── -->
    <div id="hp-dialpad">
        <?php
        $keys = [
            ['1', ''],    ['2', 'ABC'],  ['3', 'DEF'],
            ['4', 'GHI'], ['5', 'JKL'],  ['6', 'MNO'],
            ['7', 'PQRS'],['8', 'TUV'],  ['9', 'WXYZ'],
            ['*', ''],    ['0', '+'],     ['#', ''],
        ];
        foreach ($keys as $k) {
            echo '<button class="hp-key" onclick="HulkPhone.dialKey(\'' . $k[0] . '\')">';
            echo '<span class="hp-key-num">' . $k[0] . '</span>';
            if ($k[1]) echo '<span class="hp-key-alpha">' . $k[1] . '</span>';
            echo '</button>';
        }
        ?>
    </div>

    <!-- ── Call Controls ─────────────────────────────────── -->
    <div id="hp-controls">
        <button id="hp-call-btn"     class="hp-ctrl-btn green" onclick="HulkPhone.callAction()">
            <span class="hp-ctrl-icon">📞</span>
            <span class="hp-ctrl-label" id="hp-call-label"><?= $t['btn_call'] ?></span>
        </button>

        <button id="hp-mute-btn"     class="hp-ctrl-btn amber" onclick="HulkPhone.toggleMute()">
            <span class="hp-ctrl-icon">🎙</span>
            <span class="hp-ctrl-label" id="hp-mute-label"><?= $t['btn_mute'] ?></span>
        </button>

        <button id="hp-hold-btn"     class="hp-ctrl-btn blue"  onclick="HulkPhone.toggleHold()">
            <span class="hp-ctrl-icon">⏸</span>
            <span class="hp-ctrl-label" id="hp-hold-label"><?= $t['btn_hold'] ?></span>
        </button>
    </div>

    <!-- ── Transfer Row ──────────────────────────────────── -->
    <div id="hp-transfer-row">
        <input type="text" id="hp-xfer-input" placeholder="Transfer to..." autocomplete="off">
        <button class="hp-xfer-btn blind"   onclick="HulkPhone.blindTransfer()"><?= $t['btn_transfer'] ?> (Blind)</button>
        <button class="hp-xfer-btn warm"    onclick="HulkPhone.warmTransfer()">Warm</button>
    </div>

    <!-- ── Volume ─────────────────────────────────────────── -->
    <div id="hp-volume-row">
        <span class="hp-vol-label">🔊</span>
        <input type="range" id="hp-volume" min="0" max="1" step="0.05" value="0.8"
               oninput="HulkPhone.setVolume(this.value)">
    </div>

    <!-- ── Footer ────────────────────────────────────────── -->
    <div id="hp-footer">
        <span id="hp-version">HulkPhone v1.0 | ViciDial WebRTC</span>
    </div>

</div><!-- /#hulkphone-wrapper -->

<!-- Hidden audio element -->
<audio id="hp-remote-audio" autoplay></audio>
<audio id="hp-ring-audio" loop>
    <source src="sounds/ring.mp3" type="audio/mpeg">
</audio>

<!-- ══════════════════════════════════════════════════════════════
     CONFIG (injected by PHP — never expose passwords client-side
     in production; use a session token instead)
═══════════════════════════════════════════════════════════════════ -->
<script>
var HP_CONFIG = {
    server_ip:   "<?= $server_ip ?>",
    ext:         "<?= $ext ?>",
    pass:        "<?= $pass ?>",
    user:        "<?= $user ?>",
    conf_exten:  "<?= $conf_exten ?>",
    ws_url:      "<?= $ws_protocol ?>://<?= $server_ip ?>:<?= $ws_port . $ws_path ?>",
    callerid:    "<?= $callerid ?>",
    auto_answer: <?= ($auto_answer === '1') ? 'true' : 'false' ?>,
    stun:        "<?= $stun_server ?>",
    lang: {
        status_unreg: "<?= $t['status_unreg'] ?>",
        status_reg:   "<?= $t['status_reg'] ?>",
        status_call:  "<?= $t['status_call'] ?>",
        status_ring:  "<?= $t['status_ring'] ?>",
        status_hold:  "<?= $t['status_hold'] ?>",
        status_conn:  "<?= $t['status_conn'] ?>",
        btn_call:     "<?= $t['btn_call'] ?>",
        btn_hangup:   "<?= $t['btn_hangup'] ?>",
        btn_mute:     "<?= $t['btn_mute'] ?>",
        btn_unmute:   "<?= $t['btn_unmute'] ?>",
        btn_hold:     "<?= $t['btn_hold'] ?>",
        btn_unhold:   "<?= $t['btn_unhold'] ?>",
    }
};
</script>

<!-- HulkPhone Core -->
<script src="js/hulkphone.v2.js?v=7"></script>

</body>
</html>
