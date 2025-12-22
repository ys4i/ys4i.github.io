FROM archlinux:latest

RUN pacman -Syu --noconfirm \
    && pacman -S --noconfirm \
    hugo \
    git \
    ca-certificates \
    && pacman -Scc --noconfirm

WORKDIR /site
