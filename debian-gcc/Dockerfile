FROM debian:stable
RUN apt-get update -y;apt-get upgrade -y;apt-get install -y meson ninja-build git gcc
COPY ci-build.sh /ci-build
