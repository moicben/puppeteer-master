# Redémarrer le service
sudo systemctl restart xrdp (si le droplet redémarre)
# Aussi lancer 1 fois Remote Desktop (si droplet redémarre : pour activer le display Xnvc )

# Vérifier le statut
sudo systemctl status xrdp

# Activer le service au démarrage
sudo systemctl enable xrdp

# Démarrer le service s'il est arrêté
sudo systemctl start xrdp

# Arrêter le service
sudo systemctl stop xrdp

# Voir les logs en cas de problème
sudo journalctl -u xrdp -f