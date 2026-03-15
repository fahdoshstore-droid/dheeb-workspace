#!/bin/bash
# ═══════════════════════════════════════════
# 🐺 DHEEB WORKSPACE — Git Setup Script
# ═══════════════════════════════════════════
# شغّل هذا السكربت على السيرفر لربط الهيكل بـ GitHub
#
# الاستخدام:
#   chmod +x setup-git.sh
#   ./setup-git.sh YOUR_GITHUB_USERNAME
# ═══════════════════════════════════════════

set -e

# Colors
GOLD='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GOLD}"
echo "  🐺 DHEEB WORKSPACE — Git Setup"
echo "  ═══════════════════════════════"
echo -e "${NC}"

# Check argument
if [ -z "$1" ]; then
  echo -e "${RED}❌ أدخل اسم المستخدم على GitHub${NC}"
  echo "   Usage: ./setup-git.sh YOUR_GITHUB_USERNAME"
  exit 1
fi

GH_USER=$1
REPO_NAME="dheeb-workspace"
WORKSPACE="/home/ubuntu/.openclaw/workspace"

echo -e "${GOLD}[1/6]${NC} التحقق من Git..."
if ! command -v git &> /dev/null; then
  echo "  Installing git..."
  sudo apt-get update -qq && sudo apt-get install -y -qq git
fi
echo -e "  ${GREEN}✓${NC} Git متوفر"

echo -e "${GOLD}[2/6]${NC} إعداد Git config..."
git config --global user.name "Dheeb"
git config --global user.email "${GH_USER}@users.noreply.github.com"
git config --global init.defaultBranch main
echo -e "  ${GREEN}✓${NC} تم الإعداد"

echo -e "${GOLD}[3/6]${NC} التحقق من SSH key..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
  echo "  Generating SSH key..."
  ssh-keygen -t ed25519 -C "${GH_USER}@dheeb" -f ~/.ssh/id_ed25519 -N ""
  echo ""
  echo -e "  ${GOLD}⚠️  مهم! أضف هذا المفتاح على GitHub:${NC}"
  echo "  Settings → SSH Keys → New SSH Key"
  echo ""
  echo -e "  ${GREEN}المفتاح:${NC}"
  cat ~/.ssh/id_ed25519.pub
  echo ""
  echo -e "  ${GOLD}بعد ما تضيفه، اضغط Enter للمتابعة...${NC}"
  read -r
fi
echo -e "  ${GREEN}✓${NC} SSH key جاهز"

echo -e "${GOLD}[4/6]${NC} فحص الملفات الحساسة..."
cd "$WORKSPACE"

# Check for exposed secrets
FOUND_SECRETS=0
for pattern in "API_KEY=" "TOKEN=" "SECRET=" "PASSWORD="; do
  if grep -rl "$pattern" --include="*.js" --include="*.json" --include="*.md" . 2>/dev/null | grep -v node_modules | grep -v .env.example | head -5; then
    echo -e "  ${RED}⚠️  وجدت أسرار محتملة في الملفات أعلاه${NC}"
    FOUND_SECRETS=1
  fi
done

if [ $FOUND_SECRETS -eq 1 ]; then
  echo -e "  ${RED}❌ نظّف الملفات أول! انقل الأسرار إلى .env${NC}"
  echo -e "  ${GOLD}تبي تكمل على مسؤوليتك؟ (y/N)${NC}"
  read -r CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "  Aborted."
    exit 1
  fi
else
  echo -e "  ${GREEN}✓${NC} ما لقيت أسرار مكشوفة"
fi

echo -e "${GOLD}[5/6]${NC} تهيئة Git repository..."

# Copy template files if not exist
if [ ! -f .gitignore ]; then
  echo "  ⚠️  ملف .gitignore غير موجود — انسخه من الملفات المحملة"
fi

git init
git add .
git commit -m "🐺 init: DHEEB Workspace — first commit

- Command Center (strategy, rules, priorities, daily-loop)
- Trading System structure
- Projects structure (trading, scout-ai, qitaa)
- Memory framework
- Skills framework
- .gitignore (secrets protected)
- .env.example template"

echo -e "  ${GREEN}✓${NC} تم الـ commit الأول"

echo -e "${GOLD}[6/6]${NC} ربط GitHub..."
echo ""
echo -e "  ${GOLD}═══════════════════════════════════════${NC}"
echo -e "  ${GOLD}قبل المتابعة، أنشئ ريبو على GitHub:${NC}"
echo ""
echo -e "  1. افتح: ${GREEN}https://github.com/new${NC}"
echo -e "  2. الاسم: ${GREEN}${REPO_NAME}${NC}"
echo -e "  3. النوع: ${RED}Private${NC} ← مهم!"
echo -e "  4. لا تضف README أو .gitignore"
echo -e "  5. اضغط Create repository"
echo ""
echo -e "  ${GOLD}بعد ما تنشئه، اضغط Enter...${NC}"
echo -e "  ${GOLD}═══════════════════════════════════════${NC}"
read -r

git remote add origin "git@github.com:${GH_USER}/${REPO_NAME}.git"
git push -u origin main

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  🐺 تم بنجاح!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "  الريبو: ${GOLD}https://github.com/${GH_USER}/${REPO_NAME}${NC}"
echo ""
echo -e "  الأوامر اليومية:"
echo -e "  ${GREEN}git add . && git commit -m 'وصف' && git push${NC}"
echo ""
echo -e "  🐺 ذيب — الذئب ما ينام"
