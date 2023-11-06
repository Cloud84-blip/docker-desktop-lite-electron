@echo off
.\node_modules\.bin\electron-rebuild.cmd

rem Check if yarn is installed
yarn --version 2>nul
if %errorlevel% neq 0 (
  npm install -g yarn
)

yarn dist
