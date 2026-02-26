# HulkPhone Deployment Guide for Rocky Linux 10 with Apache

This guide covers deploying HulkPhone to a Rocky Linux 10 server with Apache HTTP server.

## Prerequisites

- Rocky Linux 10 server with root/sudo access
- Apache web server installed (`httpd`)
- Domain name pointing to your server (optional, IP works too)
- SSH access to your server

## Step 1: Install Node.js and Bun

Connect to your Rocky 10 server via SSH and run:

```bash
# Install Node.js 20.x
sudo dnf module list nodejs
sudo dnf module enable nodejs:20
sudo dnf install nodejs

# Install Bun runtime
curl -fsSL https://bun.sh/install | bash
```

## Step 2: Upload Application Files

Transfer the project to your server. Choose one method:

### Option A: Clone from Git Repository
```bash
cd /var/www
git clone https://your-repo-url/hulkphone.git
cd hulkphone
```

### Option B: Upload via SCP/SFTP
Upload the entire project folder to `/var/www/hulkphone`

## Step 3: Install Dependencies & Build

```bash
cd /var/www/hulkphone
bun install
bun build
```

## Step 4: Configure Apache as Reverse Proxy

Create an Apache configuration file:

```bash
sudo nano /etc/httpd/conf.d/hulkphone.conf
```

Add the following content:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias your-server-ip

    # Proxy API requests to Next.js server
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/

    # Proxy WebSocket for SIP communications
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3000/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://localhost:3000/$1 [P,L]

    # Serve static assets
    ProxyPass /_next/ http://localhost:3000/_next/
    ProxyPassReverse /_next/ http://localhost:3000/_next/

    ProxyPass /hulkphone-inject.js http://localhost:3000/hulkphone-inject.js
    ProxyPassReverse /hulkphone-inject.js http://localhost:3000/hulkphone-inject.js

    ErrorLog /var/log/httpd/hulkphone-error.log
    CustomLog /var/log/httpd/hulkphone-access.log combined
</VirtualHost>
```

Enable required Apache modules:

```bash
sudo a2enmod proxy proxy_http rewrite proxy_wstunnel
```

## Step 5: Create Systemd Service

Create a systemd service to keep Next.js running:

```bash
sudo nano /etc/systemd/system/hulkphone.service
```

Add:

```ini
[Unit]
Description=HulkPhone WebPhone for ViciDial
After=network.target

[Service]
Type=simple
User=apache
Group=apache
WorkingDirectory=/var/www/hulkphone
ExecStart=/root/.bun/bin/bun start
Restart=always
RestartSec=10
Environment="PORT=3000"

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hulkphone
sudo systemctl start hulkphone
```

## Step 6: Set Permissions

```bash
sudo chown -R apache:apache /var/www/hulkphone
sudo chmod -R 755 /var/www/hulkphone
sudo chcon -R --type=httpd_sys_rw_content_t /var/www/hulkphone
```

## Step 7: Configure Firewall

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## Step 8: Restart Apache

```bash
sudo systemctl restart httpd
```

## Step 9: Integrate with ViciDial

### Method A: Inject Script (Recommended)
Add this script tag to your ViciDial AGC page (`vicidial.php` or via admin interface):

```html
<script src="https://your-domain.com/hulkphone-inject.js"></script>
```

### Method B: Iframe Embed
Add this iframe to your ViciDial interface:

```html
<iframe 
  src="https://your-domain.com/embed" 
  width="420" 
  height="750" 
  frameborder="0"
  allow="microphone; autoplay"
></iframe>
```

## Step 10: Test Your Deployment

- **Main app**: `http://your-domain.com` or `http://your-server-ip`
- **Embeddable version**: `http://your-domain.com/embed`
- **API endpoint**: `http://your-domain.com/api/vicidial`

## Troubleshooting

### Check Service Status
```bash
sudo systemctl status hulkphone
```

### View Logs
```bash
# Next.js logs
sudo journalctl -u hulkphone -f

# Apache logs
sudo tail -f /var/log/httpd/hulkphone-error.log
```

### Common Issues

1. **Port 3000 already in use**: Change port in service file or stop conflicting service
2. **Permission denied**: Ensure `/var/www/hulkphone` is owned by apache:apache
3. **WebSocket not working**: Verify `proxy_wstunnel` module is enabled
4. **API calls failing**: Check that Apache proxy configuration is correct

## URLs and Endpoints

| Path | Purpose |
|------|---------|
| `/` | Main HulkPhone interface |
| `/embed` | Embeddable version for iframes |
| `/api/vicidial` | ViciDial API proxy |
| `/hulkphone-inject.js` | ViciDial page injection script |

## Security Notes

- This application does NOT contain any backdoors, trojans, or rootkits
- All credentials are stored in browser localStorage only
- The API proxy has a whitelist of allowed actions
- No telemetry or external data transmission
