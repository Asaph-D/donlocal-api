Prérequis:
- SSH sans mot de passe (clé privée ajoutée sur la machine de contrôle)
- Ports ouverts entre master et workers (6443, 10250, 2379, 2380, 10251, 10252)

Usage basique depuis la machine de contrôle (dépôt placé dans /home/ubuntu/donlocal-api ou accessible depuis Ansible):

```bash
cd /chemin/vers/donlocal-api/ansible
ansible-playbook -i inventory.ini 01-prerequisites.yml
ansible-playbook -i inventory.ini 02-k8s-init-master.yml
ansible-playbook -i inventory.ini 03-k8s-join-workers.yml
ansible-playbook -i inventory.ini 04-deploy-postgres.yml
IMAGE_NAME=yourregistry/donlocal-api:latest ansible-playbook -i inventory.ini 05-deploy-backend.yml
```

Remarques:
- `05-deploy-backend.yml` utilise la variable d'environnement `IMAGE_NAME`.
- Le playbook applique les manifests avec `kubectl` en tant qu'utilisateur `ubuntu` sur le master.
- Optionnel: ajouter un job Jenkins qui exécute ces playbooks (et pousse l'image Docker dans un registry accessible).
