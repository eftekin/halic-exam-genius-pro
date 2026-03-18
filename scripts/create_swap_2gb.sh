#!/usr/bin/env bash
set -euo pipefail

# Create and enable a 2GB swap file on Ubuntu/Debian droplets.
# Run as root: sudo bash create_swap_2gb.sh

SWAPFILE="/swapfile"
SWAPSIZE_MB=2048

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Please run as root (sudo)."
  exit 1
fi

if swapon --show | grep -q "$SWAPFILE"; then
  echo "Swap file already active at $SWAPFILE"
  exit 0
fi

if [[ -f "$SWAPFILE" ]]; then
  echo "Swap file exists but is not active. Re-using existing file."
else
  echo "Creating ${SWAPSIZE_MB}MB swap file..."
  if command -v fallocate >/dev/null 2>&1; then
    fallocate -l "${SWAPSIZE_MB}M" "$SWAPFILE"
  else
    dd if=/dev/zero of="$SWAPFILE" bs=1M count="$SWAPSIZE_MB" status=progress
  fi
fi

chmod 600 "$SWAPFILE"
mkswap "$SWAPFILE"
swapon "$SWAPFILE"

# Persist across reboots
if ! grep -q "^$SWAPFILE" /etc/fstab; then
  echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
fi

# Tune swap behavior for small VPS instances
sysctl vm.swappiness=10
sysctl vm.vfs_cache_pressure=50

# Persist sysctl values
if grep -q '^vm.swappiness=' /etc/sysctl.conf; then
  sed -i.bak 's/^vm.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
else
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

if grep -q '^vm.vfs_cache_pressure=' /etc/sysctl.conf; then
  sed -i.bak 's/^vm.vfs_cache_pressure=.*/vm.vfs_cache_pressure=50/' /etc/sysctl.conf
else
  echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
fi

echo
swapon --show
free -h

echo "2GB swap is now active and persistent."
