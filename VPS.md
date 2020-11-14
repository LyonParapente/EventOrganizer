This tutorial describes how to fully configure the application on a Debian system.

(VPS stands for Virtual Private Server)

## Install required packages
```
sudo apt-get update
sudo apt-get upgrade
sudo apt install git npm python3-pip python3-venv nginx rsync
```

## Install EventOrganizer from sources
`git clone https://github.com/LyonParapente/EventOrganizer`

### front
```
cd EventOrganizer/front
npm install --dev
gulp  # this compiles front
```

### back
```
cd ../back
python3 -m venv env
source env/bin/activate
pip install wheel  # to ensure that our packages will install even if they are missing wheel archives
pip install -r requirements.txt
pip install gunicorn
```

## Setup application
```
cp secrets.sample.py secrets.py
nano secrets.py  # make required changes
```

## Manual tests to run application
```
#python3 app_flask.py
#gunicorn --bind 0.0.0.0:8000 app_flask:app
#Must be root port ports<1024
#sudo gunicorn3 --bind 0.0.0.0:80 -w 4 app_flask:app -u <user> -g <group> --pythonpath ~/EventOrganizer/back/env/lib/python3.7/site-packages
```

We're now done with our virtual environment, so we can deactivate it:  
`deactivate`

## Create dedicated user
Replace `<user>` with the name you want
```
sudo useradd -M -N -d ~/EventOrganizer/ <user> -s /bin/bash
sudo chown <user>:www-data -R ~/EventOrganizer/
```

## Create a systemd service
(You can also use supervisor rather than systemd)

`sudo nano /etc/systemd/system/eventorganizer.service`

Fill this in, don't forget to replace `<user>`:
```
[Unit]
Description=EventOrganizer Gunicorn instance
After=network.target

[Service]
User=<user>
Group=www-data
WorkingDirectory=/home/<user>/EventOrganizer/back
Environment="PATH=/home/<user>/EventOrganizer/back/env/bin"
ExecStart=/home/<user>/EventOrganizer/back/env/bin/gunicorn --workers 4 --bind unix:eventorganizer.sock -m 007 app_flask:app
Restart=always

[Install]
WantedBy=multi-user.target
```
Then enable, start and check the service:
```
sudo systemctl enable eventorganizer
sudo systemctl start eventorganizer
sudo systemctl status eventorganizer
```

## Configuring Nginx to Proxy Requests

### HTTP listener
`sudo nano /etc/nginx/sites-available/eventorganizer`

Copy this content:
```
server {
    listen 80;
    server_name <your_domain>;

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/<user>/EventOrganizer/back/eventorganizer.sock;
    }
}
```
`<your_domain>` = calendrier.lyonparapente.fr in our case  
Note: we have a DNS entry type CNAME to link this to the hosting server  

Enable the configuration:  
`sudo ln -s /etc/nginx/sites-available/eventorganizer /etc/nginx/sites-enabled`

Test for syntax errors:  
`sudo nginx -t`

Restart nginx:  
`sudo systemctl restart nginx`


### Activate HTTPS
```
sudo apt install python3-certbot-nginx
sudo certbot --nginx -d <your_domain>
```

Activate HTTP2 by editing:  
`sudo nano /etc/nginx/sites-enabled/eventorganizer`  
Add "http2" in the following line:  
`listen 443 ssl http2; # managed by Certbot`

## Secure your server
```
sudo apt-get install fail2ban
nano /etc/ssh/sshd_config  # Set Port to something else than 22
/etc/init.d/ssh restart
```
### Hardening nginx
`sudo nano /etc/nginx/sites-enabled/eventorganizer`
Add this at the top of the file:
```
# don't send the nginx version number in error pages and Server header
server_tokens off;

# config to don't allow the browser to render the page inside an frame or iframe
add_header X-Frame-Options SAMEORIGIN;
```
Comment the following line:  
`include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot`  
and add this in the section:
```
    # enables server-side protection from BEAST attacks
    # http://blog.ivanristic.com/2013/09/is-beast-still-a-threat.html
    ssl_prefer_server_ciphers on;
    # disable SSLv3(enabled by default since nginx 0.8.19) since it's less secure then TLS http://en.wikipedia.org/wiki/Secure_Sockets_Layer#SSL_3.0
    ssl_protocols TLSv1.2 TLSv1.3;
    # ciphers chosen for forward secrecy and compatibility
    # http://blog.ivanristic.com/2013/08/configuring-apache-nginx-and-openssl-for-forward-secrecy.html
    ssl_ciphers 'ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-S$

    # enable ocsp stapling (mechanism by which a site can convey certificate revocation information to visitors in a privacy-preserving, scalable manner)
    # http://blog.mozilla.org/security/2013/07/29/ocsp-stapling-in-firefox/
    resolver 8.8.8.8 8.8.4.4;
    ssl_stapling on;
    ssl_stapling_verify on;
```
Test: `sudo nginx -t`  
Apply changes: `sudo systemctl restart nginx`  


## Useful
A few helpful commands:
```
source ~/EventOrganizer/back/env/bin/activate
less /var/log/nginx/error.log
less /var/log/nginx/access.log
journalctl -u nginx
journalctl -u eventorganizer
echo "alias o='ls -AlFh --time-style=long-iso --color=auto'" >~/.bash_aliases
```

## Links
https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-gunicorn-and-nginx-on-ubuntu-20-04
