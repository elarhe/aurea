#!/usr/bin/env bash
# ============================================================
# Aurea - Script de configuración de MongoDB local en macOS
# Uso: bash setup-local-db.sh
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # sin color

echo -e "${GREEN}=== Aurea: configuración de MongoDB local ===${NC}\n"

# 1. Verificar Homebrew
if ! command -v brew >/dev/null 2>&1; then
  echo -e "${RED}Homebrew no está instalado.${NC}"
  echo "Instálalo con:"
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi
echo -e "${GREEN}✓${NC} Homebrew detectado"

# 2. Verificar / instalar MongoDB Community
if ! brew list mongodb-community >/dev/null 2>&1; then
  echo -e "${YELLOW}MongoDB no está instalado. Instalando...${NC}"
  brew tap mongodb/brew
  brew install mongodb-community
else
  echo -e "${GREEN}✓${NC} MongoDB ya instalado"
fi

# 3. Iniciar MongoDB como servicio
if brew services list | grep mongodb-community | grep -q started; then
  echo -e "${GREEN}✓${NC} MongoDB ya está corriendo"
else
  echo -e "${YELLOW}Iniciando MongoDB...${NC}"
  brew services start mongodb-community
  sleep 2
fi

# 4. Comprobar conexión
if command -v mongosh >/dev/null 2>&1; then
  if mongosh --quiet --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Conexión a mongodb://127.0.0.1:27017 OK"
  else
    echo -e "${RED}✗${NC} No se puede conectar a MongoDB"
    exit 1
  fi
else
  echo -e "${YELLOW}!${NC} mongosh no encontrado, saltando verificación de ping"
fi

# 5. Instalar dependencias del backend si no están
if [ ! -d node_modules ]; then
  echo -e "${YELLOW}Instalando dependencias del backend...${NC}"
  npm install
else
  echo -e "${GREEN}✓${NC} Dependencias del backend ya instaladas"
fi

# 6. Asegurar que existe .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creando .env desde .env.example...${NC}"
  cp .env.example .env
fi
echo -e "${GREEN}✓${NC} Archivo .env presente"

# 7. Lanzar el seed
echo -e "\n${GREEN}=== Lanzando seed inicial ===${NC}"
npm run seed

echo -e "\n${GREEN}=== ¡Listo! ===${NC}"
echo "MongoDB está corriendo en mongodb://127.0.0.1:27017/aurea"
echo ""
echo "Para verla visualmente, descarga MongoDB Compass:"
echo "  https://www.mongodb.com/products/compass"
echo "Y conéctate con la URI: mongodb://127.0.0.1:27017"
echo ""
echo "Para arrancar el backend:  npm run dev"
echo "Para detener MongoDB:      brew services stop mongodb-community"
