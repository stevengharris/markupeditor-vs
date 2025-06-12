#!/bin/sh

# To ensure the VSCode extension uses the current markupeditor-base script and styles, 
# place symlinks in the scripts and styles directory for the extension. This script
# is executed as a precompile step.
pushd ./scripts
ln -sf ../node_modules/markupeditor-base/dist/markupeditor.umd.js markupeditor.js
popd
pushd ./styles
ln -sf ../node_modules/markupeditor-base/styles/mirror.css mirror.css
ln -sf ../node_modules/markupeditor-base/styles/markup.css markup.css
ln -sf ../node_modules/markupeditor-base/styles/toolbar.css toolbar.css
popd