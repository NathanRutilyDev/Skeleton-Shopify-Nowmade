@echo off
for /f "tokens=2" %%a in ('findstr "store:" config.yml') do set STORE=%%a
for /f "tokens=2" %%a in ('findstr "dev_theme_id:" config.yml') do set DEV_THEME_ID=%%a
echo %STORE% %DEV_THEME_ID%