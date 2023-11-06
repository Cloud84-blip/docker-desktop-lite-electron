./node_modules/.bin/electron-rebuild

# if yarn is not installed
if ! [ -x "$(command -v yarn)" ]; then
  npm install -g yarn
fi

yarn dist