<?php
/**
 * hulk_int_example.php
 * ─────────────────────────────────────────────────────────────────
 * ViciDial integration helper for HulkPhone.
 *
 * USAGE IN VICIDIAL:
 *   Place this file in your web root or /var/www/html/agc/
 *   In ViciDial Admin → Carriers → WebPhone URL, set:
 *
 *     http://YOUR_SERVER/hulkphone/hulk_int_example.php
 *
 *   OR call directly from agent interface JavaScript:
 *
 *     var phoneURL = buildHulkPhoneURL({
 *         server_ip:  '192.168.1.10',
 *         ext:        '8600',
 *         pass:       'secret',
 *         conf_exten: '8600',
 *         user:       'agent001'
 *     });
 *     window.open(phoneURL, 'HulkPhone', 'width=330,height=600,resizable=0');
 *
 * PARAMETERS PASSED BY VICIDIAL:
 *   VD_server_ip   → Asterisk server IP
 *   VD_login       → Agent extension
 *   VD_pass        → SIP password
 *   VD_phone_login → Phone login extension
 *   session_name   → ViciDial session name
 *
 * ─────────────────────────────────────────────────────────────────
 */

// Map ViciDial parameter names → HulkPhone parameter names
$server_ip  = isset($_GET['VD_server_ip'])   ? $_GET['VD_server_ip']   : '';
$ext        = isset($_GET['VD_login'])        ? $_GET['VD_login']        : '';
$pass       = isset($_GET['VD_pass'])         ? $_GET['VD_pass']         : '';
$phone_ext  = isset($_GET['VD_phone_login'])  ? $_GET['VD_phone_login']  : $ext;
$conf_exten = isset($_GET['conf_exten'])      ? $_GET['conf_exten']      : '8600' . $ext;

// Build redirect URL to hulkphone.php
$params = http_build_query([
    'server_ip'  => $server_ip,
    'ext'        => $phone_ext,
    'pass'       => $pass,
    'user'       => $ext,
    'conf_exten' => $conf_exten,
    'auto_answer'=> '1',
    'language'   => 'en',
]);

header('Location: hulkphone.php?' . $params);
exit;
?>
