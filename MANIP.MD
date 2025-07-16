# 1. (Google Sheets) Prepare batch for passports_data.csv
# 2. node identity/importToSupabase.js
# 3. (Photoshop) Import Data Sets = passports_data.csv
# 4. (Photoshop) File > Exports > Data Sets to Files (PSD)
# 5. (Photoshop) File > Scripts > Image Processor 
# 6. (Finder) Place generated JPEG in ../proceed + (facultative) Delete PSDs 
# 7. node identity/renamePassports.js 
# 8. (Droplet or Local) export DISPLAY=:10 
# 8.1 (Droplet) ssh -i ssh-key root@159.223.28.175
# 8.2 (Droplet) cd puppeteer-master
# 8.3 (Droplet) git pull / push (Local)
# 9. (Droplet or Local) node gateways/bricks/bricksRegister.js 